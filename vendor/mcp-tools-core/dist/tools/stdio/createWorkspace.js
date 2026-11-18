import { z } from "zod";
import { jsonResult } from "../../jsonResult.js";
import { createLinkValidationChecksum } from "../../utils/packageChecksum.js";
import { buildKeyedLink } from "../../utils/packageLink.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { createWorkspace, updatePackage } from "../../sdk/sdkPromise.js";
export async function handleCreateWorkspace(args, extra, ctx, cacheFor) {
    return runTool("create_workspace", "Failed to create workspace", async () => {
        const client = await ctx.getClient(extra);
        const created = await createWorkspace(client);
        cacheFor(extra).set(created.packageId, {
            keyCode: created.keyCode,
            serverSecret: created.serverSecret,
            packageCode: created.packageCode,
        });
        const checksum = createLinkValidationChecksum(created.keyCode, created.packageCode);
        let workspaceNameSet = false;
        let linkValidationSet = false;
        let postCreateError;
        try {
            await updatePackage(client, created.packageId, {
                label: args.workspace_name,
                checksum,
            });
            workspaceNameSet = true;
            linkValidationSet = true;
        }
        catch (err) {
            postCreateError = err instanceof Error ? err.message : String(err);
        }
        const secureLink = buildKeyedLink(client, created.packageCode, created.keyCode);
        const baseMessage = `Workspace "${args.workspace_name}" created. The secure_link above ` +
            "is the workspace's keyed link — surface it to the user. They will " +
            "need to share this exact link with every collaborator they add, " +
            "since SendSafely does NOT send automatic notifications for " +
            "workspace activity. Use create_directory, upload_file, and " +
            "add_recipient to populate the workspace; the keyed link does not " +
            "change.";
        const message = workspaceNameSet && linkValidationSet
            ? baseMessage
            : `${baseMessage}\n\nWARNING: the post-create setup call to ` +
                "update_package failed (post_create_error in this response). " +
                (!workspaceNameSet
                    ? "The workspace was created but its name was NOT set, so it " +
                        "will appear with a default label in the SendSafely UI. "
                    : "") +
                (!linkValidationSet
                    ? "The link-validation checksum was also NOT set, so uploads " +
                        "to the workspace may be rejected until you retry via " +
                        "update_package. "
                    : "") +
                "Surface this to the user so they know.";
        return jsonResult({
            status: "success",
            package_id: created.packageId,
            workspace_name: args.workspace_name,
            secure_link: secureLink,
            workspace_name_set: workspaceNameSet,
            link_validation_set: linkValidationSet,
            ...(postCreateError ? { post_create_error: postCreateError } : {}),
            message,
        });
    });
}
export function registerCreateWorkspace(mcp, ctx, cacheFor) {
    mcp.registerTool("create_workspace", {
        title: "Create Workspace",
        description: "Create a new SendSafely Workspace (virtual data room) with the " +
            "given name. Workspaces are persistent, end-to-end encrypted data " +
            "rooms that support directory hierarchies (use create_directory) " +
            "in addition to root-level files. " +
            "Implementation detail (so the agent can reason about failure " +
            "modes correctly): the SDK's createWorkspace endpoint does NOT " +
            "accept a name. After the SDK creates the empty workspace, this " +
            "tool makes one follow-up update_package call that sets BOTH the " +
            "user-supplied workspace name (as `label`) AND the link-" +
            "validation checksum derived from keyCode + packageCode (required " +
            "for SendSafely to accept uploads). " +
            "Response always includes secure_link, the workspace's keyed link " +
            "(`{host}/receive/?packageCode=…#keyCode=…`). Surface this link " +
            "to the user — they will need to share it with every collaborator " +
            "they add, because SendSafely does NOT auto-notify workspace " +
            "collaborators. " +
            "If the post-create update_package call fails, the workspace " +
            "still exists, but workspace_name_set and/or link_validation_set " +
            "will be false in the response and post_create_error will explain " +
            "why. Surface that failure to the user.",
        inputSchema: {
            workspace_name: z
                .string()
                .min(1)
                .max(255)
                .describe("REQUIRED. Display name for the new workspace (1–255 " +
                "characters). Shown to collaborators in the SendSafely UI. " +
                "SendSafely validates the character set server-side. " +
                "Always ask the user what the workspace should be called " +
                "before invoking this tool — do not invent a default."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("create_workspace", (args, extra) => handleCreateWorkspace(args, extra, ctx, cacheFor)));
}
