import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../../context.js";
import { type CacheFor } from "../../store/packageSecretCache.js";
export interface DownloadFileFromDirectoryArgs {
    package_id: string;
    directory_id: string;
    file_id: string;
    proceed_without_prompt?: boolean | undefined;
}
export declare function handleDownloadFileFromDirectory(args: DownloadFileFromDirectoryArgs, extra: ToolExtra, ctx: ToolContext, cacheFor: CacheFor): Promise<CallToolResult>;
export declare function registerDownloadFileFromDirectory(mcp: McpServer, ctx: ToolContext, cacheFor: CacheFor): void;
