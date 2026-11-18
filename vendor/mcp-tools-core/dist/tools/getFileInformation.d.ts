import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleGetFileInformation(args: {
    package_id: string;
    file_id: string;
    directory_id?: string | undefined;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerGetFileInformation(mcp: McpServer, ctx: ToolContext): void;
