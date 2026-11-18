import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export declare function handleGetPackageInformation(args: {
    package_id: string;
}, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerGetPackageInformation(mcp: McpServer, ctx: ToolContext): void;
