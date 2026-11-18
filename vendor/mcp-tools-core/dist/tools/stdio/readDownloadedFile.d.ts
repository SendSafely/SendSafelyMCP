import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../../context.js";
export declare function handleReadDownloadedFile(args: {
    file_path: string;
    proceed_without_prompt?: boolean | undefined;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerReadDownloadedFile(mcp: McpServer, ctx: ToolContext): void;
