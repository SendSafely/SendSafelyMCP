import { buildKeyedLink } from "./utils/packageLink.js";
import { updateRecipientRole as sdkUpdateRecipientRole } from "./sdk/sdkPromise.js";
function startsWith(state, prefix) {
    return typeof state === "string" && state.startsWith(prefix);
}
function isWorkspace(info) {
    if (info.packageType === "WORKSPACE")
        return true;
    if (info.isVDR === true)
        return true;
    return false;
}
export function classifyRecipientAddContext(info) {
    const state = info.state;
    if (startsWith(state, "PACKAGE_STATE_DELETED_")) {
        return { kind: "block_deleted", state: state ?? "" };
    }
    if (isWorkspace(info)) {
        return { kind: "active_workspace" };
    }
    if (startsWith(state, "PACKAGE_STATE_EXPIRED_")) {
        return { kind: "expired", state: state ?? "" };
    }
    if (startsWith(state, "PACKAGE_STATE_ACTIVE_")) {
        return { kind: "active_transfer_finalized", state: state ?? "" };
    }
    return { kind: "unfinalized_or_unknown" };
}
export function tryBuildKeyedLink(client, cachedKeyCode, cachedPackageCode) {
    if (!cachedPackageCode)
        return null;
    return buildKeyedLink(client, cachedPackageCode, cachedKeyCode);
}
export function buildShareLinkMessage(context, recipientDescription, secureLink) {
    if (context.kind === "active_workspace") {
        return (`${recipientDescription} added as a collaborator. SendSafely does ` +
            "NOT send automatic notifications for workspace collaborators — " +
            "surface the secure_link below to the user and tell them they MUST " +
            "share it with the new collaborator(s) so they can access the " +
            `workspace.\nsecure_link: ${secureLink}`);
    }
    if (context.kind === "active_transfer_finalized") {
        return (`${recipientDescription} added to an already-finalized package ` +
            `(state ${context.state}). SendSafely does NOT auto-notify ` +
            "recipients added after finalize — surface the secure_link below " +
            "and tell the user they MUST share it with the new recipient(s) so " +
            `they can access the package.\nsecure_link: ${secureLink}`);
    }
    if (context.kind === "expired") {
        return (`${recipientDescription} added, but the package is currently ` +
            `EXPIRED (state ${context.state}). The recipient(s) cannot access ` +
            "the package until the user un-expires it (call update_package " +
            "with a positive `expiration_days`, or 0 to set never-expires). " +
            "After un-expiring, SendSafely will NOT " +
            "auto-notify these recipient(s), so the user will also need to " +
            "share secure_link below with them.\n" +
            `secure_link: ${secureLink}`);
    }
    return `${recipientDescription} added.`;
}
export const COLLABORATOR_ROLE_CHOICES = [
    { value: "VIEWER", label: "Viewer (keep default — read access only)" },
    {
        value: "CONTRIBUTOR",
        label: "Contributor (upload + manage files)",
    },
    {
        value: "MANAGER",
        label: "Manager (full workspace control, including collaborators)",
    },
];
export async function promptAndApplyWorkspaceRole(ctx, client, packageId, added, recipientDescription) {
    if (added.length === 0) {
        return {
            prompted: false,
            chose_role: null,
            prompt_outcome: "kept_default",
            outcomes: [],
            message: "",
        };
    }
    const prompt = await ctx.requireUserChoice(`${recipientDescription} added to the workspace as VIEWER (the default ` +
        "role — read access only). Would you like to keep them as Viewer, " +
        "upgrade to Contributor (upload + manage files), or Manager (full " +
        "workspace control)?", COLLABORATOR_ROLE_CHOICES);
    if (prompt.outcome === "unsupported") {
        return {
            prompted: false,
            chose_role: null,
            prompt_outcome: "unsupported",
            outcomes: added.map((a) => ({
                recipient_id: a.recipient_id,
                ...(a.email ? { email: a.email } : {}),
                applied_role: "VIEWER",
            })),
            message: "Role-change prompt is unsupported by this MCP client; collaborators " +
                "remain at the default VIEWER role. The user can call " +
                "update_recipient_role later to upgrade them to CONTRIBUTOR or " +
                "MANAGER.",
        };
    }
    if (prompt.outcome === "declined" || prompt.outcome === "cancelled") {
        return {
            prompted: true,
            chose_role: null,
            prompt_outcome: prompt.outcome,
            outcomes: added.map((a) => ({
                recipient_id: a.recipient_id,
                ...(a.email ? { email: a.email } : {}),
                applied_role: "VIEWER",
            })),
            message: `User ${prompt.outcome} the role-change prompt; collaborators remain ` +
                "at the default VIEWER role. They can be upgraded later via " +
                "update_recipient_role.",
        };
    }
    if (prompt.outcome === "error") {
        return {
            prompted: true,
            chose_role: null,
            prompt_outcome: "error",
            prompt_error: prompt.message,
            outcomes: added.map((a) => ({
                recipient_id: a.recipient_id,
                ...(a.email ? { email: a.email } : {}),
                applied_role: "VIEWER",
            })),
            message: "Role-change prompt failed; collaborators remain at the default " +
                "VIEWER role. The user can call update_recipient_role to change " +
                "this later.",
        };
    }
    const chosen = prompt.value;
    if (chosen === "VIEWER") {
        return {
            prompted: true,
            chose_role: "VIEWER",
            prompt_outcome: "kept_default",
            outcomes: added.map((a) => ({
                recipient_id: a.recipient_id,
                ...(a.email ? { email: a.email } : {}),
                applied_role: "VIEWER",
            })),
            message: "User kept collaborators at the default VIEWER role. No role " +
                "change applied.",
        };
    }
    const outcomes = [];
    let anyFailure = false;
    for (const rec of added) {
        try {
            await sdkUpdateRecipientRole(client, packageId, rec.recipient_id, chosen);
            outcomes.push({
                recipient_id: rec.recipient_id,
                ...(rec.email ? { email: rec.email } : {}),
                applied_role: chosen,
            });
        }
        catch (err) {
            anyFailure = true;
            const msg = err instanceof Error ? err.message : String(err);
            outcomes.push({
                recipient_id: rec.recipient_id,
                ...(rec.email ? { email: rec.email } : {}),
                applied_role: "VIEWER",
                error: msg,
            });
        }
    }
    const message = anyFailure
        ? `Selected role ${chosen} applied to some collaborators; one or more ` +
            "role updates failed and those collaborators remain at VIEWER " +
            "(see outcomes[].error). The user can retry via update_recipient_role."
        : `Selected role ${chosen} applied to all added collaborator(s).`;
    return {
        prompted: true,
        chose_role: chosen,
        prompt_outcome: "selected",
        outcomes,
        message,
    };
}
