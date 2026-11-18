import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleGetActivityLog(args: {
    package_id: string;
    row_index?: number | undefined;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerGetActivityLog(mcp: McpServer, ctx: ToolContext): void;
