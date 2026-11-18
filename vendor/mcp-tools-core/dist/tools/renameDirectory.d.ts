import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleRenameDirectory(args: {
    package_id: string;
    directory_id: string;
    directory_name: string;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerRenameDirectory(mcp: McpServer, ctx: ToolContext): void;
