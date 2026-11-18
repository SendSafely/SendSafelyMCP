import { z } from "zod";
import { jsonError } from "./jsonResult.js";
import { sanitizeForPrompt } from "./utils/sanitizeFilename.js";
export function elicitationUnsupportedConsentPrompt(action, optInParam) {
    return ("The connected MCP client does not support elicitation, so an approval " +
        `prompt cannot be shown before this action would ${action}. Do not set ` +
        `${optInParam}=true on your own initiative. ASK THE USER directly, in ` +
        "your reply, whether they want to proceed without a guaranteed approval " +
        "prompt — make clear there is no UI confirmation in this client. ONLY " +
        `if they explicitly agree, call this tool again with ${optInParam}=true.`);
}
export async function requireUserApproval(server, message) {
    const capabilities = server.getClientCapabilities();
    const supportsElicitation = Boolean(capabilities?.elicitation?.form);
    if (!supportsElicitation) {
        const clientInfo = server.getClientVersion();
        const clientId = clientInfo
            ? `${clientInfo.name} ${clientInfo.version}`
            : "unknown client";
        process.stderr.write(`[WARN] Client '${clientId}' does not support MCP elicitation; ` +
            `returning "unsupported"; gated tools will deny until the user opts in.\n`);
        return { outcome: "unsupported" };
    }
    try {
        const result = await server.elicitInput({
            message: sanitizeForPrompt(message),
            requestedSchema: {
                type: "object",
                properties: {
                    approve: {
                        type: "boolean",
                        description: "Approve this operation?",
                    },
                },
                required: ["approve"],
            },
        });
        if (result.action === "accept") {
            if (result.content?.approve === true) {
                return { outcome: "approved" };
            }
            return {
                outcome: "declined",
                reason: "User did not grant approval.",
            };
        }
        if (result.action === "decline") {
            return { outcome: "declined", reason: "User declined the operation." };
        }
        if (result.action === "cancel") {
            return {
                outcome: "cancelled",
                reason: "User cancelled the authorization prompt.",
            };
        }
        return {
            outcome: "error",
            message: `Unknown elicitation action: ${String(result.action)}`,
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { outcome: "error", message: `Authorization prompt failed: ${msg}` };
    }
}
export async function requireUserChoice(server, message, choices) {
    const capabilities = server.getClientCapabilities();
    const supportsElicitation = Boolean(capabilities?.elicitation?.form);
    if (!supportsElicitation) {
        const clientInfo = server.getClientVersion();
        const clientId = clientInfo
            ? `${clientInfo.name} ${clientInfo.version}`
            : "unknown client";
        process.stderr.write(`[WARN] Client '${clientId}' does not support MCP elicitation; ` +
            `requireUserChoice falling back to "unsupported".\n`);
        return { outcome: "unsupported" };
    }
    const enumValues = choices.map((c) => c.value);
    const enumNames = choices.map((c) => c.label);
    try {
        const result = await server.elicitInput({
            message: sanitizeForPrompt(message),
            requestedSchema: {
                type: "object",
                properties: {
                    choice: {
                        type: "string",
                        description: "Pick one of the listed options.",
                        enum: enumValues,
                        enumNames,
                    },
                },
                required: ["choice"],
            },
        });
        if (result.action === "accept") {
            const picked = typeof result.content?.choice === "string"
                ? result.content.choice
                : undefined;
            if (picked && enumValues.includes(picked)) {
                return { outcome: "selected", value: picked };
            }
            return {
                outcome: "error",
                message: `Elicitation returned an unexpected choice: ${String(picked)}`,
            };
        }
        if (result.action === "decline") {
            return { outcome: "declined", reason: "User declined the prompt." };
        }
        if (result.action === "cancel") {
            return {
                outcome: "cancelled",
                reason: "User cancelled the prompt.",
            };
        }
        return {
            outcome: "error",
            message: `Unknown elicitation action: ${String(result.action)}`,
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { outcome: "error", message: `Choice prompt failed: ${msg}` };
    }
}
export const CONSENT_FALLBACK_INSTRUCTIONS = "On a client without elicitation support, ask the user in your reply " +
    "and call again with proceed_without_prompt=true once they agree.";
export const proceedWithoutPromptSchema = z
    .boolean()
    .optional()
    .describe("Records the user's explicit, in-conversation agreement to proceed " +
    "on a client that does not support elicitation. Do not set it on " +
    "your own initiative — but when the user has clearly agreed, set " +
    "it to true so the action they asked for can complete.");
export function approvalGateError(approval, action, options = {}) {
    const prefix = options.abortPrefix ?? "Operation aborted";
    if (approval.outcome === "declined" || approval.outcome === "cancelled") {
        return jsonError(`${prefix}: ${approval.reason}`);
    }
    if (approval.outcome === "error") {
        return jsonError(`${prefix}: ${approval.message}`);
    }
    if (approval.outcome === "unsupported" && !options.proceedWithoutPrompt) {
        return jsonError(elicitationUnsupportedConsentPrompt(action, "proceed_without_prompt"));
    }
    return undefined;
}
