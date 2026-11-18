import { jsonResult } from "../../jsonResult.js";
import { buildKeyedLink } from "../../utils/packageLink.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { createPackage } from "../../sdk/sdkPromise.js";
export async function handleCreatePackage(_args, extra, ctx, cacheFor) {
    return runTool("create_package", "Failed to create package", async () => {
        const client = await ctx.getClient(extra);
        const created = await createPackage(client);
        cacheFor(extra).set(created.packageId, {
            keyCode: created.keyCode,
            serverSecret: created.serverSecret,
            packageCode: created.packageCode,
        });
        const approval = await ctx.requireUserApproval(`SendSafely package ${created.packageId} created. Show you the keyed ` +
            "link (secure URL containing the keycode fragment) for this package? " +
            "The link will not grant recipient access until you call " +
            "finalize_package.");
        const includeLink = approval.outcome === "approved";
        const secureLink = includeLink
            ? buildKeyedLink(client, created.packageCode, created.keyCode)
            : undefined;
        const approvalErrored = approval.outcome === "error";
        return jsonResult({
            status: "success",
            package_id: created.packageId,
            ...(secureLink ? { secure_link: secureLink } : {}),
            ...(approvalErrored ? { approval_error: approval.message } : {}),
            message: "Empty package created. Add files with upload_file, recipients with " +
                "add_recipient, and an optional message with add_package_message, " +
                "then call finalize_package to send it." +
                (secureLink
                    ? " The keyed link above can be shared with the user as a reference."
                    : "") +
                (approvalErrored
                    ? ` The keyed-link approval prompt could not be shown (${approval.message}), ` +
                        "so no link is included here; it will be offered again by " +
                        "finalize_package or add_recipient."
                    : ""),
        });
    });
}
export function registerCreatePackage(mcp, ctx, cacheFor) {
    mcp.registerTool("create_package", {
        title: "Create Package",
        description: "Create a new empty SendSafely package. Returns the package ID, " +
            "and — when the user approves the prompt — the package's keyed " +
            "link (a secure URL with the `#keyCode=` fragment) for the user's " +
            "own reference. On clients without elicitation the link is " +
            "withheld here and returned by finalize_package instead. " +
            "The package is unfinalized: no email is sent and " +
            "no recipient can access it until finalize_package runs, so the " +
            "keyed link here is informational. Secret material (keyCode, " +
            "serverSecret) is cached server-side for downstream send-flow " +
            "tools so the caller does not need to thread it through every " +
            "subsequent tool call.",
        inputSchema: {},
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, safeHandler("create_package", (args, extra) => handleCreatePackage(args, extra, ctx, cacheFor)));
}
