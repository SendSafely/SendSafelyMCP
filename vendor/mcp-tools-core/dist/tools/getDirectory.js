import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { getDirectory } from "../sdk/sdkPromise.js";
export async function handleGetDirectory(args, extra, ctx) {
    return runTool("get_directory", "Failed to retrieve directory listing", async () => {
        const client = await ctx.getClient(extra);
        const listing = await getDirectory(client, args.package_id, args.directory_id, args.directory_index ?? 0, args.file_index ?? 0, args.sort_field ?? "name", args.sort_order ?? "asc");
        return jsonResult({ status: "success", directory: listing });
    });
}
export function registerGetDirectory(mcp, ctx) {
    mcp.registerTool("get_directory", {
        title: "Get Directory Listing",
        description: "List files and subdirectories in a workspace directory. " +
            "`directory_index` and `file_index` are pagination offsets; " +
            "`sort_field` and `sort_order` control ordering. Defaults are " +
            "page 0, sort by name ascending.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            directory_id: z.string().describe("The directory ID to list."),
            directory_index: z
                .number()
                .int()
                .nonnegative()
                .optional()
                .describe("Pagination offset for subdirectories."),
            file_index: z
                .number()
                .int()
                .nonnegative()
                .optional()
                .describe("Pagination offset for files."),
            sort_field: z
                .string()
                .optional()
                .describe("Field to sort by; defaults to 'name'."),
            sort_order: z
                .enum(["asc", "desc"])
                .optional()
                .describe("Sort direction; defaults to 'asc'."),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_directory", (args, extra) => handleGetDirectory(args, extra, ctx)));
}
