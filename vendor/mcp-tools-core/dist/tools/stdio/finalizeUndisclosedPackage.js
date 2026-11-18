import { z } from "zod";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { MissingPackageSecretsError, } from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { finalizeUndisclosedPackage } from "../../sdk/sdkPromise.js";
export async function handleFinalizeUndisclosedPackage(args, extra, ctx, cacheFor) {
    return runTool("finalize_undisclosed_package", "Failed to finalize undisclosed package", async () => {
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
        const result = await finalizeUndisclosedPackage(client, args.package_id, secrets.packageCode, secrets.keyCode, args.password);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            result,
        });
    });
}
export function registerFinalizeUndisclosedPackage(mcp, ctx, cacheFor) {
    mcp.registerTool("finalize_undisclosed_package", {
        title: "Finalize Undisclosed-Recipient Package",
        description: "Finalize a SendSafely package in undisclosed-recipient mode: " +
            "anyone with the resulting secure link plus the password can " +
            "retrieve the package. The password is the only recipient " +
            "authentication factor — do NOT also call add_recipient / " +
            "add_recipient_with_sms on an undisclosed package; named " +
            "recipients and the undisclosed flow are mutually exclusive. " +
            "Use this finalize variant instead of finalize_package when the " +
            "user wants \"anyone with the link and password\" access. The " +
            "package's secret material must be in the server-side cache — " +
            "typically because create_package was called to author it, or " +
            "because get_package_keycode unlocked it via a registered Trusted " +
            "Device.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            password: z
                .string()
                .min(1)
                .describe("Password recipients must enter to retrieve the package."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("finalize_undisclosed_package", (args, extra) => handleFinalizeUndisclosedPackage(args, extra, ctx, cacheFor)));
}
