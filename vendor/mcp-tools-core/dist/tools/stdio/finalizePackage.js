import { z } from "zod";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { finalizePackage, notifyPackageRecipients } from "../../sdk/sdkPromise.js";
const SHARE_LINK_MESSAGE = "Package finalized. SendSafely did NOT email recipients — surface the " +
    "secure_link from this response to the user and tell them they need to " +
    "send the link to all recipients themselves.";
const NOTIFIED_MESSAGE = "Package finalized and recipient notification emails dispatched by " +
    "SendSafely. The secure_link is also in the response — only show it to " +
    "the user if they explicitly ask for it.";
export async function handleFinalizePackage(args, extra, ctx, cacheFor) {
    return runTool("finalize_package", "Failed to finalize package", async () => {
        const client = await ctx.getClient(extra);
        const secrets = cacheFor(extra).get(args.package_id);
        if (!secrets)
            throw new MissingPackageSecretsError(args.package_id);
        if (!secrets.packageCode) {
            return jsonError(`Cached secrets for packageId '${args.package_id}' do not include a ` +
                "packageCode; the cache entry was populated without one. " +
                "Repopulate via create_package, get_package_information_from_link, " +
                "or get_package_keycode (Trusted Device unlock) to get a full " +
                "cache entry including packageCode.");
        }
        const result = await finalizePackage(client, args.package_id, secrets.packageCode, secrets.keyCode);
        if (!args.auto_notify) {
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                auto_notify: false,
                notified: false,
                result,
                message: SHARE_LINK_MESSAGE,
            });
        }
        try {
            await notifyPackageRecipients(client, args.package_id, secrets.keyCode);
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                auto_notify: true,
                notified: true,
                result,
                message: NOTIFIED_MESSAGE,
            });
        }
        catch (notifyErr) {
            const notifyError = notifyErr instanceof Error ? notifyErr.message : String(notifyErr);
            return jsonResult({
                status: "success",
                package_id: args.package_id,
                auto_notify: true,
                notified: false,
                notify_error: notifyError,
                result,
                message: "Package finalized, but the recipient-notification request " +
                    "failed. SendSafely did NOT email recipients — surface the " +
                    "secure_link to the user and tell them they need to share it " +
                    "with all recipients themselves to complete delivery.",
            });
        }
    });
}
export function registerFinalizePackage(mcp, ctx, cacheFor) {
    mcp.registerTool("finalize_package", {
        title: "Finalize Package",
        description: "Finalize a SendSafely package — publishes it so recipients can " +
            "access it. The package's secret material must be in the " +
            "server-side cache (populated by create_package, " +
            "get_package_information_from_link, or get_package_keycode via a " +
            "registered Trusted Device). " +
            "REQUIRED PRE-CALL STEP: Before calling this tool, you MUST ask " +
            "the user whether SendSafely should automatically email the secure " +
            "link to recipients. Pass their answer as the `auto_notify` " +
            "parameter (true = SendSafely sends notification emails; false = " +
            "no email, the user will share the link themselves). Do NOT pick " +
            "a default on the user's behalf — always ask first. " +
            "Behavior: " +
            "(auto_notify=true) the server invokes SendSafely's notify " +
            "endpoint after finalize; response has `notified: true` and " +
            "secure_link, which you should only show to the user if they " +
            "explicitly ask. " +
            "(auto_notify=false) no email is sent; response has " +
            "`notified: false` and secure_link, which you MUST surface to the " +
            "user along with instructions that they need to share it with " +
            "every recipient themselves. " +
            "If the notify request fails after finalize succeeds, the response " +
            "degrades to the auto_notify=false shape (success + secure_link + " +
            "`notify_error`) — package is still published; user must share the " +
            "link manually.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            auto_notify: z
                .boolean()
                .describe("REQUIRED. Whether SendSafely should automatically email the " +
                "secure link to all recipients after the package is " +
                "finalized. You MUST ask the user this question before " +
                "calling — do not assume a default. Pass true to send " +
                "notification emails; pass false to skip notifications, in " +
                "which case the user will be responsible for sharing the " +
                "returned secure_link with the recipients themselves."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("finalize_package", (args, extra) => handleFinalizePackage(args, extra, ctx, cacheFor)));
}
