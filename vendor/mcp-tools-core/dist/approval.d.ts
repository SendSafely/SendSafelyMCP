import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ClientCapabilities, ElicitRequestFormParams, ElicitRequestURLParams, ElicitResult, Implementation } from "@modelcontextprotocol/sdk/types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
export interface ApprovalServer {
    getClientCapabilities(): ClientCapabilities | undefined;
    getClientVersion(): Implementation | undefined;
    elicitInput(params: ElicitRequestFormParams | ElicitRequestURLParams, options?: RequestOptions): Promise<ElicitResult>;
}
export type ApprovalResult = {
    outcome: "approved";
} | {
    outcome: "declined";
    reason: string;
} | {
    outcome: "cancelled";
    reason: string;
} | {
    outcome: "unsupported";
} | {
    outcome: "error";
    message: string;
};
export type ChoiceResult = {
    outcome: "selected";
    value: string;
} | {
    outcome: "declined";
    reason: string;
} | {
    outcome: "cancelled";
    reason: string;
} | {
    outcome: "unsupported";
} | {
    outcome: "error";
    message: string;
};
export interface ChoiceOption {
    value: string;
    label: string;
}
export declare function elicitationUnsupportedConsentPrompt(action: string, optInParam: string): string;
export declare function requireUserApproval(server: ApprovalServer, message: string): Promise<ApprovalResult>;
export declare function requireUserChoice(server: ApprovalServer, message: string, choices: ChoiceOption[]): Promise<ChoiceResult>;
export declare const CONSENT_FALLBACK_INSTRUCTIONS: string;
export declare const proceedWithoutPromptSchema: z.ZodOptional<z.ZodBoolean>;
export declare function approvalGateError(approval: ApprovalResult, action: string, options?: {
    proceedWithoutPrompt?: boolean | undefined;
    abortPrefix?: string | undefined;
}): CallToolResult | undefined;
