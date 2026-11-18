import type SendSafelyClient from "@sendsafely/sendsafely";
import type { ApprovalResult, ApprovalServer, ChoiceOption, ChoiceResult } from "./approval.js";
export type { ApprovalServer };
export interface ToolExtra {
    sessionId?: string;
    authInfo?: {
        token?: string;
        extra?: Record<string, unknown>;
    };
}
export interface ToolContext {
    getClient(extra: ToolExtra): Promise<SendSafelyClient>;
    getDownloadDir(extra: ToolExtra): string;
    requireUserApproval(message: string): Promise<ApprovalResult>;
    requireUserChoice(message: string, choices: ChoiceOption[]): Promise<ChoiceResult>;
}
export declare class CredentialResolutionError extends Error {
    constructor(message: string, name: string);
}
export declare class MissingCredentialsError extends CredentialResolutionError {
    constructor(message: string);
}
export declare class InvalidTokenError extends CredentialResolutionError {
    constructor(message: string);
}
