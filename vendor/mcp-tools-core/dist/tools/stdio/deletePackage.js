import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../../approval.js";
import { jsonResult } from "../../jsonResult.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { deletePackage } from "../../sdk/sdkPromise.js";
export async function handleDeletePackage(args, extra, ctx, cacheFor) {
    return runTool("delete_package", "Failed to delete package", async () => {
        const client = await ctx.getClient(extra);
        const approval = await ctx.requireUserApproval(`Delete SendSafely package ${args.package_id}? This cannot be undone.`);
        const denied = approvalGateError(approval, "permanently delete this SendSafely package", {
            proceedWithoutPrompt: args.proceed_without_prompt,
        });
        if (denied)
            return denied;
        await deletePackage(client, args.package_id);
        cacheFor(extra).delete(args.package_id);
        return jsonResult({ status: "success", package_id: args.package_id });
    });
}
export function registerDeletePackage(mcp, ctx, cacheFor) {
    mcp.registerTool("delete_package", {
        title: "Delete Package",
        description: "Permanently delete a SendSafely package. Recipients lose access " +
            "immediately. Requires user approval — this is irreversible. " +
            "Approval is collected via MCP elicitation. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("delete_package", (args, extra) => handleDeletePackage(args, extra, ctx, cacheFor)));
}
