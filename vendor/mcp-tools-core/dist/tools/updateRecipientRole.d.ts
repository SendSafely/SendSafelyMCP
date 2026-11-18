import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleUpdateRecipientRole(args: {
    package_id: string;
    recipient_id: string;
    role_name: string;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerUpdateRecipientRole(mcp: McpServer, ctx: ToolContext): void;
