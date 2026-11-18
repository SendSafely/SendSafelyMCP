import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../../context.js";
import { type CacheFor } from "../../store/packageSecretCache.js";
export interface UploadFileArgs {
    package_id: string;
    file_path: string;
    directory_id?: string | undefined;
    proceed_without_prompt?: boolean | undefined;
}
export declare function handleUploadFile(args: UploadFileArgs, extra: ToolExtra, ctx: ToolContext, cacheFor: CacheFor): Promise<CallToolResult>;
export declare function registerUploadFile(mcp: McpServer, ctx: ToolContext, cacheFor: CacheFor): void;
