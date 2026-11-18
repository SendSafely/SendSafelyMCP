import { pbkdf2Sync } from "node:crypto";
function toUrlSafeBase64(base64) {
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
export function createLinkValidationChecksum(keyCode, packageCode) {
    return pbkdf2Sync(toUrlSafeBase64(keyCode), toUrlSafeBase64(packageCode), 1024, 32, "sha256").toString("hex");
}
