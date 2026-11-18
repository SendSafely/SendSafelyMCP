import { chmod, lstat, mkdir, realpath } from "node:fs/promises";
import path from "node:path";
const PACKAGE_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export function assertSafePackageId(packageId) {
    if (!PACKAGE_ID_PATTERN.test(packageId)) {
        throw new Error("Refusing to use package id: expected the XXXX-XXXX format " +
            "(uppercase letters and digits).");
    }
    return packageId;
}
export async function preparePackageDir(root, packageId) {
    assertSafePackageId(packageId);
    await mkdir(root, { recursive: true, mode: 0o700 });
    const realRoot = await realpath(root);
    const target = path.join(realRoot, packageId);
    if (path.dirname(target) !== realRoot) {
        throw new Error("Refusing to use package id: it resolves outside the download root.");
    }
    await mkdir(target, { recursive: true, mode: 0o700 });
    const existing = await lstat(target);
    if (!existing.isDirectory()) {
        throw new Error(`Refusing to use '${target}': path exists and is not a real directory ` +
            "(symlink or file). Remove it or point SENDSAFELY_DOWNLOAD_DIR at a " +
            "dedicated directory.");
    }
    await chmod(target, 0o700);
    if (typeof process.getuid === "function") {
        const uid = process.getuid();
        if (!isTrustedRoot(await lstat(realRoot), uid)) {
            throw new Error(`Refusing to use download root '${realRoot}': it must be owned by ` +
                "the running user and not writable by other local users. Point " +
                "SENDSAFELY_DOWNLOAD_DIR at a directory you own and remove group " +
                "and other write access (chmod go-w).");
        }
        if (!isPrivateToUser(await lstat(target), uid)) {
            throw new Error(`Refusing to use '${target}': it must be owned by the running user ` +
                "with owner-only permissions so decrypted plaintext is not readable " +
                "by other local users.");
        }
    }
    return target;
}
export function isTrustedRoot(stats, uid) {
    if (stats.uid !== uid && stats.uid !== 0)
        return false;
    return (stats.mode & 0o022) === 0 || (stats.mode & 0o1000) !== 0;
}
export function isPrivateToUser(stats, uid) {
    return stats.uid === uid && (stats.mode & 0o077) === 0;
}
