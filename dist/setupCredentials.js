#!/usr/bin/env node
import readline from "node:readline/promises";
import { Writable } from "node:stream";
import { INSECURE_URL_MESSAGE, isAllowedPortalUrl, } from "@sendsafely/mcp-tools-core";
import { credentialSource, deleteCredential, getCredential, keyringAvailable, storeCredential, } from "./credentials.js";
const CREDENTIAL_NAMES = ["url", "api_key", "api_secret"];
const PROMPTS = {
    url: "SendSafely URL (e.g. https://company.sendsafely.com): ",
    api_key: "API Key: ",
    api_secret: "API Secret: ",
};
async function promptLine(question, masked) {
    let muted = false;
    const mutableOutput = new Writable({
        write(chunk, _enc, cb) {
            if (!muted)
                process.stdout.write(chunk);
            cb();
        },
    });
    const rl = readline.createInterface({
        input: process.stdin,
        output: mutableOutput,
        terminal: true,
    });
    try {
        const questionPromise = rl.question(question);
        if (masked)
            muted = true;
        const answer = await questionPromise;
        if (masked)
            process.stdout.write("\n");
        return answer;
    }
    finally {
        rl.close();
    }
}
async function cmdStore() {
    if (!keyringAvailable()) {
        process.stderr.write("Error: No usable keychain backend found.\n" +
            "Set SENDSAFELY_URL, SENDSAFELY_API_KEY, and SENDSAFELY_API_SECRET environment\n" +
            "variables instead.\n");
        process.exit(1);
    }
    process.stdout.write("Store SendSafely credentials in your OS keychain.\n\n");
    for (const name of CREDENTIAL_NAMES) {
        const current = getCredential(name);
        let prompt = PROMPTS[name];
        if (current) {
            prompt += "[press Enter to keep current] ";
        }
        const value = await promptLine(prompt, name === "api_secret");
        if (value && name === "url" && !isAllowedPortalUrl(value)) {
            process.stderr.write(`  Error: ${INSECURE_URL_MESSAGE}\n`);
            process.exit(1);
        }
        if (value) {
            try {
                storeCredential(name, value);
                process.stdout.write(`  Stored '${name}' in keychain.\n`);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                process.stderr.write(`  Error: ${msg}\n`);
            }
        }
        else if (current) {
            process.stdout.write(`  Kept existing '${name}'.\n`);
        }
        else {
            process.stdout.write(`  Skipped '${name}' (no value provided).\n`);
        }
    }
    process.stdout.write("\nDone. Credentials will be loaded from your OS keychain on next server start.\n");
}
function cmdStatus() {
    process.stdout.write("SendSafely MCP credential sources:\n\n");
    for (const name of CREDENTIAL_NAMES) {
        const source = credentialSource(name);
        const padded = name.padEnd(12, " ");
        if (name === "api_secret" || source === "not found") {
            process.stdout.write(`  ${padded} -> ${source}\n`);
        }
        else {
            const value = getCredential(name);
            process.stdout.write(`  ${padded} -> ${source} (${value})\n`);
        }
    }
    process.stdout.write("\n");
}
async function cmdClear() {
    if (!keyringAvailable()) {
        process.stderr.write("No usable keychain backend found.\n");
        process.exit(1);
    }
    const confirm = await promptLine("Remove all SendSafely credentials from the OS keychain? [y/N] ", false);
    if (confirm.toLowerCase() !== "y") {
        process.stdout.write("Cancelled.\n");
        return;
    }
    for (const name of CREDENTIAL_NAMES) {
        if (credentialSource(name) !== "keychain") {
            process.stdout.write(`  '${name}' not found in keychain (skipped).\n`);
            continue;
        }
        try {
            deleteCredential(name);
            process.stdout.write(`  Removed '${name}' from keychain.\n`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            process.stderr.write(`  Failed to remove '${name}': ${msg}\n`);
        }
    }
    process.stdout.write("\nDone. The server will fall back to environment variables.\n");
}
function printHelp() {
    process.stdout.write("Manage SendSafely MCP server credentials.\n" +
        "\n" +
        "Usage:\n" +
        "  sendsafely-setup-credentials           Store credentials interactively\n" +
        "  sendsafely-setup-credentials --status  Show where each credential is loaded from\n" +
        "  sendsafely-setup-credentials --clear   Remove all credentials from keychain\n");
}
async function main() {
    const args = process.argv.slice(2);
    const flags = new Set(args);
    if (flags.has("--help") || flags.has("-h")) {
        printHelp();
        return;
    }
    if (flags.has("--status") && flags.has("--clear")) {
        process.stderr.write("Error: --status and --clear are mutually exclusive.\n");
        process.exit(2);
    }
    if (flags.has("--status")) {
        cmdStatus();
        return;
    }
    if (flags.has("--clear")) {
        await cmdClear();
        return;
    }
    await cmdStore();
}
main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${msg}\n`);
    process.exit(1);
});
