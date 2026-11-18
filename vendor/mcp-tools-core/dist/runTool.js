import { CredentialResolutionError } from "./context.js";
import { jsonError } from "./jsonResult.js";
import { oauthFailureKind } from "./sdk/oauthError.js";
import { MissingPackageSecretsError } from "./store/packageSecretCache.js";
export async function runTool(toolName, failurePrefix, fn) {
    try {
        return await fn();
    }
    catch (err) {
        if (oauthFailureKind(err) !== undefined)
            throw err;
        if (err instanceof CredentialResolutionError) {
            process.stderr.write(`[CREDS] ${toolName}: ${err.name}: ${err.message}\n`);
            return jsonError("SendSafely credentials not available. See server logs for details.");
        }
        if (err instanceof MissingPackageSecretsError) {
            return jsonError(err.message);
        }
        const msg = err instanceof Error ? err.message : String(err);
        return jsonError(`${failurePrefix}: ${msg}`);
    }
}
