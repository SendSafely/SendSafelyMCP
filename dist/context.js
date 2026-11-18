import { createSendSafelyClient, MissingCredentialsError, requireUserApproval, requireUserChoice, SENDSAFELY_DOWNLOAD_DIR, } from "@sendsafely/mcp-tools-core";
import { getCredential } from "./credentials.js";
export function createStdioContext(server) {
    return {
        getClient: async (_extra) => {
            const url = getCredential("url");
            const apiKey = getCredential("api_key");
            const apiSecret = getCredential("api_secret");
            if (!url || !apiKey || !apiSecret) {
                throw new MissingCredentialsError("Missing required credentials. " +
                    "Run 'sendsafely-setup-credentials' to store them in your OS keychain, " +
                    "or set SENDSAFELY_URL, SENDSAFELY_API_KEY, and SENDSAFELY_API_SECRET " +
                    "environment variables.");
            }
            return createSendSafelyClient({ url, apiKey, apiSecret });
        },
        getDownloadDir: (_extra) => SENDSAFELY_DOWNLOAD_DIR,
        requireUserApproval: async (message) => requireUserApproval(server, message),
        requireUserChoice: async (message, choices) => requireUserChoice(server, message, choices),
    };
}
