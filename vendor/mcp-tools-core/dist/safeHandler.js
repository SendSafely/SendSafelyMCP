import { jsonError } from "./jsonResult.js";
import { oauthFailureKind, recordOAuthFailure } from "./sdk/oauthError.js";
let toolErrorLogger = (entry) => {
    process.stderr.write(`[ERROR] tool=${entry.toolName} session=${entry.sessionId ?? "stdio"}: ${entry.message}\n`);
};
export function setToolErrorLogger(logger) {
    toolErrorLogger = logger;
}
export function safeHandler(toolName, fn) {
    return async (args, extra) => {
        try {
            return await fn(args, extra);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const correlationId = extra.authInfo?.extra?.["correlationId"];
            const oauthKind = oauthFailureKind(err);
            if (oauthKind !== undefined) {
                recordOAuthFailure(extra.authInfo?.extra, oauthKind);
            }
            toolErrorLogger({
                toolName,
                ...(extra.sessionId !== undefined && { sessionId: extra.sessionId }),
                ...(typeof correlationId === "string" && { correlationId }),
                message: msg,
            });
            if (oauthKind !== undefined)
                return jsonError(msg);
            return jsonError(`Internal error in ${toolName}. See server logs.`);
        }
    };
}
