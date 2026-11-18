import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { updateRecipientRole } from "../sdk/sdkPromise.js";
export async function handleUpdateRecipientRole(args, extra, ctx) {
    return runTool("update_recipient_role", "Failed to update recipient role", async () => {
        const client = await ctx.getClient(extra);
        await updateRecipientRole(client, args.package_id, args.recipient_id, args.role_name);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            recipient_id: args.recipient_id,
            role_name: args.role_name,
        });
    });
}
export function registerUpdateRecipientRole(mcp, ctx) {
    mcp.registerTool("update_recipient_role", {
        title: "Update Recipient Role",
        description: "Change a collaborator's role on a Workspace (virtual data room) " +
            "package. SendSafely's Workspace roles are MANAGER, CONTRIBUTOR, " +
            "LIMITED_CONTRIBUTOR, and VIEWER — surface them to the user as " +
            "Manager / Contributor / Limited Contributor / Viewer for " +
            "readability, but pass the UPPERCASE form on the wire. The default " +
            "role assigned when a collaborator is added is VIEWER; use this " +
            "tool to upgrade or change that role later.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            recipient_id: z.string().describe("The unique recipient ID."),
            role_name: z
                .string()
                .describe("New role name to assign. SendSafely accepts the UPPERCASE " +
                "strings VIEWER, LIMITED_CONTRIBUTOR, CONTRIBUTOR, or MANAGER. " +
                "When in doubt, mirror the exact string returned in " +
                "`recipients[].roleName` from get_package_information."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("update_recipient_role", (args, extra) => handleUpdateRecipientRole(args, extra, ctx)));
}
