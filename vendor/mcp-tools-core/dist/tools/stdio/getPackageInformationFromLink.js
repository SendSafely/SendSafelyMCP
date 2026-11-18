import { z } from "zod";
import { jsonResult } from "../../jsonResult.js";
import { stripPackageSecrets } from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { packageInformationFromLink } from "../../sdk/sdkPromise.js";
export async function handleGetPackageInformationFromLink(args, extra, ctx, cacheFor) {
    return runTool("get_package_information_from_link", "Failed to retrieve package information", async () => {
        const client = await ctx.getClient(extra);
        const info = await packageInformationFromLink(client, args.link);
        if (info.keyCode && info.serverSecret) {
            cacheFor(extra).set(String(info.packageId), {
                keyCode: info.keyCode,
                serverSecret: info.serverSecret,
                ...(info.packageCode ? { packageCode: info.packageCode } : {}),
            });
        }
        return jsonResult({
            status: "success",
            package_info: stripPackageSecrets(info),
        });
    });
}
export function registerGetPackageInformationFromLink(mcp, ctx, cacheFor) {
    mcp.registerTool("get_package_information_from_link", {
        title: "Get Package Information From Link",
        description: "Resolve a SendSafely secure link (including the #keyCode= " +
            "Keycode fragment) to package metadata. Caches the package's " +
            "secret material server-side so subsequent receive-flow tools " +
            "(get_package_message, download_file_from_directory) can operate " +
            "by package ID without re-supplying the link. Secrets are " +
            "stripped from the response. For TRANSFER and DROPZONE packages, " +
            "per-recipient download and view history is returned under " +
            "`recipients[].confirmations` (same shape as get_package_information; " +
            "surfaced to senders in the UI as the recipient's \"Recipient " +
            "History\"). For WORKSPACE packages, use get_activity_log for the " +
            "full Activity Log — `confirmations` is not populated there.",
        inputSchema: {
            link: z
                .string()
                .describe("Full SendSafely secure link including the #keyCode= fragment."),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_package_information_from_link", (args, extra) => handleGetPackageInformationFromLink(args, extra, ctx, cacheFor)));
}
