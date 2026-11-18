import { jsonResult } from "../jsonResult.js";
import { stripPackageSecrets } from "../store/packageSecretCache.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { getReceivedPackagesPage } from "../sdk/sdkPromise.js";
const MAX_PACKAGES_SAFETY_CAP = 10_000;
async function collectAllReceivedPackages(client) {
    const all = [];
    let rowIndex = 0;
    while (all.length < MAX_PACKAGES_SAFETY_CAP) {
        const page = await getReceivedPackagesPage(client, rowIndex);
        const pkgs = page.packages ?? [];
        if (pkgs.length === 0)
            break;
        all.push(...pkgs);
        if (page.totalPackages !== undefined && all.length >= page.totalPackages) {
            break;
        }
        rowIndex += pkgs.length;
    }
    return all;
}
export async function handleGetReceivedPackages(_args, extra, ctx) {
    return runTool("get_received_packages", "Failed to retrieve packages", async () => {
        const client = await ctx.getClient(extra);
        const packages = await collectAllReceivedPackages(client);
        return jsonResult({
            status: "success",
            packages: packages.map((p) => p !== null && typeof p === "object" ? stripPackageSecrets(p) : p),
        });
    });
}
export function registerGetReceivedPackages(mcp, ctx) {
    mcp.registerTool("get_received_packages", {
        title: "List Received Packages",
        description: "Get all packages received by the authenticated user. " +
            "Returns a list of received packages with metadata such as package ID, " +
            "sender, state, and timestamps. " +
            "State rendering: surface each package's state string AS-IS, " +
            "exactly as the API returned it (e.g. \"Active – Pickup Complete\", " +
            "\"Archived (Expired)\"). Do NOT collapse it to a generic " +
            "\"Active\" / \"Archived\" bucket — that collapse is specific to " +
            "get_workspaces and would lose useful detail here (received " +
            "packages are TRANSFER / DROPZONE flows where pickup state, " +
            "expiration, and similar qualifiers matter to the user).",
        inputSchema: {},
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_received_packages", (args, extra) => handleGetReceivedPackages(args, extra, ctx)));
}
