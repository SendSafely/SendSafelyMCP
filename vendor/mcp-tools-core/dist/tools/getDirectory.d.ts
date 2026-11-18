import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleGetDirectory(args: {
    package_id: string;
    directory_id: string;
    directory_index?: number | undefined;
    file_index?: number | undefined;
    sort_field?: string | undefined;
    sort_order?: "asc" | "desc" | undefined;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerGetDirectory(mcp: McpServer, ctx: ToolContext): void;
