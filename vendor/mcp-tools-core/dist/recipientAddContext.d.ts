import type { PackageInfo } from "@sendsafely/sendsafely";
import type { ChoiceOption } from "./approval.js";
import type { SendSafelyClient } from "./sdk/clientFactory.js";
import type { ToolContext } from "./context.js";
export type RecipientAddContext = {
    kind: "block_deleted";
    state: string;
} | {
    kind: "active_workspace";
} | {
    kind: "active_transfer_finalized";
    state: string;
} | {
    kind: "expired";
    state: string;
} | {
    kind: "unfinalized_or_unknown";
};
export declare function classifyRecipientAddContext(info: PackageInfo): RecipientAddContext;
export declare function tryBuildKeyedLink(client: SendSafelyClient, cachedKeyCode: string, cachedPackageCode: string | undefined): string | null;
export declare function buildShareLinkMessage(context: RecipientAddContext, recipientDescription: string, secureLink: string): string;
export declare const COLLABORATOR_ROLE_CHOICES: ChoiceOption[];
export interface RoleApplyOutcome {
    recipient_id: string;
    email?: string;
    applied_role: string;
    error?: string;
}
export interface RolePromptResult {
    prompted: boolean;
    chose_role: string | null;
    prompt_outcome: "selected" | "kept_default" | "declined" | "cancelled" | "unsupported" | "error";
    prompt_error?: string;
    outcomes: RoleApplyOutcome[];
    message: string;
}
interface AddedRecipient {
    recipient_id: string;
    email?: string | undefined;
}
export declare function promptAndApplyWorkspaceRole(ctx: ToolContext, client: SendSafelyClient, packageId: string, added: AddedRecipient[], recipientDescription: string): Promise<RolePromptResult>;
export {};
