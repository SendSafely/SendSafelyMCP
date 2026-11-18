import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../approval.js";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { deleteDirectory } from "../sdk/sdkPromise.js";
export async function handleDeleteDirectory(args, extra, ctx) {
    return runTool("delete_directory", "Failed to delete directory", async () => {
        const client = await ctx.getClient(extra);
        const approval = await ctx.requireUserApproval(`Delete directory ${args.directory_id} from SendSafely package ` +
            `${args.package_id}? Any files and subdirectories inside will also be ` +
            "removed. This operation is irreversible.");
        const denied = approvalGateError(approval, "permanently delete this directory and everything inside it", {
            proceedWithoutPrompt: args.proceed_without_prompt,
        });
        if (denied)
            return denied;
        await deleteDirectory(client, args.package_id, args.directory_id);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            directory_id: args.directory_id,
        });
    });
}
export function registerDeleteDirectory(mcp, ctx) {
    mcp.registerTool("delete_directory", {
        title: "Delete Directory",
        description: "Delete a directory from a workspace package. Files and " +
            "subdirectories inside the deleted directory are also removed. " +
            "Requires user approval — this operation is irreversible. " +
            "Approval is collected via MCP elicitation. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            directory_id: z.string().describe("The directory ID to delete."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("delete_directory", (args, extra) => handleDeleteDirectory(args, extra, ctx)));
}
