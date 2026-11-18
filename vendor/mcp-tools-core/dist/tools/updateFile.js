import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { updateFile } from "../sdk/sdkPromise.js";
export async function handleUpdateFile(args, extra, ctx) {
    return runTool("update_file", "Failed to update file", async () => {
        const client = await ctx.getClient(extra);
        await updateFile(client, args.package_id, args.file_id, args.file_name);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            file_id: args.file_id,
            file_name: args.file_name,
        });
    });
}
export function registerUpdateFile(mcp, ctx) {
    mcp.registerTool("update_file", {
        title: "Rename File",
        description: "Rename a file inside a SendSafely package. Affects only the " +
            "displayed name; the file ID and contents are unchanged. Only " +
            "works on WORKSPACE and DROPZONE packages that are still active; " +
            "TRANSFER packages can't have files renamed. Check `packageType` " +
            "with get_package_information first if the packageType is not already known.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            file_id: z.string().describe("The unique file ID."),
            file_name: z.string().describe("New display name for the file."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("update_file", (args, extra) => handleUpdateFile(args, extra, ctx)));
}
