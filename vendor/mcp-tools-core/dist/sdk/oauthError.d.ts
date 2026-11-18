export type OAuthFailureKind = "invalid_token" | "insufficient_scope" | "temporarily_unavailable";
export declare class SendSafelyApiError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare function oauthFailureKind(err: unknown): OAuthFailureKind | undefined;
export declare const OAUTH_FAILURE_KEY = "oauthFailure";
export declare function recordOAuthFailure(bag: Record<string, unknown> | undefined, kind: OAuthFailureKind): void;
export declare function readOAuthFailure(bag: Record<string, unknown> | undefined): OAuthFailureKind | undefined;
