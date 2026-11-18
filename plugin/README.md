# SendSafely for Claude

SendSafely is an end-to-end encrypted platform for sending files and running secure workspaces (virtual data rooms). This plugin connects Claude to your SendSafely account and adds a skill that keeps your workspaces tidy: it finds files nobody has opened in months, superseded versions, empty folders and dormant rooms, then cleans up only what you approve.

Everything works from metadata: file and folder names, sizes, dates, collaborators and the workspace Activity Log. **Claude never sees, downloads or decrypts your files or secure messages.** Sending new files and reading contents stay in the SendSafely web portal.

## What's included

### SendSafely connector

The plugin connects to the hosted SendSafely connector at `https://mcp.sendsafely.com/`. You sign in with your SendSafely account (OAuth); no API keys are stored. The connector can list and inspect your packages and workspaces, and manage recipients, roles, files, folders and package settings.

### Skill: Workspace cleanup (`sendsafely-workspace-cleanup`)

Workspaces fill up with files from finished phases, drafts replaced by later versions, and folders nobody uses. The SendSafely web app shows one folder at a time and doesn't tell you when anyone last opened a file. This skill looks across every folder at once and uses the Activity Log to answer that.

- **Finds:** files not downloaded in a set period (180 days by default, or your own cutoff), superseded versions (`v2`, `final`, `copy`), empty folders, and dormant workspaces with no uploads or downloads.
- **Reports:** each candidate with its folder, size, upload date and last download, plus the total space you could reclaim. Empty folders that look like intentional structure (for example `2022/2023/2024`) are flagged as placeholders, not junk.
- **Cleans up:** archives folders, renames files, or deletes files, folders or whole workspaces, but only the exact list you approve.

Try: *"Clean up my SendSafely workspaces"*, *"What in the Northwind data room hasn't been opened since March?"*, *"Find empty folders and dormant workspaces in SendSafely"*

## Safety

- The skill reports first and changes nothing until you approve an exact list in chat.
- It prefers the least destructive option (archive a folder, rename a file) over deleting.
- It only cleans workspaces where you're an Owner or Manager.
- Deletes are permanent. The connector can't back files up, so download anything you need from the portal first.
- "Not downloaded" doesn't mean "not needed": candidates are presented as suggestions, never as junk.

## Requirements

- A SendSafely account with Workspaces. Some tools depend on your plan and permissions; when one isn't available, the skill skips that step and tells you.
- Claude with plugin support (claude.ai, Claude Desktop or Claude Code).

## Support

- Help center: https://support.sendsafely.com/hc/en-us
- Privacy policy: https://explore.sendsafely.com/privacy/
- Terms: https://explore.sendsafely.com/terms/

## License

Apache License 2.0. See [LICENSE](LICENSE).
