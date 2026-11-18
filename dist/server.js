#!/usr/bin/env node
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools, SERVER_INSTRUCTIONS, setMcpClientVersion, } from "@sendsafely/mcp-tools-core";
import { createStdioContext } from "./context.js";
import { createKeychainKeyStore } from "./trustedDeviceKeyStore.js";
const _require = createRequire(import.meta.url);
const MCP_VERSION = _require("../package.json").version;
setMcpClientVersion(MCP_VERSION);
async function main() {
    process.on("SIGINT", () => {
        process.stderr.write("\nShutting down.\n");
        process.exit(130);
    });
    const fatal = (kind) => (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[ERROR] ${kind}, shutting down: ${msg}\n`);
        process.exit(1);
    };
    process.on("uncaughtException", fatal("uncaught exception"));
    process.on("unhandledRejection", fatal("unhandled rejection"));
    process.stderr.write("SendSafely MCP server running on stdio. Waiting for client connection... (Ctrl+C to stop)\n");
    const mcp = new McpServer({
        name: "SendSafely",
        title: "SendSafely — Secure Encrypted Data Transfer",
        description: "The SendSafely MCP server allows you to send and receive " +
            "encrypted files and messages using SendSafely's end-to-end " +
            "encrypted data transfer platform. You can also manage " +
            "recipients and view activity related to your SendSafely " +
            "packages.",
        websiteUrl: "https://www.sendsafely.com",
        version: MCP_VERSION,
    }, {
        capabilities: { tools: { listChanged: false } },
        instructions: SERVER_INSTRUCTIONS,
    });
    const ctx = createStdioContext(mcp.server);
    registerTools(mcp, ctx, { keyStore: createKeychainKeyStore() });
    const transport = new StdioServerTransport();
    await mcp.connect(transport);
}
main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Fatal error: ${msg}\n`);
    process.exit(1);
});
