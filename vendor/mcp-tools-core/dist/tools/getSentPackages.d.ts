import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleGetSentPackages(args: {
    state?: "active" | "archived" | "all" | undefined;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerGetSentPackages(mcp: McpServer, ctx: ToolContext): void;
