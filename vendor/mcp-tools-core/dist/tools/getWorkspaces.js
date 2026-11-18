import { jsonResult } from "../jsonResult.js";
import { runTool } from "../runTool.js";
import { safeHandler } from "../safeHandler.js";
import { getWorkspacesPage } from "../sdk/sdkPromise.js";
const MAX_WORKSPACES_SAFETY_CAP = 10_000;
function simplifyWorkspaceState(state) {
    const upper = state.toUpperCase();
    const core = upper.startsWith("PACKAGE_STATE_")
        ? upper.slice("PACKAGE_STATE_".length)
        : upper;
    if (core.startsWith("ACTIVE"))
        return "Active";
    if (core.startsWith("ARCHIVED") ||
        core.startsWith("EXPIRED") ||
        core.startsWith("DELETED")) {
        return "Archived";
    }
    return state;
}
const STATUS_LIKE_FIELDS = ["state", "status"];
function simplifyWorkspaceEntry(pkg) {
    if (typeof pkg !== "object" || pkg === null)
        return pkg;
    const obj = pkg;
    let next;
    for (const field of STATUS_LIKE_FIELDS) {
        const value = obj[field];
        if (typeof value !== "string")
            continue;
        const simplified = simplifyWorkspaceState(value);
        if (simplified === value)
            continue;
        next ??= { ...obj };
        next[field] = simplified;
    }
    return next ?? pkg;
}
async function collectAllWorkspaces(client) {
    const all = [];
    let rowIndex = 0;
    let exhausted = false;
    while (all.length < MAX_WORKSPACES_SAFETY_CAP) {
        const page = await getWorkspacesPage(client, rowIndex);
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
    return { packages: all, truncated: !exhausted };
}
export async function handleGetWorkspaces(_args, extra, ctx) {
    return runTool("get_workspaces", "Failed to retrieve workspaces", async () => {
        const client = await ctx.getClient(extra);
        const { packages, truncated } = await collectAllWorkspaces(client);
        return jsonResult({
            status: "success",
            workspaces: packages.map(simplifyWorkspaceEntry),
            truncated,
        });
    });
}
export function registerGetWorkspaces(mcp, ctx) {
    mcp.registerTool("get_workspaces", {
        title: "List Workspaces",
        description: "Get the authenticated user's SendSafely workspaces (VDR packages). " +
            "Pagination is handled internally up to a safety cap of 10,000 " +
            "workspaces. The response always includes a top-level `truncated` " +
            "boolean; when `true`, the cap was hit and additional workspaces " +
            "exist beyond what was returned. Surface this to the user so they " +
            "know the listing is incomplete. " +
            "Each workspace's `state` field is collapsed to " +
            "exactly one of two values for the listing: \"Active\" or " +
            "\"Archived\". This covers both the raw API enum " +
            "(PACKAGE_STATE_ACTIVE_* / PACKAGE_STATE_EXPIRED_* / " +
            "PACKAGE_STATE_DELETED_*) AND SendSafely's UI display strings " +
            "(\"Active – Pickup Complete\", \"Active – Waiting for Pickup\", " +
            "\"Archived (Expired)\", \"Archived (Deleted)\", etc.). When " +
            "summarising the list to the user, surface ONLY the words " +
            "\"Active\" or \"Archived\" — do NOT include any qualifier like " +
            "\"– Pickup Complete\" or \"(Expired)\" even if you remember " +
            "seeing it in earlier output. If you need the precise state for " +
            "a specific workspace (e.g. to distinguish expired vs. deleted " +
            "before acting on it), call get_package_information on that " +
            "workspace's package_id — the by-id endpoint preserves the full " +
            "state enum. " +
            "When rendering the list to the user, ALWAYS include the " +
            "workspace owner. The owner is on each entry as the " +
            "`packageOwner` field — surface it alongside the workspace name " +
            "(`label`) and state. Owner is who the workspace is managed by; " +
            "users typically scan a workspace list looking for theirs vs. " +
            "someone else's, so omitting it loses critical context. " +
            "SCOPE: the \"Active\" / \"Archived\" collapse rule above " +
            "applies ONLY to workspace entries returned by THIS tool. Other " +
            "package listings (get_received_packages, get_sent_packages) " +
            "return TRANSFER and DROPZONE packages whose detailed state " +
            "string is meaningful to the user — do NOT carry the collapse " +
            "behaviour over to those tools' output. Each tool's description " +
            "tells you how to render its own results.",
        inputSchema: {},
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_workspaces", (args, extra) => handleGetWorkspaces(args, extra, ctx)));
}
