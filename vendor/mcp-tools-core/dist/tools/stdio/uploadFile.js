import path from "node:path";
import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../../approval.js";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { encryptAndUploadFile } from "../../sdk/sdkPromise.js";
export async function handleUploadFile(args, extra, ctx, cacheFor) {
    return runTool("upload_file", "Failed to upload file", async () => {
        if (!path.isAbsolute(args.file_path)) {
            return jsonError(`file_path must be absolute; received '${args.file_path}'.`);
        }
        const client = await ctx.getClient(extra);
        const secrets = cacheFor(extra).get(args.package_id);
        if (!secrets)
            throw new MissingPackageSecretsError(args.package_id);
        const approval = await ctx.requireUserApproval(`Read "${args.file_path}" from this machine, encrypt it, and upload it ` +
            `to SendSafely package ${args.package_id}` +
            `${args.directory_id ? ` (directory ${args.directory_id})` : ""}?`);
        const denied = approvalGateError(approval, "read a local file and upload it to a SendSafely package", {
            proceedWithoutPrompt: args.proceed_without_prompt,
            abortPrefix: "Upload aborted",
        });
        if (denied)
            return denied;
        const uploaded = await encryptAndUploadFile(client, args.package_id, secrets.keyCode, secrets.serverSecret, args.file_path, args.directory_id);
        return jsonResult({
            status: "success",
            package_id: uploaded.packageId,
            file_id: uploaded.fileId,
            file_name: uploaded.fileName,
            file_size: uploaded.fileSize,
            ...(args.directory_id ? { directory_id: args.directory_id } : {}),
        });
    });
}
export function registerUploadFile(mcp, ctx, cacheFor) {
    mcp.registerTool("upload_file", {
        title: "Upload File",
        description: "Encrypt and upload a single file from the local filesystem to an " +
            "unfinalized SendSafely package. Pass `directory_id` to upload " +
            "into a workspace directory; omit for the package root. The " +
            "package's secret material must be in the server-side cache — " +
            "typically because create_package / create_workspace was called " +
            "to author it, or because get_package_keycode unlocked it via a " +
            "registered Trusted Device. " +
            "CONSENT: this tool reads a file from the local machine, so it " +
            "requires user approval, collected via MCP elicitation. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            file_path: z
                .string()
                .describe("Absolute path to the local file to upload."),
            directory_id: z
                .string()
                .optional()
                .describe("Workspace directory ID. Omit to upload to the package root."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("upload_file", (args, extra) => handleUploadFile(args, extra, ctx, cacheFor)));
}
