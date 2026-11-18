import { z } from "zod";
import { jsonError, jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { createDirectory, packageInformation } from "../sdk/sdkPromise.js";
export async function handleCreateDirectory(args, extra, ctx) {
    return runTool("create_directory", "Failed to create directory", async () => {
        const client = await ctx.getClient(extra);
        let parentDirectoryId = args.parent_directory_id;
        if (!parentDirectoryId) {
            const info = await packageInformation(client, args.package_id);
            parentDirectoryId = info.rootDirectoryId;
            if (!parentDirectoryId) {
                return jsonError(`Could not determine workspace root for packageId '${args.package_id}'. ` +
                    "Pass parent_directory_id explicitly, or verify the package is a " +
                    "workspace (regular Transfer packages don't support directories).");
            }
        }
        const result = await createDirectory(client, args.package_id, args.directory_name, parentDirectoryId);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            directory_name: args.directory_name,
            parent_directory_id: parentDirectoryId,
            result,
        });
    });
}
export function registerCreateDirectory(mcp, ctx) {
    mcp.registerTool("create_directory", {
        title: "Create Directory",
        description: "Create a directory in a workspace package. Pass " +
            "`parent_directory_id` to nest under an existing directory; " +
            "omit it to create at the workspace root (the tool auto-resolves " +
            "the workspace's root directory ID via an extra metadata lookup " +
            "in that case). Workspace packages only — regular Transfer " +
            "packages don't support directories.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely workspace package ID."),
            directory_name: z.string().describe("Name for the new directory."),
            parent_directory_id: z
                .string()
                .optional()
                .describe("Parent directory ID to nest under. Omit to create at the workspace root."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("create_directory", (args, extra) => handleCreateDirectory(args, extra, ctx)));
}
