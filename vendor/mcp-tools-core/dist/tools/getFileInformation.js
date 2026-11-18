import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { getFileInformation } from "../sdk/sdkPromise.js";
export async function handleGetFileInformation(args, extra, ctx) {
    return runTool("get_file_information", "Failed to retrieve file information", async () => {
        const client = await ctx.getClient(extra);
        const info = await getFileInformation(client, args.package_id, args.directory_id, args.file_id);
        return jsonResult({ status: "success", file_info: info });
    });
}
export function registerGetFileInformation(mcp, ctx) {
    mcp.registerTool("get_file_information", {
        title: "Get File Information",
        description: "Retrieve metadata for a single file inside a SendSafely package. " +
            "Pass `directory_id` for files inside a workspace directory; omit " +
            "for files at the package root.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            file_id: z.string().describe("The unique file ID."),
            directory_id: z
                .string()
                .optional()
                .describe("Workspace directory ID; omit for root-level files."),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_file_information", (args, extra) => handleGetFileInformation(args, extra, ctx)));
}
