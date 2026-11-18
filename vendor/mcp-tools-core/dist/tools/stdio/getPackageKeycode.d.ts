import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../../context.js";
import { type KeyStore } from "../../store/keyStore.js";
import { type CacheFor } from "../../store/packageSecretCache.js";
export declare function handleGetPackageKeycode(args: {
    package_id: string;
    public_key_id?: string | undefined;
    proceed_without_prompt?: boolean | undefined;
}, extra: ToolExtra, ctx: ToolContext, cacheFor: CacheFor, keyStore: KeyStore): Promise<CallToolResult>;
export declare function registerGetPackageKeycode(mcp: McpServer, ctx: ToolContext, cacheFor: CacheFor, keyStore: KeyStore): void;
