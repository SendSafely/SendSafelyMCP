import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { addRecipientPhonenumber } from "../sdk/sdkPromise.js";
export async function handleSetRecipientPhoneNumber(args, extra, ctx) {
    return runTool("set_recipient_phone_number", "Failed to set recipient phone number", async () => {
        const client = await ctx.getClient(extra);
        await addRecipientPhonenumber(client, args.package_id, args.recipient_id, args.phone_number, args.country_code);
        return jsonResult({
            status: "success",
            package_id: args.package_id,
            recipient_id: args.recipient_id,
        });
    });
}
export function registerSetRecipientPhoneNumber(mcp, ctx) {
    mcp.registerTool("set_recipient_phone_number", {
        title: "Set Recipient Phone Number",
        description: "Attach or update the phone number used for SMS verification on an " +
            "existing recipient. No outbound SMS is sent at this point — it " +
            "only configures the contact info.",
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            recipient_id: z.string().describe("The unique recipient ID."),
            phone_number: z
                .string()
                .describe("Phone number for SMS verification."),
            country_code: z
                .string()
                .describe("Country code for the phone number (e.g. '1' for US)."),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("set_recipient_phone_number", (args, extra) => handleSetRecipientPhoneNumber(args, extra, ctx)));
}
