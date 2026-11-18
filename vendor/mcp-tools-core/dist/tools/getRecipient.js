import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { getRecipient } from "../sdk/sdkPromise.js";
export async function handleGetRecipient(args, extra, ctx) {
    return runTool("get_recipient", "Failed to retrieve recipient", async () => {
        const client = await ctx.getClient(extra);
        const recipient = await getRecipient(client, args.package_id, args.recipient_id);
        return jsonResult({ status: "success", recipient });
    });
}
export function registerGetRecipient(mcp, ctx) {
    mcp.registerTool("get_recipient", {
        title: "Get Recipient",
        description: "Retrieve a single recipient on a SendSafely package by recipient " +
            "ID. The full recipient list is also available inside " +
            "get_package_information; use this tool when you only need one.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            recipient_id: z.string().describe("The unique recipient ID."),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_recipient", (args, extra) => handleGetRecipient(args, extra, ctx)));
}
