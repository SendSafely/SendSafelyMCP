import { Entry } from "@napi-rs/keyring";
export const TRUSTED_DEVICE_SERVICE_NAME = "SendSafelyMCP-TrustedDevice";
export function createKeychainKeyStore() {
    return {
        set: (id, secret) => {
            try {
                new Entry(TRUSTED_DEVICE_SERVICE_NAME, id).setPassword(secret);
                return Promise.resolve();
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                process.stderr.write(`[KEYSTORE] setPassword failed for id=${id}: ${msg}\n`);
                return Promise.reject(new Error("Failed to store trusted-device key in keychain. See server logs for details."));
            }
        },
        get: (id) => {
            try {
                const value = new Entry(TRUSTED_DEVICE_SERVICE_NAME, id).getPassword();
                return Promise.resolve(value && value.length > 0 ? value : undefined);
            }
            catch {
                return Promise.resolve(undefined);
            }
        },
        delete: (id) => {
            try {
                new Entry(TRUSTED_DEVICE_SERVICE_NAME, id).deletePassword();
            }
            catch {
            }
            return Promise.resolve();
        },
    };
}
