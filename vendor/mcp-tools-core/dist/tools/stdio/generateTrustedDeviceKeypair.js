import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../../approval.js";
import { jsonResult } from "../../jsonResult.js";
import { ACTIVE_KEY_ID } from "../../store/keyStore.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { generateRsaKeyPair } from "../../sdk/sdkPromise.js";
export async function handleGenerateTrustedDeviceKeypair(args, extra, ctx, keyStore) {
    return runTool("generate_trusted_device_keypair", "Failed to generate trusted device key pair", async () => {
        const client = await ctx.getClient(extra);
        const approval = await ctx.requireUserApproval(`Generate a SendSafely Trusted Device key pair labeled '${args.description}'? ` +
            "The public key will be uploaded to SendSafely (visible to your tenant " +
            "admin until revoked) and the private key will be stored locally in the " +
            "OS keychain.");
        const denied = approvalGateError(approval, "register this machine as a Trusted Device for the user's SendSafely account", {
            proceedWithoutPrompt: args.proceed_without_prompt,
        });
        if (denied)
            return denied;
        const { privateKey, publicKey } = await generateRsaKeyPair(client, args.description);
        await keyStore.set(publicKey.id, privateKey);
        await keyStore.set(ACTIVE_KEY_ID, publicKey.id);
        return jsonResult({
            status: "success",
            public_key_id: publicKey.id,
            description: publicKey.description,
            date_str: publicKey.dateStr,
            message: "Trusted Device key pair generated. Public key uploaded to " +
                "SendSafely; private key stored locally in the OS keychain. The " +
                "private key is not returned and must not be requested.\n\n" +
                "EXPLAIN THIS TO THE USER (verbatim or close to it):\n" +
                "  \"Your new Trusted Device is registered. From now on, any " +
                "NEW SendSafely items sent to you can be opened from here " +
                "without pasting the secure link each time — SendSafely will " +
                "encrypt the keycodes for those new items to this device's " +
                "public key.\n\n" +
                "  Existing items that arrived BEFORE this device was registered " +
                "are not yet readable from here. To grant the new device access " +
                "to those older items, log into the SendSafely portal from " +
                "another browser that's already a Trusted Browser for your " +
                "account, then log back out. That login/logout step prompts " +
                "SendSafely to sync your existing keycodes to the new device. " +
                "After the sync, this MCP server will be able to open those " +
                "older items too.\"",
        });
    });
}
export function registerGenerateTrustedDeviceKeypair(mcp, ctx, keyStore) {
    mcp.registerTool("generate_trusted_device_keypair", {
        title: "Generate Trusted Device Key Pair",
        description: "Generate an RSA Trusted Device key pair. The public half is " +
            "uploaded to SendSafely automatically; the private half is stored " +
            "locally in the OS keychain under its public-key ID. Only the " +
            "public-key ID and description are returned — the private key never " +
            "appears in tool I/O. Available only on transports that provide a " +
            "secure local key store (today: stdio). Requires user approval — " +
            "generates Trusted Device key material (public key uploaded to " +
            "SendSafely; private key stored in the OS keychain). " +
            "Approval is collected via MCP elicitation. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            description: z
                .string()
                .min(1)
                .describe("Human-readable label for the key pair (e.g. 'My MCP Trusted Device')."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("generate_trusted_device_keypair", (args, extra) => handleGenerateTrustedDeviceKeypair(args, extra, ctx, keyStore)));
}
