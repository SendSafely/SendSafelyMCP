import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
export interface DeleteFileArgs {
    package_id: string;
    file_id: string;
    directory_id?: string | undefined;
    proceed_without_prompt?: boolean | undefined;
}
export declare function handleDeleteFile(args: DeleteFileArgs, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerDeleteFile(mcp: McpServer, ctx: ToolContext): void;
