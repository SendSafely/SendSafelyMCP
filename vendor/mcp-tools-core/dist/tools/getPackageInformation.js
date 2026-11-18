import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { stripPackageSecrets } from "../store/packageSecretCache.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { packageInformation } from "../sdk/sdkPromise.js";
export async function handleGetPackageInformation(args, extra, ctx) {
    return runTool("get_package_information", "Failed to retrieve package information", async () => {
        const client = await ctx.getClient(extra);
        const info = await packageInformation(client, args.package_id);
        return jsonResult({
            status: "success",
            package_info: stripPackageSecrets(info),
        });
    });
}
export function registerGetPackageInformation(mcp, ctx) {
    mcp.registerTool("get_package_information", {
        title: "Get Package Information",
        description: "Retrieve metadata for a SendSafely package by package ID. " +
            "Returns subject, sender, recipients, files, state, timestamps, " +
            "and — for TRANSFER and DROPZONE packages — per-recipient download " +
            "and view history under `recipients[].confirmations` (one entry " +
            "per recipient access event; surfaced to senders in the SendSafely " +
            "UI as the recipient's \"Recipient History\"). For WORKSPACE " +
            "(virtual data room) packages, recipient activity is NOT carried " +
            "here; call get_activity_log for the Workspace's full Activity " +
            "Log instead. Use `packageType` on the response to decide. " +
            "This tool doesn't return the package Keycode, so it can't be " +
            "used to unlock or read package contents.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_package_information", (args, extra) => handleGetPackageInformation(args, extra, ctx)));
}
