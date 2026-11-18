import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleSetRecipientPhoneNumber(args: {
    package_id: string;
    recipient_id: string;
    phone_number: string;
    country_code: string;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerSetRecipientPhoneNumber(mcp: McpServer, ctx: ToolContext): void;
