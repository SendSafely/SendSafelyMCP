import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleCreateDirectory(args: {
    package_id: string;
    directory_name: string;
    parent_directory_id?: string | undefined;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerCreateDirectory(mcp: McpServer, ctx: ToolContext): void;
