import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../../approval.js";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { getDecryptedPackageMessage } from "../../sdk/sdkPromise.js";
export async function handleGetPackageMessage(args, extra, ctx, cacheFor) {
    return runTool("get_package_message", "Failed to retrieve package message", async () => {
        const client = await ctx.getClient(extra);
        const secrets = cacheFor(extra).get(args.package_id);
        if (!secrets)
            throw new MissingPackageSecretsError(args.package_id);
        if (!secrets.packageCode) {
            return jsonError(`Cached secrets for packageId '${args.package_id}' do not include a ` +
                "packageCode; resolve the package via get_package_information_from_link " +
                "first (the by-id metadata endpoint does not surface the Keycode " +
                "needed for receive-flow operations).");
        }
        const approval = await ctx.requireUserApproval(`Decrypt the secure message attached to SendSafely package ` +
            `${args.package_id} and return its plaintext? The decrypted message ` +
            "will be visible to the AI assistant.");
        const denied = approvalGateError(approval, "decrypt this package's secure message and return its plaintext to the assistant", {
            proceedWithoutPrompt: args.proceed_without_prompt,
        });
        if (denied)
            return denied;
        const message = await getDecryptedPackageMessage(client, args.package_id, secrets.packageCode, secrets.keyCode, secrets.serverSecret);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            message,
        });
    });
}
export function registerGetPackageMessage(mcp, ctx, cacheFor) {
    mcp.registerTool("get_package_message", {
        title: "Get Package Message",
        description: "Decrypt and return the secure message attached to a SendSafely " +
            "package. The package's Keycode must be in the server-side cache " +
            "— populated by get_package_information_from_link when a keyed " +
            "link is available, or by get_package_keycode when a Trusted " +
            "Device private key is registered for the user. " +
            "(get_package_information by ID does not populate the cache.) " +
            "Requires user approval via MCP elicitation — decrypted message " +
            "content is returned to the AI assistant. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_package_message", (args, extra) => handleGetPackageMessage(args, extra, ctx, cacheFor)));
}
