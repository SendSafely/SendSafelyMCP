import type SendSafely from "@sendsafely/sendsafely";
import { SendSafelyApiError } from "./oauthError.js";
export declare function classifyHttpError(status: number, headers: {
    get(name: string): string | null;
} | undefined): SendSafelyApiError;
export declare function signedRequest<T>(ss: SendSafely, endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE", data?: unknown): Promise<T>;
