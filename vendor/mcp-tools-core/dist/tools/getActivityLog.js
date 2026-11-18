import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { getActivityLog } from "../sdk/sdkPromise.js";
export async function handleGetActivityLog(args, extra, ctx) {
    return runTool("get_activity_log", "Failed to retrieve activity log", async () => {
        const client = await ctx.getClient(extra);
        const log = await getActivityLog(client, args.package_id, args.row_index ?? 0);
        return jsonResult({ status: "success", activity_log: log });
    });
}
export function registerGetActivityLog(mcp, ctx) {
    mcp.registerTool("get_activity_log", {
        title: "Get Package Activity Log",
        description: "Retrieve the Activity Log for a SendSafely package — recipient " +
            "downloads, views, and other access events, the same audit stream " +
            "a Workspace owner sees in the SendSafely UI. Pagination is " +
            "supported via `row_index`; pass 0 (default) to get the first " +
            "page. Scope: this tool is meaningful only for WORKSPACE " +
            "(virtual data room) packages — for TRANSFER and DROPZONE " +
            "packages it returns an empty result, because their recipient " +
            "download / view history lives on the package itself under " +
            "`recipients[].confirmations` (surfaced to senders in the UI as " +
            "the recipient's \"Recipient History\"; see get_package_information). " +
            "Classify with `packageType` before choosing between this tool " +
            "and get_package_information.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            row_index: z
                .number()
                .int()
                .nonnegative()
                .optional()
                .describe("Pagination offset; defaults to 0 (first page)."),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_activity_log", (args, extra) => handleGetActivityLog(args, extra, ctx)));
}
