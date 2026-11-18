import { Entry } from "@napi-rs/keyring";
export const SERVICE_NAME = "SendSafelyMCP";
const ENV_MAP = {
    url: "SENDSAFELY_URL",
    api_key: "SENDSAFELY_API_KEY",
    api_secret: "SENDSAFELY_API_SECRET",
};
function readFromKeychain(name) {
    try {
        const entry = new Entry(SERVICE_NAME, name);
        const value = entry.getPassword();
        return value && value.length > 0 ? value : null;
    }
    catch {
        return null;
    }
}
export function keyringAvailable() {
    try {
        new Entry(SERVICE_NAME, "__probe__");
        return true;
    }
    catch {
        return false;
    }
}
export function getCredential(name) {
    const keychainValue = readFromKeychain(name);
    if (keychainValue)
        return keychainValue;
    return process.env[ENV_MAP[name]] ?? "";
}
export function storeCredential(name, value) {
    try {
        const entry = new Entry(SERVICE_NAME, name);
        entry.setPassword(value);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to store credential in keychain: ${msg}`);
    }
}
export function deleteCredential(name) {
    try {
        const entry = new Entry(SERVICE_NAME, name);
        entry.deletePassword();
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to delete credential from keychain: ${msg}`);
    }
}
export function credentialSource(name) {
    if (readFromKeychain(name))
        return "keychain";
    if (process.env[ENV_MAP[name]])
        return "environment";
    return "not found";
}
