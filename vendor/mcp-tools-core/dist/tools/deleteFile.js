import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../approval.js";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { deleteFile } from "../sdk/sdkPromise.js";
export async function handleDeleteFile(args, extra, ctx) {
    return runTool("delete_file", "Failed to delete file", async () => {
        const approval = await ctx.requireUserApproval(`Delete file ${args.file_id} from SendSafely package ${args.package_id}? ` +
            "This cannot be undone.");
        const denied = approvalGateError(approval, "permanently delete this file from the package", {
            proceedWithoutPrompt: args.proceed_without_prompt,
        });
        if (denied)
            return denied;
        const client = await ctx.getClient(extra);
        await deleteFile(client, args.package_id, args.file_id, args.directory_id);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            file_id: args.file_id,
            ...(args.directory_id ? { directory_id: args.directory_id } : {}),
        });
    });
}
export function registerDeleteFile(mcp, ctx) {
    mcp.registerTool("delete_file", {
        title: "Delete File",
        description: "Permanently delete a file from a SendSafely package. Pass " +
            "`directory_id` for files inside a workspace directory; omit for " +
            "files at the package root. Works on WORKSPACE packages, and on " +
            "TRANSFER/DROPZONE packages that haven't been sent yet. Files in a " +
            "sent TRANSFER or DROPZONE package can't be deleted; delete the " +
            "whole package instead. Requires user approval — irreversible. " +
            "Approval is collected via MCP elicitation. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            file_id: z.string().describe("The unique file ID."),
            directory_id: z
                .string()
                .optional()
                .describe("Workspace directory ID. Omit for root-level files."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("delete_file", (args, extra) => handleDeleteFile(args, extra, ctx)));
}
