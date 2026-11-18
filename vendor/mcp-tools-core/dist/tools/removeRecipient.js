import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { removeRecipient } from "../sdk/sdkPromise.js";
export async function handleRemoveRecipient(args, extra, ctx) {
    return runTool("remove_recipient", "Failed to remove recipient", async () => {
        const client = await ctx.getClient(extra);
        await removeRecipient(client, args.package_id, args.recipient_id);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            recipient_id: args.recipient_id,
        });
    });
}
export function registerRemoveRecipient(mcp, ctx) {
    mcp.registerTool("remove_recipient", {
        title: "Remove Recipient",
        description: "Remove a recipient from a SendSafely package by recipient ID. " +
            "On an unfinalized package this is silent. On a finalized package " +
            "the recipient loses access on their next request.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            recipient_id: z.string().describe("The unique recipient ID to remove."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("remove_recipient", (args, extra) => handleRemoveRecipient(args, extra, ctx)));
}
