import { z } from "zod";
import { jsonResult } from "../jsonResult.js";
import { stripPackageSecrets } from "../store/packageSecretCache.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { getActivePackagesPage, getArchivedPackagesPage, } from "../sdk/sdkPromise.js";
const MAX_PACKAGES_SAFETY_CAP = 10_000;
async function collectAllPackages(client, pageFn) {
    const all = [];
    let rowIndex = 0;
    let exhausted = false;
    while (all.length < MAX_PACKAGES_SAFETY_CAP) {
        const page = await pageFn(client, rowIndex);
        const pkgs = page.packages ?? [];
        if (pkgs.length === 0) {
            exhausted = true;
            break;
        }
        all.push(...pkgs);
        if (page.totalPackages !== undefined && all.length >= page.totalPackages) {
            exhausted = true;
            break;
        }
        rowIndex += pkgs.length;
    }
    return {
        packages: all.map((p) => p !== null && typeof p === "object" ? stripPackageSecrets(p) : p),
        truncated: !exhausted,
    };
}
export async function handleGetSentPackages(args, extra, ctx) {
    return runTool("get_sent_packages", "Failed to retrieve sent packages", async () => {
        const client = await ctx.getClient(extra);
        const state = args.state ?? "all";
        const result = {};
        let truncated = false;
        if (state === "active" || state === "all") {
            const r = await collectAllPackages(client, getActivePackagesPage);
            result.active = r.packages;
            if (r.truncated)
                truncated = true;
        }
        if (state === "archived" || state === "all") {
            const r = await collectAllPackages(client, getArchivedPackagesPage);
            result.archived = r.packages;
            if (r.truncated)
                truncated = true;
        }
        return jsonResult({ status: "success", ...result, truncated });
    });
}
export function registerGetSentPackages(mcp, ctx) {
    mcp.registerTool("get_sent_packages", {
        title: "List Sent Packages",
        description: "Get packages sent by the authenticated user. Use the optional " +
            "`state` parameter to filter to active or archived packages; the " +
            "default returns both. Pagination is handled internally up to a " +
            "safety cap of 10,000 packages per category. The response always " +
            "includes a top-level `truncated` boolean; when `true`, the cap " +
            "was hit and additional packages exist beyond what was returned. " +
            "Surface this to the user so they know the listing is incomplete. " +
            "State rendering: surface each package's per-entry state " +
            "string AS-IS, exactly as the API returned it (e.g. \"Active – " +
            "Pickup Complete\", \"Archived (Expired)\"). Do NOT collapse it " +
            "to a generic \"Active\" / \"Archived\" bucket — that collapse " +
            "is specific to get_workspaces. Sent packages are TRANSFER / " +
            "DROPZONE flows where pickup state, expiration, and similar " +
            "qualifiers matter to the sender.",
        inputSchema: {
            state: z
                .enum(["active", "archived", "all"])
                .optional()
                .describe("Filter by package state. 'active' = packages still available " +
                "to recipients; 'archived' = packages the sender has archived; " +
                "'all' (default) returns both lists."),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_sent_packages", (args, extra) => handleGetSentPackages(args, extra, ctx)));
}
