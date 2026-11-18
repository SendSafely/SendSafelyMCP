import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
export declare function runTool(toolName: string, failurePrefix: string, fn: () => Promise<CallToolResult>): Promise<CallToolResult>;
