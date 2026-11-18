import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { renameDirectory } from "../sdk/sdkPromise.js";
export async function handleRenameDirectory(args, extra, ctx) {
    return runTool("rename_directory", "Failed to rename directory", async () => {
        const client = await ctx.getClient(extra);
        await renameDirectory(client, args.package_id, args.directory_id, args.directory_name);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            directory_id: args.directory_id,
            directory_name: args.directory_name,
        });
    });
}
export function registerRenameDirectory(mcp, ctx) {
    mcp.registerTool("rename_directory", {
        title: "Rename Directory",
        description: "Rename a directory inside a workspace package.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            directory_id: z.string().describe("The directory ID to rename."),
            directory_name: z.string().describe("New name for the directory."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("rename_directory", (args, extra) => handleRenameDirectory(args, extra, ctx)));
}
