import { z } from "zod";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { buildShareLinkMessage, classifyRecipientAddContext, promptAndApplyWorkspaceRole, tryBuildKeyedLink, } from "../../recipientAddContext.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { addRecipients, packageInformation } from "../../sdk/sdkPromise.js";
export async function handleAddRecipientsBulk(args, extra, ctx, cacheFor) {
    return runTool("add_recipients_bulk", "Failed to add recipients", async () => {
        const client = await ctx.getClient(extra);
        const secrets = cacheFor(extra).get(args.package_id);
        if (!secrets)
            throw new MissingPackageSecretsError(args.package_id);
        const info = await packageInformation(client, args.package_id);
        const context = classifyRecipientAddContext(info);
        if (context.kind === "block_deleted") {
            return jsonError(`Cannot add recipients: package '${args.package_id}' has been ` +
                `deleted (state ${context.state}). Inform the user that the ` +
                "package no longer exists and recipients cannot be added.");
        }
        const result = await addRecipients(client, args.package_id, args.emails, secrets.keyCode);
        const recipients = result.recipients ?? [];
        if (context.kind === "unfinalized_or_unknown") {
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                recipients,
                message: `${args.emails.length} recipient(s) added. Recipients are ` +
                    "notified when finalize_package runs.",
            });
        }
        const rolePrompt = context.kind === "active_workspace"
            ? await promptAndApplyWorkspaceRole(ctx, client, args.package_id, recipients
                .filter((r) => typeof r.recipientId ===
                "string")
                .map((r) => ({
                recipient_id: r.recipientId,
                email: r.email,
            })), `${recipients.length} new collaborator(s)`)
            : undefined;
        const secureLink = tryBuildKeyedLink(client, secrets.keyCode, secrets.packageCode);
        if (!secureLink) {
            const baseMessage = `${args.emails.length} recipient(s) added. SendSafely will NOT ` +
                "auto-notify them, but secure_link could not be reconstructed " +
                "from the cache (see secure_link_unavailable).";
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                recipients,
                package_type: info.packageType,
                package_state: info.state,
                secure_link_unavailable: "Cache entry has no packageCode. Tell the user to fetch the " +
                    "keyed link via get_package_information_from_link or " +
                    "get_package_keycode and share it with each new recipient.",
                ...(rolePrompt ? { role_prompt: rolePrompt } : {}),
                message: rolePrompt?.message
                    ? `${baseMessage}\n\n${rolePrompt.message}`
                    : baseMessage,
            });
        }
        const linkMessage = buildShareLinkMessage(context, `${args.emails.length} recipient(s) (${args.emails.join(", ")})`, secureLink);
        const message = rolePrompt?.message
            ? `${linkMessage}\n\n${rolePrompt.message}`
            : linkMessage;
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            recipients,
            package_type: info.packageType,
            package_state: info.state,
            secure_link: secureLink,
            ...(rolePrompt ? { role_prompt: rolePrompt } : {}),
            message,
        });
    });
}
export function registerAddRecipientsBulk(mcp, ctx, cacheFor) {
    mcp.registerTool("add_recipients_bulk", {
        title: "Add Recipients (Bulk)",
        description: "Add multiple recipients to a SendSafely package in a single call. " +
            "The package's secret material must be in the server-side cache " +
            "(populated by create_package / create_workspace, " +
            "get_package_information_from_link, or get_package_keycode via a " +
            "registered Trusted Device). " +
            "Same state/type-aware behavior as add_recipient: deleted packages " +
            "are refused; workspaces and already-finalized Transfer/Dropzone " +
            "packages return secure_link + a reminder telling the user to " +
            "share the link with each new recipient (no auto-notification); " +
            "expired packages return a warning that the package needs to be " +
            "un-expired first; unfinalized packages proceed without a " +
            "reminder since finalize_package will handle notifications. On a " +
            "workspace add, the tool also prompts the user ONCE to pick a role " +
            "(default VIEWER; alternatives CONTRIBUTOR or MANAGER); the chosen " +
            "role is applied to every added collaborator via " +
            "update_recipient_role automatically.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            emails: z
                .array(z.string())
                .min(1)
                .describe("Email addresses of the recipients to add."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("add_recipients_bulk", (args, extra) => handleAddRecipientsBulk(args, extra, ctx, cacheFor)));
}
