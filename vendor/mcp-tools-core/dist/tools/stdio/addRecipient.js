import { z } from "zod";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { buildShareLinkMessage, classifyRecipientAddContext, promptAndApplyWorkspaceRole, tryBuildKeyedLink, } from "../../recipientAddContext.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { addRecipient, packageInformation } from "../../sdk/sdkPromise.js";
export async function handleAddRecipient(args, extra, ctx, cacheFor) {
    return runTool("add_recipient", "Failed to add recipient", async () => {
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
        const recipient = await addRecipient(client, args.package_id, args.email, secrets.keyCode);
        if (context.kind === "unfinalized_or_unknown") {
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                recipient,
                message: `Recipient ${args.email} added. Recipients are notified when ` +
                    "finalize_package runs.",
            });
        }
        const rolePrompt = context.kind === "active_workspace"
            ? await promptAndApplyWorkspaceRole(ctx, client, args.package_id, [{ recipient_id: recipient.recipientId, email: recipient.email }], `Collaborator ${args.email}`)
            : undefined;
        const secureLink = tryBuildKeyedLink(client, secrets.keyCode, secrets.packageCode);
        if (!secureLink) {
            const linkUnavailable = "Cache entry has no packageCode. Tell the user to fetch the " +
                "keyed link via get_package_information_from_link or " +
                "get_package_keycode and share it with the new recipient.";
            const baseMessage = `Recipient ${args.email} added. SendSafely will NOT auto-notify ` +
                "this recipient, but secure_link could not be reconstructed " +
                "from the cache (see secure_link_unavailable).";
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                recipient,
                package_type: info.packageType,
                package_state: info.state,
                secure_link_unavailable: linkUnavailable,
                ...(rolePrompt ? { role_prompt: rolePrompt } : {}),
                message: rolePrompt?.message
                    ? `${baseMessage}\n\n${rolePrompt.message}`
                    : baseMessage,
            });
        }
        const linkMessage = buildShareLinkMessage(context, `Recipient ${args.email}`, secureLink);
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
export function registerAddRecipient(mcp, ctx, cacheFor) {
    mcp.registerTool("add_recipient", {
        title: "Add Recipient",
        description: "Add a recipient (by email) to a SendSafely package. The package's " +
            "secret material must be in the server-side cache (populated by " +
            "create_package / create_workspace, get_package_information_from_link, " +
            "or get_package_keycode via a registered Trusted Device). " +
            "Behavior depends on the package's current state and type — the " +
            "tool inspects the package automatically and adjusts: " +
            "(1) DELETED package → add is refused; tell the user the package " +
            "is gone. " +
            "(2) Workspace (any non-deleted state) → add proceeds; response " +
            "includes secure_link + a reminder. You MUST surface the link and " +
            "tell the user to share it with the new collaborator, since " +
            "SendSafely never auto-notifies workspace collaborators. The tool " +
            "also prompts the user to pick the collaborator's role (default " +
            "VIEWER; alternatives CONTRIBUTOR or MANAGER); the chosen role is " +
            "applied via update_recipient_role automatically. " +
            "(3) Already-finalized Transfer / Dropzone (PACKAGE_STATE_ACTIVE_*) " +
            "→ same as workspaces. Surface secure_link and tell the user to " +
            "share it; SendSafely does not auto-notify recipients added after " +
            "finalize. " +
            "(4) Expired Transfer / Dropzone (PACKAGE_STATE_EXPIRED_*) → add " +
            "proceeds, but the response warns the user the package needs to " +
            "be un-expired before the new recipient can access it. " +
            "(5) Unfinalized Transfer / Dropzone being assembled → no reminder; " +
            "finalize_package will handle notifications.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            email: z.string().describe("Email address of the recipient to add."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("add_recipient", (args, extra) => handleAddRecipient(args, extra, ctx, cacheFor)));
}
