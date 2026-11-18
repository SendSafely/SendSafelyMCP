import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { safeHandler } from "../../safeHandler.js";
async function walkDownloadDir(root) {
    const entries = [];
    const dirents = await readdir(root, {
        recursive: true,
        withFileTypes: true,
    });
    for (const dirent of dirents) {
        if (!dirent.isFile())
            continue;
        if (dirent.name.startsWith("."))
            continue;
        const parentPath = dirent.parentPath ?? root;
        const fullPath = path.join(parentPath, dirent.name);
        try {
            const st = await stat(fullPath);
            entries.push({
                file_name: dirent.name,
                file_size: st.size,
                local_path: fullPath,
                modified: new Date(st.mtimeMs).toISOString(),
            });
        }
        catch {
        }
    }
    entries.sort((a, b) => (a.modified < b.modified ? 1 : -1));
    return entries;
}
export async function handleListDownloadedFiles(_args, extra, ctx) {
    const downloadDir = ctx.getDownloadDir(extra);
    try {
        let files = [];
        try {
            files = await walkDownloadDir(downloadDir);
        }
        catch (err) {
            if (err.code === "ENOENT") {
                return jsonResult({ status: "success", files: [] });
            }
            throw err;
        }
        return jsonResult({ status: "success", files });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonError(`Failed to list files: ${msg}`);
    }
}
export function registerListDownloadedFiles(mcp, ctx) {
    mcp.registerTool("list_downloaded_files", {
        title: "List Downloaded Files",
        description: "List all files that have been downloaded to the SendSafely download " +
            "directory. Files are stored under <download_dir>/<packageId>/ with " +
            "their sender-provided name (unsafe characters replaced by '_'). " +
            "Returns file names, sizes, and paths. " +
            "Does NOT return file contents. " +
            "IMPORTANT: To read file contents, you must first ask the user for " +
            "explicit permission, then use the read_downloaded_file tool.",
        inputSchema: {},
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, safeHandler("list_downloaded_files", (args, extra) => handleListDownloadedFiles(args, extra, ctx)));
}
