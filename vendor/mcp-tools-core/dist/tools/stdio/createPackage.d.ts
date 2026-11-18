import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../../context.js";
import type { CacheFor } from "../../store/packageSecretCache.js";
export declare function handleCreatePackage(_args: Record<string, never>, extra: ToolExtra, ctx: ToolContext, cacheFor: CacheFor): Promise<CallToolResult>;
export declare function registerCreatePackage(mcp: McpServer, ctx: ToolContext, cacheFor: CacheFor): void;
