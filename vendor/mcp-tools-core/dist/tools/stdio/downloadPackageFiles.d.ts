import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../../context.js";
import { type CacheFor } from "../../store/packageSecretCache.js";
export declare function extractKeyCode(link: string): string | null;
export interface DownloadPackageFilesArgs {
    link?: string | undefined;
    package_id?: string | undefined;
    proceed_without_prompt?: boolean | undefined;
}
export declare function handleDownloadPackageFiles(args: DownloadPackageFilesArgs, extra: ToolExtra, ctx: ToolContext, cacheFor?: CacheFor): Promise<CallToolResult>;
export declare function registerDownloadPackageFiles(mcp: McpServer, ctx: ToolContext, cacheFor?: CacheFor): void;
