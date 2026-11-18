import SendSafelyClient from "@sendsafely/sendsafely";
export interface SendSafelyCreds {
    url: string;
    apiKey: string;
    apiSecret: string;
}
export interface SendSafelyBearerCreds {
    url: string;
    accessToken: string;
}
export type SendSafelyClientCreds = SendSafelyCreds | SendSafelyBearerCreds;
export declare function sdkSupportsBearerAuth(): boolean;
export declare function isAllowedPortalUrl(url: string): boolean;
export declare const INSECURE_URL_MESSAGE: string;
export declare function createSendSafelyClient(creds: SendSafelyClientCreds): SendSafelyClient;
export declare function setMcpClientVersion(version: string): void;
export type { default as SendSafelyClient } from "@sendsafely/sendsafely";
