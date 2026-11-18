import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export interface DeleteDirectoryArgs {
    package_id: string;
    directory_id: string;
    proceed_without_prompt?: boolean | undefined;
}
export declare function handleDeleteDirectory(args: DeleteDirectoryArgs, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerDeleteDirectory(mcp: McpServer, ctx: ToolContext): void;
