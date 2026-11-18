import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolExtra } from "../context.js";
interface UpdatePackageArgs {
    package_id: string;
    label?: string | undefined;
    expiration_days?: number | undefined;
    enable_watermark?: boolean | undefined;
    restrict_file_save_and_print?: boolean | undefined;
    recipient_access_limit?: number | undefined;
}
export declare function handleUpdatePackage(args: UpdatePackageArgs, extra: ToolExtra, ctx: ToolContext): Promise<CallToolResult>;
export declare function registerUpdatePackage(mcp: McpServer, ctx: ToolContext): void;
export {};
