import { z } from "zod";
import { approvalGateError, CONSENT_FALLBACK_INSTRUCTIONS, proceedWithoutPromptSchema, } from "../../approval.js";
import { jsonError, jsonResult } from "../../jsonResult.js";
import { ACTIVE_KEY_ID } from "../../store/keyStore.js";
import {} from "../../store/packageSecretCache.js";
import { runTool } from "../../runTool.js";
import { safeHandler } from "../../safeHandler.js";
import { getKeycode, packageInformation } from "../../sdk/sdkPromise.js";
export async function handleGetPackageKeycode(args, extra, ctx, cacheFor, keyStore) {
    return runTool("get_package_keycode", "Failed to cache package keycode", async () => {
        let publicKeyId = args.public_key_id;
        if (!publicKeyId) {
            const active = await keyStore.get(ACTIVE_KEY_ID);
            if (!active) {
                return jsonError("No Trusted Device is registered on this MCP server, so the " +
                    "package's Keycode cannot be retrieved without a keyed link. " +
                    "ACTION FOR THE AGENT: Ask the user whether they want to set " +
                    "up a Trusted Device for this MCP server. Present this " +
                    "disclaimer verbatim so they understand what they're agreeing " +
                    "to:\n\n" +
                    "  \"Setting up a Trusted Device means this MCP server (and " +
                    "the AI agent driving it) will be able to unlock any new " +
                    "SendSafely packages sent to you WITHOUT needing the keyed " +
                    "link each time. The private key is generated locally and " +
                    "stored only in this machine's OS keychain — SendSafely " +
                    "never sees it. But this does mean the agent inherits the " +
                    "ability to read those packages whenever it runs. Only " +
                    "agree if you trust this agent the same way you'd trust a " +
                    "logged-in browser session.\"\n\n" +
                    "If the user agrees, call generate_trusted_device_keypair " +
                    "(it requires its own approval prompt with the same security " +
                    "context). If they decline, fall back to asking them to " +
                    "paste the keyed link for the specific package they want to " +
                    "access and use get_package_information_from_link instead.");
            }
            publicKeyId = active;
        }
        const privateKey = await keyStore.get(publicKeyId);
        if (!privateKey) {
            return jsonError(`No Trusted Device private key found for public_key_id '${publicKeyId}'. ` +
                "Register one with generate_trusted_device_keypair, or pass the public_key_id " +
                "returned by that tool.");
        }
        const approval = await ctx.requireUserApproval(`Use the registered Trusted Device to unlock the decryption Keycode ` +
            `for SendSafely package ${args.package_id}? This caches the Keycode ` +
            `so the AI assistant can decrypt and read this package's files and ` +
            `messages without the secure link.`);
        const denied = approvalGateError(approval, "use the registered Trusted Device to unlock this package's decryption Keycode", {
            proceedWithoutPrompt: args.proceed_without_prompt,
        });
        if (denied)
            return denied;
        const client = await ctx.getClient(extra);
        const keyCode = await getKeycode(client, privateKey, publicKeyId, args.package_id);
        const info = await packageInformation(client, args.package_id);
        if (!info.serverSecret) {
            return jsonError(`Package '${args.package_id}' returned no serverSecret; cannot cache ` +
                "secrets for receive-flow tools.");
        }
        cacheFor(extra).set(args.package_id, {
            keyCode,
            serverSecret: info.serverSecret,
            ...(info.packageCode ? { packageCode: info.packageCode } : {}),
        });
        return jsonResult({
            status: "cached",
            package_id: args.package_id,
            message: "Package Keycode resolved via the Trusted Device and cached for " +
                "this session. Downstream receive-flow tools (get_package_message, " +
                "download_file_from_directory, download_package_files) can now " +
                "operate by package_id without re-supplying the secure link.",
        });
    });
}
export function registerGetPackageKeycode(mcp, ctx, cacheFor, keyStore) {
    mcp.registerTool("get_package_keycode", {
        title: "Get Package Keycode (Trusted Device)",
        description: "Resolve the Keycode for a SendSafely package using a registered " +
            "Trusted Device key pair. Looks up the encrypted Keycode from " +
            "SendSafely, decrypts it locally with the private key in the OS " +
            "keychain, and caches the result server-side so subsequent " +
            "receive-flow tools (get_package_message, download_file_from_directory, " +
            "download_package_files) can operate by package_id without the " +
            "caller pasting the secure link. By default the decrypted Keycode " +
            "is held in the server-side cache rather than echoed back in this " +
            "tool's result — downstream tools read it from the cache directly. " +
            "If the user explicitly wants the keyed link for their own " +
            "reference, surface it via finalize_package(auto_notify=false) or " +
            "construct it from get_package_information_from_link. " +
            "If public_key_id is omitted, the server uses " +
            "the most recently registered Trusted Device on this machine — " +
            "useful for clients that cannot read the OS keychain themselves to " +
            "discover the id. Fails when the Trusted Device has not been " +
            "authorized for the package (e.g., the package predates this " +
            "device's registration). Available only on transports that provide " +
            "a secure local key store (today: stdio). " +
            "Requires user approval via MCP elicitation — unlocking the Keycode " +
            "lets the assistant decrypt this package's files and messages, so the " +
            "user is prompted before the Trusted Device is used. " +
            CONSENT_FALLBACK_INSTRUCTIONS,
        inputSchema: {
            package_id: z.string().describe("The unique SendSafely package ID."),
            public_key_id: z
                .string()
                .optional()
                .describe("Optional. The publicKeyId of the Trusted Device key pair to " +
                "use for decryption — the same id returned by " +
                "generate_trusted_device_keypair. If omitted, the server " +
                "falls back to the most recently registered Trusted Device " +
                "on this machine."),
            proceed_without_prompt: proceedWithoutPromptSchema,
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, safeHandler("get_package_keycode", (args, extra) => handleGetPackageKeycode(args, extra, ctx, cacheFor, keyStore)));
}
