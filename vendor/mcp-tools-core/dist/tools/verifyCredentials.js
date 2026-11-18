import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { getUserInformation } from "../sdk/sdkPromise.js";
export async function handleVerifyCredentials(_args, extra, ctx) {
    return runTool("verify_credentials", "Authentication failed", async () => {
        const client = await ctx.getClient(extra);
        const userInfo = await getUserInformation(client);
        return jsonResult({ status: "success", user_info: userInfo });
    });
}
export function registerVerifyCredentials(mcp, ctx) {
    mcp.registerTool("verify_credentials", {
        title: "Verify SendSafely Credentials",
        description: "Verify that the configured SendSafely API credentials are valid. " +
            "Tests the API key and secret by retrieving user information from " +
            "the SendSafely API. Returns user details on success or an error " +
            "message on failure.",
        inputSchema: {},
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("verify_credentials", (args, extra) => handleVerifyCredentials(args, extra, ctx)));
}
