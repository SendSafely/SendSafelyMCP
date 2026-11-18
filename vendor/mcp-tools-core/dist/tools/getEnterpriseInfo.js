import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { enterpriseInfo } from "../sdk/sdkPromise.js";
export async function handleGetEnterpriseInfo(_args, extra, ctx) {
    return runTool("get_enterprise_info", "Failed to retrieve enterprise info", async () => {
        const client = await ctx.getClient(extra);
        const info = await enterpriseInfo(client);
        return jsonResult({ status: "success", enterprise_info: info });
    });
}
export function registerGetEnterpriseInfo(mcp, ctx) {
    mcp.registerTool("get_enterprise_info", {
        title: "Get Enterprise Information",
        description: "Retrieve organization-level information about the SendSafely " +
            "enterprise account that the authenticated user belongs to. " +
            "Returns host, system name, branding (header/link colors), and " +
            "feature flags such as whether undisclosed recipients are allowed.",
        inputSchema: {},
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_enterprise_info", (args, extra) => handleGetEnterpriseInfo(args, extra, ctx)));
}
