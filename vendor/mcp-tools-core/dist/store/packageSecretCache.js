export function createPackageSecretCache() {
    const store = new Map();
    return {
        set(packageId, secrets) {
            store.set(packageId, secrets);
        },
        get(packageId) {
            return store.get(packageId);
        },
        delete(packageId) {
            store.delete(packageId);
        },
        clear() {
            store.clear();
        },
    };
}
export class MissingPackageSecretsError extends Error {
    constructor(packageId) {
        super(`No cached secrets for packageId '${packageId}'. ` +
            "The package's secrets must be in the server-side cache, populated " +
            "by one of: create_package / create_workspace (for packages being " +
            "authored), get_package_information_from_link (when a keyed link " +
            "is available), or get_package_keycode (when a Trusted Device " +
            "private key is registered and authorized for the package). " +
            "Note: get_package_information by ID does NOT populate the cache " +
            "— the SDK's by-id endpoint omits the keyCode.");
        this.name = "MissingPackageSecretsError";
    }
}
export function stripPackageSecrets(info) {
    const result = {};
    for (const [key, value] of Object.entries(info)) {
        if (key === "keyCode" || key === "serverSecret")
            continue;
        result[key] = value;
    }
    return result;
}
