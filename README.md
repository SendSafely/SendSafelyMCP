# SendSafely MCP Server

The SendSafely MCP (Model Context Protocol) server lets AI assistants interact directly with the SendSafely encrypted file transfer platform: sending packages, managing recipients, uploading/downloading files, administering workspaces, and querying activity logs, all through natural language.

This server works with **any MCP-compatible AI client** (Claude Desktop, Claude Code, Cursor, Windsurf, VS Code, OpenAI Codex, and others). Install and credential steps below are identical regardless of which client you use. Only the final "connect to your client" step differs, since each client stores its MCP configuration in a different place.


---

## Prerequisites

| Requirement | Details |
|---|---|
| **Node.js 24.16.0+** | The server is written for Node 24; older versions are not supported. npm warns at install time and the server is not expected to run. |
| **npm 11.11.0+** | Ships with Node 24+. |
| **A SendSafely account** | Including an API key & secret. [How to obtain one.](https://support.sendsafely.com/hc/en-us/articles/204583665-Obtaining-an-API-Key-and-API-Secret) |
| **Network access to npmjs.com** | The server is published as [`@sendsafely/mcp-server-local`](https://www.npmjs.com/package/@sendsafely/mcp-server-local) on the public npm registry, and the install pulls its dependencies from there too. |
| **An MCP-compatible AI client** | Claude Desktop, Claude Code, Cursor, Windsurf, VS Code (with MCP/Copilot support), OpenAI Codex (CLI or desktop app), or any other client that supports stdio MCP servers. |

---

## Step 1 — Check your Node version

```bash
node --version
```

You need `v24.16.0` or newer. If you see a lower version or `command not found`:

- **Recommended (macOS/Linux):** install [nvm](https://github.com/nvm-sh/nvm), then:
  ```bash
  nvm install 24
  nvm use 24
  ```
- **Alternative:** download the latest LTS release (24.x) from [nodejs.org](https://nodejs.org/).
- **Windows:** use [nvm-windows](https://github.com/coreybutler/nvm-windows) or the nodejs.org installer.

Then re-check:

```bash
node --version    # should print v24.16.0 or higher
npm --version     # should print 11.11.0 or higher
```

---

## Step 2 — Install the server from npm

Create a dedicated directory and install the package into it:

**macOS / Linux**
```bash
mkdir -p ~/sendsafely-mcp
cd ~/sendsafely-mcp
npm install @sendsafely/mcp-server-local
```

**Windows (PowerShell)**
```powershell
mkdir $HOME\sendsafely-mcp
cd $HOME\sendsafely-mcp
npm install @sendsafely/mcp-server-local
```

The install pulls its dependencies from the public npm registry. To install a specific release instead of the latest, add its version number from the [npm page](https://www.npmjs.com/package/@sendsafely/mcp-server-local?activeTab=versions): `npm install @sendsafely/mcp-server-local@<version>`. To upgrade later, re-run the same `npm install` command from the same directory.

The package installs two commands under `node_modules/.bin`: `sendsafely-mcp-server` (the MCP server, the same program as `dist/server.js`) and `sendsafely-setup-credentials` (the same as `dist/setupCredentials.js`). This guide uses the explicit `node` plus `dist/...js` form throughout because MCP clients launch the server with a minimal `PATH` and need absolute paths.

If you would rather not keep a local install, `npx` can fetch and run the package on demand. The package ships two commands, so name the one you want with `-p`; a bare `npx @sendsafely/mcp-server-local` fails with `could not determine executable to run`:

```bash
npx -y -p @sendsafely/mcp-server-local sendsafely-setup-credentials
npx -y -p @sendsafely/mcp-server-local sendsafely-mcp-server
```

The rest of this guide assumes the local install above.

**Note these two absolute paths.**  You'll need both in Step 4:

1. **Path to `node`** — run `which node` (macOS/Linux) or `where.exe node` (Windows).
   Typical output: `/Users/you/.nvm/versions/node/v24.16.0/bin/node`
2. **Path to the installed server**, which should be exactly:
   - macOS/Linux: `~/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js`
   - Windows: `C:/Users/you/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js`

Verify the server file exists:

```bash
# macOS / Linux
ls ~/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js

# Windows (PowerShell)
Test-Path $HOME\sendsafely-mcp\node_modules\@sendsafely\mcp-server-local\dist\server.js
```

---

## Step 3 — Configure credentials in your OS keychain

Credentials are stored encrypted, never in plaintext, in:

- macOS Keychain
- Windows Credential Manager
- Secret Service on Linux (requires gnome-keyring or similar)

This step is identical no matter which AI client you're connecting.

```bash
# macOS / Linux
node ~/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/setupCredentials.js

# Windows (PowerShell)
node $HOME\sendsafely-mcp\node_modules\@sendsafely\mcp-server-local\dist\setupCredentials.js
```

When prompted, enter:

1. **SendSafely URL**. Your portal URL, **including the `https://` prefix** (e.g. `https://yourcompany.sendsafely.com`). Do not enter a bare hostname: setup stops with `SENDSAFELY_URL must use https://` and saves nothing.
2. **API Key**. From your SendSafely account settings
3. **API Secret**. From your SendSafely account settings

Check what's configured, or remove credentials later:

```bash
node <path-to-server-dist>/setupCredentials.js --status
node <path-to-server-dist>/setupCredentials.js --clear
```

---

## Step 4 — Connect the server to your AI client

Every client below uses a stdio MCP server pointed at the same two paths from Step 2; only the config file location (and occasionally the JSON key name) changes.

### Claude Desktop

Edit (or create):
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

(Claude Desktop → Settings → Developer → Edit Config also opens this file.)

**macOS / Linux**
```json
{
  "mcpServers": {
    "sendsafely": {
      "command": "/Users/you/.nvm/versions/node/v24.16.0/bin/node",
      "args": [
        "/Users/you/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js"
      ]
    }
  }
}
```

**Windows** — use forward slashes in both paths (backslashes are invalid JSON escapes; Node accepts forward slashes on Windows):
```json
{
  "mcpServers": {
    "sendsafely": {
      "command": "C:/Users/you/AppData/Roaming/nvm/v24.16.0/node.exe",
      "args": [
        "C:/Users/you/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js"
      ]
    }
  }
}
```

If other servers are already configured, merge `sendsafely` into the existing `mcpServers` object rather than replacing it.

### Claude Code

Register from the terminal (adjust paths to match yours):

```bash
claude mcp add sendsafely -- /Users/you/.nvm/versions/node/v24.16.0/bin/node /Users/you/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js
```

Or add the same JSON block as Claude Desktop above under `mcpServers` in `.mcp.json` (project scope) or your user-level Claude Code config.

### Cursor

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project-scoped). Same schema as Claude Desktop:

```json
{
  "mcpServers": {
    "sendsafely": {
      "command": "/Users/you/.nvm/versions/node/v24.16.0/bin/node",
      "args": [
        "/Users/you/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js"
      ]
    }
  }
}
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json` — same `mcpServers` schema as above.

### VS Code (MCP / Copilot, Cline, and similar extensions)

VS Code's native MCP support uses `servers` (not `mcpServers`) in `.vscode/mcp.json`, and typically expects a `type` field:

```json
{
  "servers": {
    "sendsafely": {
      "type": "stdio",
      "command": "/Users/you/.nvm/versions/node/v24.16.0/bin/node",
      "args": [
        "/Users/you/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js"
      ]
    }
  }
}
```

Extensions like Cline typically use the same `mcpServers` schema as Claude Desktop instead. Check your extension's MCP settings panel.

### OpenAI Codex (CLI and desktop app)

Codex's CLI and desktop app (the desktop experience runs inside the ChatGPT app) share a single config file; you only need to edit it once for both surfaces.

Edit (or create) `~/.codex/config.toml` and add:

```toml
[mcp_servers.sendsafely]
command = "/Users/you/.nvm/versions/node/v24.16.0/bin/node"
args = ["/Users/you/sendsafely-mcp/node_modules/@sendsafely/mcp-server-local/dist/server.js"]
startup_timeout_sec = 60
```

Use the same `node` and `server.js` paths from Step 2 — Codex needs the full absolute path to `node` because the desktop app launches with a minimal `PATH` and won't find a bare `node`.

**Load it:**
- **Terminal (CLI):** just run `codex` — it reads `config.toml` on launch.
- **Desktop app:** if it was already open, fully quit and relaunch so it re-reads the config (or run `codex app` from the terminal).

**Verify:** prompt `Verify my SendSafely credentials are working.` — Codex should call `verify_credentials` and report success.

### Other MCP-compatible clients

Any client that supports **stdio MCP servers** can run this server. You need two things from Step 2: the path to `node`, and the path to `server.js`. Consult your client's MCP documentation for where it stores server config and which JSON key it expects (`mcpServers` vs `servers` are the two common conventions).

> **Important (all clients):** the SendSafely URL you entered in Step 3 must include the `https://` prefix — this is client-independent.

---

## Step 5 — Restart and verify

1. **Fully quit and relaunch** your AI client (for Claude Desktop: ⌘Q on macOS, or Quit from the tray icon on Windows; closing the window is not enough. Other clients: reload the window / restart the extension).
2. Check your client's MCP/server status panel for `sendsafely` showing as connected.
3. In a new chat, try: `Verify my SendSafely credentials.`

If the connection fails, check your client's MCP logs/panel for the error, and re-confirm the `node` and `server.js` paths from Step 2.

---

## Tools

The server exposes 38 tools. Tools marked **approval** pause and ask for your confirmation before they run; see [Security model](#security-model) for how that prompt reaches you.

**Account and listings**

| Tool | What it does |
|---|---|
| `verify_credentials` | Checks that the stored API key and secret work against your SendSafely portal |
| `get_enterprise_info` | Returns organization-level settings (host, system name, branding, enabled features) |
| `get_received_packages` | Lists packages sent to you |
| `get_sent_packages` | Lists packages you sent, active and/or archived |
| `get_workspaces` | Lists your workspaces; the response carries a `truncated` flag when the listing is incomplete |

**Inspecting a package**

| Tool | What it does |
|---|---|
| `get_package_information` | Metadata for a package by ID: subject, recipients, files, state, type |
| `get_package_information_from_link` | Resolves a SendSafely secure link to the same metadata and remembers the link's key for later tool calls |
| `get_package_message` | Decrypts and returns the secure message attached to a package. **approval** |
| `get_activity_log` | Audit log (downloads, views, access events) for a workspace |
| `get_file_information` | Metadata for one file in a package |
| `get_recipient` | Details for one recipient on a package |
| `get_directory` | Lists the files and subdirectories of a workspace directory |

**Downloading and reading files**

| Tool | What it does |
|---|---|
| `download_package_files` | Downloads and decrypts the files of a package to local disk. **approval** |
| `download_file_from_directory` | Downloads and decrypts one file from a workspace directory. **approval** |
| `list_downloaded_files` | Lists files previously downloaded by this server |
| `read_downloaded_file` | Returns the contents of a downloaded file to the assistant. **approval** |

**Sending**

| Tool | What it does |
|---|---|
| `create_package` | Creates a new, empty package. On clients that can show a prompt, asks whether to show you the package's keyed link; the package is created either way |
| `create_workspace` | Creates a new, empty workspace package |
| `upload_file` | Encrypts and uploads a local file into an unfinalized package. **approval** |
| `add_package_message` | Encrypts and attaches a secure text message to an unfinalized package |
| `add_recipient` | Adds a recipient by email to a package or workspace. On a workspace, clients that can show a prompt ask which role to give the new collaborator (Viewer, Contributor or Manager); they are added as Viewer and stay Viewer unless you pick another role |
| `add_recipients_bulk` | Adds several recipients in one call. On a workspace, asks for the role once, as `add_recipient` does, and applies it to everyone added |
| `add_recipient_with_sms` | Adds a recipient who must verify by SMS code before access. On a workspace, asks for the role as `add_recipient` does |
| `set_recipient_phone_number` | Sets or updates the SMS number of an existing recipient |
| `finalize_package` | Finalizes the package so recipients can access it. SendSafely emails them the secure link only if you ask for that; otherwise you share the link yourself |
| `finalize_undisclosed_package` | Finalizes a package protected by a link and password instead of a named recipient list |

**Managing packages and workspaces**

| Tool | What it does |
|---|---|
| `update_package` | Changes package settings: name, expiration, watermarking, save/print restrictions |
| `update_recipient_role` | Changes a recipient's role on a workspace |
| `remove_recipient` | Removes a recipient from a package |
| `update_file` | Renames a file in a workspace or Dropzone package |
| `delete_file` | Permanently deletes a file from a package. **approval** |
| `delete_package` | Permanently deletes a package. **approval** |
| `create_directory` | Creates a directory in a workspace, at the root or nested |
| `rename_directory` | Renames a workspace directory |
| `move_directory` | Moves a directory to a new parent in the same workspace |
| `delete_directory` | Permanently deletes a directory and its contents. **approval** |

**Trusted Device**

| Tool | What it does |
|---|---|
| `generate_trusted_device_keypair` | Generates a Trusted Device key pair, registers the public key with SendSafely and stores the private key in your OS keychain. **approval** |
| `get_package_keycode` | Unlocks a package you received using the Trusted Device private key, so the receive-flow tools work by package ID without a link. **approval** |

---

## Security model

The server runs on your machine and talks to SendSafely with your API key, so anything it does, it does as you. The operations that matter most ask for your confirmation first:

- Downloading a package or workspace file (`download_package_files`, `download_file_from_directory`) decrypts it to local disk.
- Reading a downloaded file (`read_downloaded_file`) or a secure message (`get_package_message`) hands the decrypted contents to the AI assistant.
- Uploading a file (`upload_file`) reads a file from your machine and encrypts it into a package.
- Deleting a package, file, or directory is irreversible.
- Unlocking a package Keycode (`get_package_keycode`) and registering a Trusted Device (`generate_trusted_device_keypair`) touch your account's key material.

How that confirmation works depends on your client:

**Tier 1, MCP elicitation** (Claude Code 2.1.76 and later from the command line, and other clients that advertise the capability): the server pauses the tool call and the client shows you a real approve/decline prompt before the operation runs. The prompt is rendered by the client, outside the assistant's control, so the assistant cannot answer it for you.

**Tier 2, chat-mediated consent** (Claude Desktop at the time of writing, and any other client without elicitation): the server has no way to prompt you directly. The first call to a gated tool is refused, and the assistant is instructed to ask you in the chat and, only if you agree, call the tool again with a `proceed_without_prompt` flag. The server cannot verify that the assistant actually asked, so on these clients the safeguard rests on the assistant following its instructions. If you want a hard guarantee that nothing is decrypted or deleted without a prompt you can see, use a Tier 1 client.

**Known client issue (October 2026):** the Claude Code desktop app renders neither the elicitation prompt nor the Tier 2 yes/no fallback, so approval-gated tools do not complete there. The Claude Code command line and the Cowork desktop app both work; use one of those with this server until the desktop app is fixed.

Two things follow from this. Treat a chat that says "I've downloaded and read the file" without you ever being asked as a reason to check your client's tool-call log. And once a Trusted Device is registered from this machine, new packages sent to you can be unlocked here without pasting a link, so that registration deserves the same care as installing a browser extension with access to your account.

Decrypted files land under `SENDSAFELY_DOWNLOAD_DIR` (default: a `sendsafely_downloads` folder in your OS temp directory) in a per-package folder. If you set `SENDSAFELY_DOWNLOAD_DIR`, point it at a dedicated directory you own. The server refuses to write when the per-package path already exists as a symlink or a file. On macOS and Linux the per-package folder is readable only by your user, and the server refuses a download root owned by another user (other than root) or one that other users can write to without the sticky bit (the protection `/tmp` has). On Windows these ownership checks do not run, and the folder takes its permissions from its parent directory.

Your API secret and Trusted Device private keys live in the OS keychain and never appear in tool output. The one exception is the environment-variable fallback described under [Troubleshooting](#troubleshooting), where the API secret is read from `SENDSAFELY_API_SECRET` instead. `SENDSAFELY_URL` must be an `https://` address; the server refuses plain `http://` except for localhost.

---

## Troubleshooting

> **Approval prompts are expected.** Downloading or uploading files, reading decrypted file contents or secure messages, deleting packages, files, or directories, unlocking a package Keycode, generating a Trusted Device key pair, and disclosing a new package's keyed link all pause and ask for your confirmation before proceeding. Adding a recipient to a workspace asks which role to give them once they are added. Approving is safe and intended; this is not an error. If your client cannot show prompts, see [Security model](#security-model) above.

| Symptom | Fix |
|---|---|
| Client doesn't show `sendsafely` / SendSafely tools | Double-check the config file path and JSON key for your client, and fully restart the client |
| `No usable keychain backend found` (Linux) | Install `gnome-keyring` or an equivalent Secret Service provider |
| Authentication / connection errors | Re-run `setupCredentials.js` and confirm the URL includes `https://`; confirm the API key hasn't been revoked |
| `node` not found by the client | Confirm the `command` path matches the output of `which node` / `where.exe node` exactly |
| `SENDSAFELY_URL must use https://` | Re-run `setupCredentials.js` with the full `https://` portal URL; plain `http://` is only accepted for localhost |
| `Refusing to use '<dir>': path exists and is not a real directory`, or an `EEXIST` or `ENOENT` error from `mkdir '<dir>'` | A symlink or a file sits where the server wants the per-package download folder. Remove it, or set `SENDSAFELY_DOWNLOAD_DIR` to a dedicated directory |
| `SendSafely credentials not available` even after setup | Credential resolution is keychain-first with an environment-variable fallback: re-run `setupCredentials.js`, or set `SENDSAFELY_URL` / `SENDSAFELY_API_KEY` / `SENDSAFELY_API_SECRET` as environment variables if your keychain is unavailable (e.g. headless/CI environments) |
| Module-not-found on start | Confirm dependencies were installed inside the same directory as Step 2 (a global `npm install` won't put the package where the config points) |

---

## Support

- **Bugs in this package:** open an issue at [https://github.com/SendSafely/SendSafelyMCP/issues](https://github.com/SendSafely/SendSafelyMCP/issues). Include the package version, your Node.js version, your MCP client and its version, and the error text from the client's MCP log. Please redact SendSafely URLs, package IDs and file names.
- **Security issues:** report them through the [SendSafely Bug Reporting Form](https://explore.sendsafely.com/security/bug-report/) as described in [SECURITY.md](https://github.com/SendSafely/SendSafelyMCP/blob/main/SECURITY.md). Please do not file them as public issues.
- **Your SendSafely account, API key or the platform itself:** contact support@sendsafely.com.
- **Pull requests:** the GitHub repository is a publish-only mirror of each released version. Pull request creation is restricted to SendSafely collaborators, so outside contributors cannot open one. See [CONTRIBUTING.md](https://github.com/SendSafely/SendSafelyMCP/blob/main/CONTRIBUTING.md).

---

## License

Apache License 2.0, see [LICENSE](https://github.com/SendSafely/SendSafelyMCP/blob/main/LICENSE). Third-party notices, including the LGPL-3.0 licensed OpenPGP.js dependency that the SendSafely SDK requires, are in [NOTICE](https://github.com/SendSafely/SendSafelyMCP/blob/main/NOTICE).
