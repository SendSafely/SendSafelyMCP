import { z } from "zod";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { buildShareLinkMessage, classifyRecipientAddContext, promptAndApplyWorkspaceRole, tryBuildKeyedLink, } from "../../recipientAddContext.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { addRecipientWithSMS, packageInformation } from "../../sdk/sdkPromise.js";
export async function handleAddRecipientWithSms(args, extra, ctx, cacheFor) {
    return runTool("add_recipient_with_sms", "Failed to add recipient", async () => {
        const client = await ctx.getClient(extra);
        const secrets = cacheFor(extra).get(args.package_id);
        if (!secrets)
            throw new MissingPackageSecretsError(args.package_id);
        const info = await packageInformation(client, args.package_id);
        const context = classifyRecipientAddContext(info);
        if (context.kind === "block_deleted") {
            return jsonError(`Cannot add recipient: package '${args.package_id}' has been ` +
                `deleted (state ${context.state}). Inform the user that the ` +
                "package no longer exists and recipients cannot be added.");
        }
        const recipient = await addRecipientWithSMS(client, args.package_id, args.email, secrets.keyCode, args.phone_number, args.country_code);
        if (context.kind === "unfinalized_or_unknown") {
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                recipient,
                message: `Recipient ${args.email} added with SMS verification. ` +
                    "Recipients are notified when finalize_package runs.",
            });
        }
        const rolePrompt = context.kind === "active_workspace"
            ? await promptAndApplyWorkspaceRole(ctx, client, args.package_id, [{ recipient_id: recipient.recipientId, email: recipient.email }], `Collaborator ${args.email}`)
            : undefined;
        const secureLink = tryBuildKeyedLink(client, secrets.keyCode, secrets.packageCode);
        if (!secureLink) {
            const baseMessage = `Recipient ${args.email} added with SMS verification. ` +
                "SendSafely will NOT auto-notify this recipient, but " +
                "secure_link could not be reconstructed from the cache " +
                "(see secure_link_unavailable).";
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                recipient,
                package_type: info.packageType,
                package_state: info.state,
                secure_link_unavailable: "Cache entry has no packageCode. Tell the user to fetch the " +
                    "keyed link via get_package_information_from_link or " +
                    "get_package_keycode and share it with the new recipient.",
                ...(rolePrompt ? { role_prompt: rolePrompt } : {}),
                message: rolePrompt?.message
                    ? `${baseMessage}\n\n${rolePrompt.message}`
                    : baseMessage,
            });
        }
        const linkMessage = buildShareLinkMessage(context, `Recipient ${args.email} (SMS-verified)`, secureLink);
        const message = rolePrompt?.message
            ? `${linkMessage}\n\n${rolePrompt.message}`
            : linkMessage;
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            recipient,
            package_type: info.packageType,
            package_state: info.state,
            secure_link: secureLink,
            ...(rolePrompt ? { role_prompt: rolePrompt } : {}),
            message,
        });
    });
}
export function registerAddRecipientWithSms(mcp, ctx, cacheFor) {
    mcp.registerTool("add_recipient_with_sms", {
        title: "Add Recipient With SMS Verification",
        description: "Add a recipient who must verify via SMS before retrieving the " +
            "package. The package's secret material must be in the server-side " +
            "cache (populated by create_package, get_package_information_from_link, " +
            "or get_package_keycode via a registered Trusted Device). " +
            "Same state/type-aware behavior as add_recipient: deleted packages " +
            "are refused; workspaces and already-finalized Transfer/Dropzone " +
            "packages return secure_link + a reminder telling the user to " +
            "share the link with the new recipient (no auto-notification); " +
            "expired packages return a warning that the package needs to be " +
            "un-expired first; unfinalized packages proceed without a " +
            "reminder since finalize_package will handle notifications. On a " +
            "workspace add, the tool also prompts the user to pick the new " +
            "collaborator's role (default VIEWER; alternatives CONTRIBUTOR or " +
            "MANAGER) and applies it automatically via update_recipient_role.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            email: z
                .string()
                .describe("Recipient's email address (e.g. 'alice@example.com')."),
            phone_number: z
                .string()
                .describe("Recipient's mobile phone number, full-length for the country " +
                "(e.g. '2025551234' for US — 10 digits including area code; " +
                "'+12025551234' E.164 also accepted). SendSafely validates with " +
                "Google's libphonenumber, so the digit count must match the " +
                "country's real-number format. Short inputs like '5551234' " +
                "will be rejected as invalid."),
            country_code: z
                .string()
                .describe("Country dialing code OR ISO alpha-2 country code. " +
                "Numeric examples: '1' (US/Canada), '44' (UK), '81' (Japan). " +
                "Alpha-2 examples: 'US', 'GB', 'JP'. Both formats work — " +
                "SendSafely converts numeric to alpha-2 internally."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("add_recipient_with_sms", (args, extra) => handleAddRecipientWithSms(args, extra, ctx, cacheFor)));
}
