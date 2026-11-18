import { open, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import mime from "mime-types";
import { pdfToPng } from "pdf-to-png-converter";
import { z } from "zod";
import { MAX_FILE_READ_SIZE, MAX_PDF_PAGES, MAX_TEXT_PREVIEW, } from "../../constants.js";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../../approval.js";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { safeHandler } from "../../safeHandler.js";
const TEXT_APPLICATION_MIMES = new Set([
    "application/json",
    "application/xml",
    "application/csv",
]);
async function sampleIsText(filePath) {
    const fh = await open(filePath, "r");
    try {
        const buf = Buffer.alloc(8192);
        const { bytesRead } = await fh.read(buf, 0, 8192, 0);
        const sample = buf.subarray(0, bytesRead);
        return !sample.includes(0);
    }
    finally {
        await fh.close();
    }
}
export async function handleReadDownloadedFile(args, extra, ctx) {
    try {
        const downloadDir = ctx.getDownloadDir(extra);
        const realDownloadDir = await realpath(downloadDir).catch(() => null);
        const realPath = await realpath(args.file_path).catch(() => null);
        if (!realPath ||
            !realDownloadDir ||
            !realPath.startsWith(realDownloadDir + path.sep)) {
            return jsonError("Access denied: file path is outside the download directory.");
        }
        let fileStat;
        try {
            fileStat = await stat(realPath);
        }
        catch {
            return jsonError(`File not found: ${args.file_path}`);
        }
        if (!fileStat.isFile()) {
            return jsonError(`File not found: ${args.file_path}`);
        }
        const fileSize = fileStat.size;
        const fileName = path.basename(realPath);
        const packageId = path.basename(path.dirname(realPath));
        const approvalMessage = `Read the contents of "${fileName}" (${fileSize.toLocaleString("en-US")} bytes) ` +
            `from SendSafely package ${packageId}?\n\n` +
            `This file was received via SendSafely's secure transfer and ` +
            `may contain sensitive or confidential information. Approving ` +
            `will expose its contents to the AI assistant.`;
        const approval = await ctx.requireUserApproval(approvalMessage);
        const denied = approvalGateError(approval, "read this file's contents and expose them to the assistant", {
            proceedWithoutPrompt: args.proceed_without_prompt,
            abortPrefix: "Read aborted",
        });
        if (denied)
            return denied;
        const mimeLookup = mime.lookup(realPath);
        const mimeType = typeof mimeLookup === "string" ? mimeLookup : "";
        let isText = false;
        if (mimeType &&
            (mimeType.startsWith("text/") || TEXT_APPLICATION_MIMES.has(mimeType))) {
            isText = true;
        }
        else if (mimeType !== "application/pdf" && !mimeType.startsWith("image/")) {
            isText = await sampleIsText(realPath);
        }
        if (fileSize > MAX_FILE_READ_SIZE) {
            return jsonError(`File too large to read (${fileSize} bytes). ` +
                `Maximum supported size is ${MAX_FILE_READ_SIZE} bytes.`);
        }
        if (isText) {
            const content = await readFile(realPath, "utf8");
            const truncated = content.length > MAX_TEXT_PREVIEW;
            const result = {
                status: "success",
                file_name: fileName,
                file_path: realPath,
                file_size: fileSize,
                content_type: "text",
                content: truncated ? content.slice(0, MAX_TEXT_PREVIEW) : content,
            };
            if (truncated) {
                result.truncated = true;
                result.total_characters = content.length;
            }
            return jsonResult(result);
        }
        if (mimeType && mimeType.startsWith("image/")) {
            const raw = await readFile(realPath);
            return {
                content: [{ type: "image", data: raw.toString("base64"), mimeType }],
                isError: false,
            };
        }
        if (mimeType === "application/pdf") {
            const raw = await readFile(realPath);
            const pagesToProcess = Array.from({ length: MAX_PDF_PAGES + 1 }, (_, i) => i + 1);
            const rendered = await pdfToPng(raw, { viewportScale: 2.0, pagesToProcess });
            if (rendered.length === 0) {
                return jsonError("Failed to read file: PDF has no renderable pages");
            }
            const pages = rendered.slice(0, MAX_PDF_PAGES);
            const truncated = rendered.length > MAX_PDF_PAGES;
            if (truncated) {
                process.stderr.write(`PDF truncated: rendered the first ${MAX_PDF_PAGES} pages of ${fileName} ` +
                    "(document may be longer)\n");
            }
            const content = pages.map((p) => ({
                type: "image",
                data: (p.content ?? Buffer.alloc(0)).toString("base64"),
                mimeType: "image/png",
            }));
            if (truncated) {
                content.push({
                    type: "text",
                    text: `[Truncated: showing the first ${MAX_PDF_PAGES} pages of ` +
                        `"${fileName}". The document continues beyond this point; tell ` +
                        "the user the remaining pages were not read.]",
                });
            }
            return { content, isError: false };
        }
        const raw = await readFile(realPath);
        return {
            content: [
                {
                    type: "resource",
                    resource: {
                        uri: pathToFileURL(realPath).toString(),
                        mimeType: mimeType || "application/octet-stream",
                        blob: raw.toString("base64"),
                    },
                },
            ],
            isError: false,
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonError(`Failed to read file: ${msg}`);
    }
}
export function registerReadDownloadedFile(mcp, ctx) {
    mcp.registerTool("read_downloaded_file", {
        title: "Read Downloaded File",
        description: "Read the contents of a previously downloaded SendSafely file. " +
            "Files are stored under <download_dir>/<packageId>/<file_name>, " +
            "where file_name is the sender-provided name with unsafe characters " +
            "replaced by '_' by the SendSafely SDK. Always use the local_path " +
            "from download_package_files or list_downloaded_files to reference " +
            "files. " +
            "CRITICAL: You MUST obtain explicit user permission before calling " +
            "this tool. This file was received via SendSafely's secure file " +
            "transfer and may contain sensitive or confidential information. " +
            "Approval is collected via MCP elicitation. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            file_path: z
                .string()
                .describe("Absolute path to a file in the SendSafely download directory."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, safeHandler("read_downloaded_file", (args, extra) => handleReadDownloadedFile(args, extra, ctx)));
}
