import { z } from "zod";
import { jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { encryptAndUploadMessage } from "../../sdk/sdkPromise.js";
export async function handleAddPackageMessage(args, extra, ctx, cacheFor) {
    return runTool("add_package_message", "Failed to attach message", async () => {
        const client = await ctx.getClient(extra);
        const secrets = cacheFor(extra).get(args.package_id);
        if (!secrets)
            throw new MissingPackageSecretsError(args.package_id);
        await encryptAndUploadMessage(client, args.package_id, secrets.keyCode, secrets.serverSecret, args.message);
        return jsonResult({ status: "success", package_id: args.package_id });
    });
}
export function registerAddPackageMessage(mcp, ctx, cacheFor) {
    mcp.registerTool("add_package_message", {
        title: "Attach Secure Message",
        description: "Encrypt and attach a secure text message to an unfinalized " +
            "SendSafely package. The package's secret material must be in the " +
            "server-side cache — typically because create_package was called " +
            "to author it, or because get_package_keycode unlocked it via a " +
            "registered Trusted Device. The message is delivered alongside " +
            "any attached files when finalize_package runs.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            message: z.string().describe("The message text to encrypt and attach."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("add_package_message", (args, extra) => handleAddPackageMessage(args, extra, ctx, cacheFor)));
}
