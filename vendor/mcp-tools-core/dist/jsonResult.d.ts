import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
export declare function jsonResult(payload: Record<string, unknown>): CallToolResult;
export declare function jsonError(message: string, extra?: Record<string, unknown>): CallToolResult;
