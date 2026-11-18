import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { moveDirectory } from "../sdk/sdkPromise.js";
export async function handleMoveDirectory(args, extra, ctx) {
    return runTool("move_directory", "Failed to move directory", async () => {
        const client = await ctx.getClient(extra);
        await moveDirectory(client, args.package_id, args.source_directory_id, args.target_directory_id);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            source_directory_id: args.source_directory_id,
            target_directory_id: args.target_directory_id,
        });
    });
}
export function registerMoveDirectory(mcp, ctx) {
    mcp.registerTool("move_directory", {
        title: "Move Directory",
        description: "Move a directory to a new parent inside the same workspace " +
            "package. Both directories must belong to the same package.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            source_directory_id: z
                .string()
                .describe("The directory ID to move."),
            target_directory_id: z
                .string()
                .describe("The destination parent directory ID."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("move_directory", (args, extra) => handleMoveDirectory(args, extra, ctx)));
}
