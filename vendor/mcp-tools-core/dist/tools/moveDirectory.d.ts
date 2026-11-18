import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleMoveDirectory(args: {
    package_id: string;
    source_directory_id: string;
    target_directory_id: string;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerMoveDirectory(mcp: McpServer, ctx: ToolContext): void;
