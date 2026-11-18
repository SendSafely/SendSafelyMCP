export class SendSafelyApiError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.name = "SendSafelyApiError";
        this.code = code;
    }
}
const CODE_TO_KIND = {
    OAUTH_TOKEN_INVALID: "invalid_token",
    OAUTH_INSUFFICIENT_SCOPE: "insufficient_scope",
    OAUTH_TEMPORARILY_UNAVAILABLE: "temporarily_unavailable",
};
export function oauthFailureKind(err) {
    if (!(err instanceof SendSafelyApiError))
        return undefined;
    return CODE_TO_KIND[err.code];
}
export const OAUTH_FAILURE_KEY = "oauthFailure";
export function recordOAuthFailure(bag, kind) {
    if (bag === undefined)
        return;
    if (bag[OAUTH_FAILURE_KEY] === undefined)
        bag[OAUTH_FAILURE_KEY] = kind;
}
const KINDS = [
    "invalid_token",
    "insufficient_scope",
    "temporarily_unavailable",
];
export function readOAuthFailure(bag) {
    const recorded = bag?.[OAUTH_FAILURE_KEY];
    return KINDS.find((kind) => kind === recorded);
}
