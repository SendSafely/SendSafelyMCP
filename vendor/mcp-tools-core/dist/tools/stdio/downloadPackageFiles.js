import path from "node:path";
import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../../approval.js";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { assertSafePackageId, preparePackageDir } from "../../utils/packageDir.js";
import { sanitizeFilename } from "../../utils/sanitizeFilename.js";
import { downloadFileToPath, packageInformation, packageInformationFromLink, } from "../../sdk/sdkPromise.js";
export function extractKeyCode(link) {
    const hashIdx = link.indexOf("#");
    if (hashIdx === -1)
        return null;
    const params = new URLSearchParams(link.slice(hashIdx + 1));
    for (const [key, value] of params) {
        if (key.toLowerCase() === "keycode")
            return value;
    }
    return null;
}
export async function handleDownloadPackageFiles(args, extra, ctx, cacheFor) {
    return runTool("download_package_files", "Failed to download package", async () => {
        const client = await ctx.getClient(extra);
        let resolved;
        if (args.link) {
            const keyCode = extractKeyCode(args.link);
            if (!keyCode) {
                return jsonError("Invalid SendSafely link: missing #keyCode= fragment.");
            }
            const info = await packageInformationFromLink(client, args.link);
            if (cacheFor && info.serverSecret) {
                cacheFor(extra).set(String(info.packageId), {
                    keyCode,
                    serverSecret: info.serverSecret,
                    ...(info.packageCode ? { packageCode: info.packageCode } : {}),
                });
            }
            resolved = { packageInfo: info, keyCode };
        }
        else if (args.package_id) {
            if (!cacheFor) {
                return jsonError("Downloading by package_id requires a cached Keycode, which this " +
                    "transport does not provide. Supply the full secure link " +
                    "(including the #keyCode= fragment) instead.");
            }
            const secrets = cacheFor(extra).get(args.package_id);
            if (!secrets)
                throw new MissingPackageSecretsError(args.package_id);
            const info = await packageInformation(client, args.package_id);
            resolved = { packageInfo: info, keyCode: secrets.keyCode };
        }
        else {
            return jsonError("Provide either `link` (a full secure link including the #keyCode= " +
                "fragment) or `package_id` (with the package's Keycode already " +
                "cached via get_package_keycode or get_package_information_from_link).");
        }
        const { packageInfo, keyCode } = resolved;
        const packageId = String(packageInfo.packageId);
        const sender = String(packageInfo.packageSender ?? "");
        const files = packageInfo.files ?? [];
        const downloadDir = ctx.getDownloadDir(extra);
        const packageDir = path.join(downloadDir, assertSafePackageId(packageId));
        const approval = await ctx.requireUserApproval(`Download and decrypt ${files.length} file(s) from SendSafely package ` +
            `${packageId}${sender ? ` (sent by ${sender})` : ""} to ${packageDir}?\n\n` +
            "Decrypted copies will be written to the local download directory.");
        const denied = approvalGateError(approval, "decrypt this package's files to the local download directory", {
            proceedWithoutPrompt: args.proceed_without_prompt,
            abortPrefix: "Download aborted",
        });
        if (denied)
            return denied;
        const realDir = await preparePackageDir(downloadDir, packageId);
        const downloaded = [];
        const rejected = [];
        const failed = [];
        for (const f of files) {
            const fileId = f.fileId;
            const rawName = String(f.fileName);
            const safeName = sanitizeFilename(rawName);
            const targetPath = path.resolve(realDir, safeName);
            if (targetPath !== realDir && !targetPath.startsWith(realDir + path.sep)) {
                process.stderr.write(`SECURITY: rejected file '${rawName}' (id=${fileId}) — ` +
                    `resolved path escapes package directory\n`);
                rejected.push({
                    file_name: rawName,
                    file_id: fileId,
                    reason: "resolved path escapes package directory",
                });
                continue;
            }
            try {
                await downloadFileToPath(client, packageId, fileId, keyCode, {
                    path: realDir,
                    fileName: safeName,
                });
                downloaded.push({
                    file_name: safeName,
                    original_file_name: rawName,
                    file_id: fileId,
                    file_size: Number(f.fileSize ?? 0),
                    local_path: targetPath,
                });
            }
            catch (dlErr) {
                const reason = dlErr instanceof Error ? dlErr.message : String(dlErr);
                process.stderr.write(`DOWNLOAD_FAILED package=${packageId} file='${rawName}' ` +
                    `id=${fileId}: ${reason}\n`);
                failed.push({
                    file_name: rawName,
                    file_id: fileId,
                    reason,
                });
            }
        }
        const attempted = downloaded.length + failed.length;
        if (attempted > 0 && downloaded.length === 0) {
            return jsonError("Failed to download any files from the package.", {
                package_id: packageId,
                sender,
                download_directory: packageDir,
                failed,
                ...(rejected.length > 0 ? { rejected } : {}),
            });
        }
        const response = {
            status: "success",
            package_id: packageId,
            sender,
            download_directory: packageDir,
            files: downloaded,
            message: "Files downloaded successfully. You MUST ask the user for " +
                "explicit permission before reading any file contents.",
        };
        if (rejected.length > 0) {
            response.rejected = rejected;
        }
        if (failed.length > 0) {
            response.failed = failed;
            response.partial_failure = true;
            response.message =
                `Downloaded ${downloaded.length} of ${attempted} files; ` +
                    `${failed.length} failed. See 'failed' for per-file reasons. ` +
                    "You MUST ask the user for explicit permission before reading " +
                    "any file contents.";
        }
        return jsonResult(response);
    });
}
export function registerDownloadPackageFiles(mcp, ctx, cacheFor) {
    mcp.registerTool("download_package_files", {
        title: "Download Package Files",
        description: "Download and decrypt all files from a SendSafely package. Accepts " +
            "EITHER of two inputs:\n" +
            "  • link — a full secure link including the #keyCode= fragment. " +
            "Self-contained (the key travels in the link), so it works with no " +
            "Trusted Device and no prior state. Use this for a link the user " +
            "pasted from an email.\n" +
            "  • package_id — the package ID, when the package's Keycode is " +
            "already in the server-side cache. Populate the cache first with " +
            "get_package_keycode (Trusted Device) or " +
            "get_package_information_from_link (keyed link). This is the same " +
            "Keycode-from-cache flow download_file_from_directory uses for " +
            "workspace files, and is the way to download a Transfer or Dropzone " +
            "package by id after resolving its Keycode via a Trusted Device — " +
            "without re-pasting the link.\n" +
            "If both are supplied, the link is used. " +
            "Files are saved to <download_dir>/<packageId>/<file_name>, where " +
            'any of the characters <>:"/\\|?* in the original file name are ' +
            "replaced with '_' (matching the SendSafely SDK's sanitization). " +
            "If two files in the same package sanitize to the same name, the " +
            "later download overwrites the earlier one. " +
            "ACCESSING CONTENTS: the returned local_path is in the SERVER's " +
            "managed download directory, which is very likely NOT reachable by " +
            "your own file-reading tools when this server runs in a sandbox or " +
            "on a different host. Do not open it directly and do not report the " +
            "download as unreadable if your file tools cannot find it. " +
            "read_downloaded_file is the ONLY reliable way to access the " +
            "decrypted contents; always route reads through it using this " +
            "local_path, and ask the user for explicit permission first. " +
            "CONSENT: this tool writes decrypted files to local disk, so it " +
            "requires user approval via MCP elicitation. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            link: z
                .string()
                .optional()
                .describe("Full SendSafely secure link including the #keyCode= fragment. " +
                "Provide this OR package_id."),
            package_id: z
                .string()
                .optional()
                .describe("The unique SendSafely package ID. Use instead of link when the " +
                "package's Keycode is already cached (via get_package_keycode " +
                "or get_package_information_from_link). Provide this OR link."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("download_package_files", (args, extra) => handleDownloadPackageFiles(args, extra, ctx, cacheFor)));
}
