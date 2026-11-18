import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
type HasSessionId = {
    sessionId?: string;
    authInfo?: {
        extra?: Record<string, unknown>;
    };
};
export interface ToolErrorLogEntry {
    toolName: string;
    sessionId?: string;
    correlationId?: string;
    message: string;
}
export type ToolErrorLogger = (entry: ToolErrorLogEntry) => void;
export declare function setToolErrorLogger(logger: ToolErrorLogger): void;
export declare function safeHandler<A, E extends HasSessionId>(toolName: string, fn: (args: A, extra: E) => Promise<CallToolResult>): (args: A, extra: E) => Promise<CallToolResult>;
export {};
