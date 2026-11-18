import { z } from "zod";
import { jsonError, jsonResult } from "../jsonResult.js";
import { stripPackageSecrets } from "../store/packageSecretCache.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { updatePackage } from "../sdk/sdkPromise.js";
export async function handleUpdatePackage(args, extra, ctx) {
    return runTool("update_package", "Failed to update package", async () => {
        const data = {};
        const updates = {};
        if (args.label !== undefined) {
            data.label = args.label;
            updates.label = args.label;
        }
        if (args.expiration_days !== undefined) {
            data.life = args.expiration_days;
            updates.expiration_days = args.expiration_days;
        }
        if (args.enable_watermark !== undefined) {
            data.addWatermark = args.enable_watermark;
            updates.enable_watermark = args.enable_watermark;
        }
        if (args.restrict_file_save_and_print !== undefined) {
            data.pdfViewOnly = args.restrict_file_save_and_print;
            updates.restrict_file_save_and_print = args.restrict_file_save_and_print;
        }
        if (args.recipient_access_limit !== undefined) {
            data.maxAccessLimit = args.recipient_access_limit;
            updates.recipient_access_limit = args.recipient_access_limit;
        }
        if (Object.keys(data).length === 0) {
            return jsonError("At least one update field must be provided (label, " +
                "expiration_days, enable_watermark, restrict_file_save_and_print, " +
                "or recipient_access_limit). Calling update_package with only " +
                "package_id is a no-op and is rejected client-side to avoid " +
                "wasted round-trips.");
        }
        const client = await ctx.getClient(extra);
        const info = await updatePackage(client, args.package_id, data);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            updates,
            package_info: stripPackageSecrets(info),
        });
    });
}
export function registerUpdatePackage(mcp, ctx) {
    mcp.registerTool("update_package", {
        title: "Update Package Settings",
        description: "Update one or more settings on a SendSafely package or Workspace " +
            "in a single call. Every update field is optional, but at least " +
            "one must be supplied — the tool rejects empty updates. " +
            "Field reference: " +
            "(label) Display name for the package. On a WORKSPACE this is the " +
            "workspace name shown in the SendSafely UI — when the user says " +
            "\"rename the workspace\", they mean this field. Up to 255 " +
            "characters; SendSafely validates the character set server-side. " +
            "(expiration_days) Package expiration window. 0 = never expires; " +
            "any positive integer = that many days of recipient access. " +
            "Tenant-specific maxima are enforced server-side; do not assume a " +
            "hard cap. " +
            "(enable_watermark) When true, SendSafely watermarks PDFs and " +
            "images served from the package; when false, watermarking is " +
            "disabled. " +
            "(restrict_file_save_and_print) When true, applies SendSafely's " +
            "\"Restrict File Saving and Printing\" setting to PDFs and images " +
            "so recipients can view but not save or print them. " +
            "(recipient_access_limit) Package-level limit on the number of " +
            "times each recipient can download/view files and messages. " +
            "Supported on TRANSFER and DROPZONE packages only; SendSafely " +
            "rejects this field for WORKSPACE packages.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            label: z
                .string()
                .max(255)
                .optional()
                .describe("Optional. New display name for the package (0–255 " +
                "characters). On a WORKSPACE this is the workspace name " +
                "the user sees in the SendSafely UI — if the user asks to " +
                "rename a workspace, set this field. SendSafely validates " +
                "the character set server-side; pass whatever the user " +
                "supplies and surface any server error."),
            expiration_days: z
                .number()
                .int()
                .min(0)
                .optional()
                .describe("Optional. Package expiration window in days. 0 = never " +
                "expires; any positive integer = that many days of access. " +
                "Tenant-specific maximum is enforced by the API."),
            enable_watermark: z
                .boolean()
                .optional()
                .describe("Optional. When true, SendSafely watermarks PDFs and images " +
                "served from this package; when false, watermarking is " +
                "disabled."),
            restrict_file_save_and_print: z
                .boolean()
                .optional()
                .describe("Optional. When true, applies SendSafely's \"Restrict File " +
                "Saving and Printing\" setting to PDFs and images so " +
                "recipients can view but not save or print them."),
            recipient_access_limit: z
                .number()
                .int()
                .min(1)
                .optional()
                .describe("Optional. Per-recipient limit on the number of times each " +
                "recipient can download/view files and messages in the " +
                "package. TRANSFER and DROPZONE packages only; SendSafely " +
                "rejects this field on WORKSPACE packages."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("update_package", (args, extra) => handleUpdatePackage(args, extra, ctx)));
}
