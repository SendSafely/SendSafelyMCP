import SendSafelyClient from "@sendsafely/sendsafely";
import { MCP_REQUEST_API } from "../constants.js";
export function sdkSupportsBearerAuth() {
    return typeof SendSafelyClient.withBearerToken === "function";
}
const LOOPBACK_URL = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i;
export function isAllowedPortalUrl(url) {
    return /^https:\/\//i.test(url) || LOOPBACK_URL.test(url);
}
export const INSECURE_URL_MESSAGE = "SENDSAFELY_URL must use https:// (plain http is only allowed for " +
    "localhost). Credentials must not be sent in cleartext.";
export function createSendSafelyClient(creds) {
    if (!isAllowedPortalUrl(creds.url)) {
        throw new Error(INSECURE_URL_MESSAGE);
    }
    if ("accessToken" in creds) {
        if (!sdkSupportsBearerAuth()) {
            throw new Error("OAuth bearer authentication requires an @sendsafely/sendsafely " +
                "build with withBearerToken support (4.0.1+); the installed " +
                "version does not have it. Use API-key authentication, or " +
                "upgrade the SDK dependency.");
        }
        return SendSafelyClient.withBearerToken(creds.url, creds.accessToken, MCP_REQUEST_API);
    }
    return new SendSafelyClient(creds.url, creds.apiKey, creds.apiSecret, MCP_REQUEST_API);
}
export function setMcpClientVersion(version) {
    SendSafelyClient.setClientVersion(`SendSafely MCP/${version}`);
}
