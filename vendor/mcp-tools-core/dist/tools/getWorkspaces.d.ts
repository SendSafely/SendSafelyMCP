import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleGetWorkspaces(_args: Record<string, never>, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerGetWorkspaces(mcp: McpServer, ctx: ToolContext): void;
