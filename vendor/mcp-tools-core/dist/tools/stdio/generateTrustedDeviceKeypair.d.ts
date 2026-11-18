import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../../context.js";
import { type KeyStore } from "../../store/keyStore.js";
export interface GenerateTrustedDeviceKeypairArgs {
    description: string;
    proceed_without_prompt?: boolean | undefined;
}
export declare function handleGenerateTrustedDeviceKeypair(args: GenerateTrustedDeviceKeypairArgs, extra: ToolExtra, ctx: ToolContext, keyStore: KeyStore): Promise<CallToolResult>;
export declare function registerGenerateTrustedDeviceKeypair(mcp: McpServer, ctx: ToolContext, keyStore: KeyStore): void;
