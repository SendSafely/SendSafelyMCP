import { SendSafelyApiError } from "./oauthError.js";
export function classifyHttpError(status, headers) {
    const challenge = headers?.get("www-authenticate") ?? "";
    if (status === 401) {
        return new SendSafelyApiError("Access token expired or invalid", "OAUTH_TOKEN_INVALID");
    }
    if (status === 403 && /insufficient_scope/i.test(challenge)) {
        return new SendSafelyApiError("The access token lacks a scope required by this request", "OAUTH_INSUFFICIENT_SCOPE");
    }
    if (status === 503 && (headers?.get("retry-after") ?? null) !== null) {
        return new SendSafelyApiError("SendSafely is temporarily unavailable; retry shortly", "OAUTH_TEMPORARILY_UNAVAILABLE");
    }
    return new SendSafelyApiError(`SendSafely request failed with HTTP ${String(status)}.`, String(status));
}
export async function signedRequest(ss, endpoint, method, data = null) {
    const response = await ss.wrapperRequest.sendSignedRequest({ url: endpoint, HTTPMethod: method, mimetype: "application/json" }, data);
    if (!response.ok) {
        throw classifyHttpError(response.status, response.headers);
    }
    const body = (await response.json());
    if (body.response && body.response !== "SUCCESS") {
        const msg = body.message;
        throw new Error(msg && msg.length > 0
            ? `SendSafely error ${body.response}: ${msg}`
            : `SendSafely error ${body.response}`);
    }
    return body;
}
