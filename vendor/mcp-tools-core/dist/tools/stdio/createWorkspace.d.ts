import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../../context.js";
import type { CacheFor } from "../../store/packageSecretCache.js";
interface CreateWorkspaceArgs {
    workspace_name: string;
}
export declare function handleCreateWorkspace(args: CreateWorkspaceArgs, extra: ToolExtra, ctx: ToolContext, cacheFor: CacheFor): Promise<CallToolResult>;
export declare function registerCreateWorkspace(mcp: McpServer, ctx: ToolContext, cacheFor: CacheFor): void;
export {};
