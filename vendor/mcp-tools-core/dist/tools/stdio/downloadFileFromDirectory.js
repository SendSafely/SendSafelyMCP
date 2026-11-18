import path from "node:path";
import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../../approval.js";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { assertSafePackageId, preparePackageDir } from "../../utils/packageDir.js";
import { sanitizeFilename } from "../../utils/sanitizeFilename.js";
import { downloadFileFromDirectoryToPath, getFileInformation } from "../../sdk/sdkPromise.js";
export async function handleDownloadFileFromDirectory(args, extra, ctx, cacheFor) {
    return runTool("download_file_from_directory", "Failed to download file", async () => {
        const client = await ctx.getClient(extra);
        const secrets = cacheFor(extra).get(args.package_id);
        if (!secrets)
            throw new MissingPackageSecretsError(args.package_id);
        const fileInfo = await getFileInformation(client, args.package_id, args.directory_id, args.file_id);
        const rawName = String(fileInfo.fileName ?? args.file_id);
        const safeName = sanitizeFilename(rawName);
        const downloadDir = ctx.getDownloadDir(extra);
        const packageDir = path.join(downloadDir, assertSafePackageId(args.package_id));
        const approval = await ctx.requireUserApproval(`Download and decrypt "${safeName}" from SendSafely package ` +
            `${args.package_id} to ${packageDir}?\n\n` +
            "A decrypted copy will be written to the local download directory.");
        const denied = approvalGateError(approval, "decrypt this file to the local download directory", {
            proceedWithoutPrompt: args.proceed_without_prompt,
            abortPrefix: "Download aborted",
        });
        if (denied)
            return denied;
        const realDir = await preparePackageDir(downloadDir, args.package_id);
        const targetPath = path.resolve(realDir, safeName);
        if (targetPath !== realDir && !targetPath.startsWith(realDir + path.sep)) {
            process.stderr.write(`SECURITY: rejected file '${rawName}' (id=${args.file_id}) — ` +
                `resolved path escapes package directory\n`);
            return jsonError("File rejected: resolved path escapes the package download directory.", { file_name: rawName, file_id: args.file_id });
        }
        await downloadFileFromDirectoryToPath(client, args.package_id, args.directory_id, args.file_id, secrets.keyCode, { path: realDir, fileName: safeName });
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            directory_id: args.directory_id,
            file_id: args.file_id,
            local_path: targetPath,
            file_name: safeName,
            original_file_name: rawName,
            message: "File downloaded successfully. You MUST ask the user for explicit " +
                "permission before reading the file contents.",
        });
    });
}
export function registerDownloadFileFromDirectory(mcp, ctx, cacheFor) {
    mcp.registerTool("download_file_from_directory", {
        title: "Download File From Directory",
        description: "Download and decrypt a single file from a workspace directory. " +
            "The package's Keycode must be in the server-side cache — populated " +
            "by get_package_information_from_link when a keyed link is " +
            "available, or by get_package_keycode when a Trusted Device " +
            "private key is registered for the user. " +
            "(get_package_information by ID does not populate the cache.) " +
            "Output is saved to <download_dir>/<package_id>/<file_name> with " +
            "the same filename sanitization as download_package_files. " +
            "ACCESSING CONTENTS: the returned local_path is a location in the " +
            "SERVER's managed download directory. When this server runs in a " +
            "sandbox or on a different host, that path is very likely NOT " +
            "reachable by your own file-reading tools — do not assume you can " +
            "open it directly, and do not report the download as unreadable if " +
            "your file tools cannot find it. read_downloaded_file is the ONLY " +
            "reliable way to access the decrypted contents (it can read the " +
            "file even when the path is outside your sandbox). Always route " +
            "reads through read_downloaded_file using this local_path. " +
            "IMPORTANT: Before doing so, you MUST ask the user for explicit " +
            "permission to read the file contents. Do not read files without " +
            "user authorization. " +
            "CONSENT: this tool writes a decrypted file to local disk, so it " +
            "requires user approval, collected via MCP elicitation. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            directory_id: z.string().describe("Workspace directory ID."),
            file_id: z.string().describe("The unique file ID inside the directory."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("download_file_from_directory", (args, extra) => handleDownloadFileFromDirectory(args, extra, ctx, cacheFor)));
}
