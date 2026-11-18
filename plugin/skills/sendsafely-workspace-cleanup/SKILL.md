---
name: sendsafely-workspace-cleanup
description: Find stale files and dead weight in the user's SendSafely Workspaces (virtual data rooms) and clean them up, using the hosted SendSafely connector. Use when the user wants to clean up, tidy, prune, declutter or shrink a workspace or data room; find old, unused, stale, forgotten or never-downloaded files; see what nobody has opened in N months; free up space; remove empty folders; or close out a finished deal, matter, audit or project room, even if they never say "cleanup". Works from metadata only (file names, sizes, dates, the Activity Log); it cannot open, read or back up file contents.
---

# SendSafely workspace cleanup

Workspaces build up clutter: files from a finished phase, drafts superseded by later versions, folders nobody uses, whole workspaces for deals that closed a year ago. Owners rarely clean them up because the SendSafely UI shows one folder at a time and never answers "when did anyone last open this?". The connector can answer that, because every download is in the workspace's Activity Log.

This skill finds stale files and folders, reports them with evidence, and, only after the user approves a specific list, deletes or reorganizes them.

## Ground rules

- **Report first.** Never change anything until the user has seen the report and approved an exact list.
- **Deletes are permanent and there's no backup from here.** This connector can't download files, so it can't save a copy first. Before any delete, tell the user to download anything they may need from the SendSafely portal. Name exactly what will be deleted, get explicit agreement in chat, and only then pass `proceed_without_prompt=true` (when the client can't show the connector's own approval prompt).
- **"Not downloaded" is not "not needed."** People may view files without downloading, or need them for record-keeping. Present stale files as candidates, never as junk.
- **Only clean workspaces the user controls.** Call `verify_credentials` for the user's email, find the recipient entry with that `email`, and act only where its `roleName` is `OWNER` or `MANAGER`. Don't use `isPackageOwner` for this: it marks the workspace's owner, who may be someone else. List other workspaces as "shared with you, not reviewed".
- **File states.** `fileState` is `"HOLD"` on almost every workspace file and `"NULL"` on some. Both are normal, so ignore them. Any other value is unknown: report it, don't delete the file, and tell the user to check it in the portal.
- **Say what you didn't check.** If a listing is `truncated`, you capped the Activity Log, or a tool is missing on this connector, say so at the top of the report.

## Step 1: Agree the scope

Ask only for what's missing:

- **Which workspaces:** a named one, or "all my workspaces".
- **Stale threshold:** default **180 days** without a download. Use the user's number if they give one ("nothing opened this year" = since 1 January).
- **Whose downloads count:** default **anyone's**. If the user says "nobody else has looked at it", ignore the user's own downloads.

## Step 2: Gather

1. `get_workspaces`. Each entry has `packageId`, `packageLabel` (the workspace name), `packageUserName` (owner), `packageStateStr` and `packageUpdateTimestamp`. (The tool's description mentions `label`, `packageOwner` and `state`; those fields aren't in the response, so use the ones listed here.) Show state as "Active" or "Archived" only.
2. For each workspace in scope, `get_package_information`. Check the user's role (see ground rules), and note `totalFiles`, `totalDirectories`, `rootDirectoryId` and the recipients (collaborators with `roleName`: OWNER, MANAGER, CONTRIBUTOR, LIMITED_CONTRIBUTOR, VIEWER, RESTRICTED).
   - **More than ~1,000 files across the scope:** tell the user the size and offer to start with the largest workspaces, or one at a time.
3. **Build the file inventory.** Call `get_directory` on `rootDirectoryId`, then on every entry in `subDirectories` (recursively, using its `directoryId`). Each folder returns `files[]` with `fileId`, `fileName`, `fileSize` (bytes, as a string), `fileUploaded`, `fileVersion`, `createdByEmail`, `fileState`. If a folder has more files than one call returns, call again with `file_index` set to the number already seen until no new files come back (same for `directory_index` and subfolders). Record each file's folder path and `directoryId`. If your count differs slightly from `totalFiles` / `totalDirectories`, say so; those totals can include items that were deleted.
4. **Read the Activity Log back to the cutoff.** Call `get_activity_log` with `row_index` 0, 10, 20, … Entries come newest first, about 10 per page. Stop as soon as an entry's `timestamp` is older than the cutoff date, since nothing older can change the result. Hard cap: 100 pages per workspace. If you hit it before reaching the cutoff, don't report that workspace's files as not downloaded since the cutoff: say the Activity Log was too long to read back to the cutoff and offer a shorter threshold. For each entry keep `action`, `targetId`, `timestamp`, `user.userEmail`.
   - `FILE_DOWNLOADED`: `targetId` is the `fileId`. This is an **access**.
   - `FILE_CREATED`, `FILE_UPDATED` (a new version of an existing file), or a newer `fileVersion`: the file was **updated**.
   - `FILE_RENAMED`, `FILE_STATE`, `FOLDER_MOVED`, `USER_ADDED`, `USER_ROLE_CHANGED`, `VDR_NAME_CHANGED`: housekeeping. Doesn't count as access.
5. For files you're about to recommend deleting, `get_file_information` shows `oldVersions[]`, which includes the current version. Mention when it has more than one entry, since the older versions are removed along with the file.

## Step 3: Classify

A file's **last activity** is the latest of: its `fileUploaded` date and any `FILE_DOWNLOADED` for its `fileId` (filtered by whose downloads count). Then:

| Bucket | Rule |
|---|---|
| **Not downloaded since the cutoff** | Uploaded before the cutoff, no download on record in the window you read. Strongest candidates. |
| **Superseded** | Same folder holds another file whose name matches once you strip version markers (`v2`, `final`, `FINAL-2`, `(1)`, `copy`, dates), and the other one is newer. Recommend keeping the newest one. |
| **Empty folder** | A folder with no files and no subfolders (after the scan). If several empty folders follow a pattern (years like `2022/2023/2024`, numbered sections, `Inbound`/`Outbound`), they're probably intentional structure waiting for files. List them separately as "likely placeholders" and don't recommend deleting them. |
| **Dormant workspace** | No `FILE_DOWNLOADED`, `FILE_CREATED` or `FILE_UPDATED` since the cutoff, and no file uploaded since the cutoff. Housekeeping (renames, moves, role changes) doesn't count. Recommend closing the whole workspace rather than pruning it. An empty workspace (0 files) that's dormant is the easiest win. |
| **Unknown state** | `fileState` is something other than `"HOLD"` or `"NULL"`. Report only. |

Because the log is read only back to the cutoff, a file may have been downloaded before it. Word it as "not downloaded since <cutoff>", never as "never downloaded".

## Step 4: Report

Start with 2–3 sentences: how many workspaces and files you checked, how many candidates in each bucket, and total size you could reclaim (sum `fileSize`, show as MB/GB). Then:

1. **Per workspace:** a table of candidates, biggest first.

   | File | Folder | Size | Uploaded | Last download | Bucket |
   |---|---|---|---|---|---|
   | `Q2 forecast v3.xlsx` | /Finance | 4.2 MB | 12 Jan 2025 | None since 1 March | Not downloaded since the cutoff |

2. **Empty folders** and **dormant workspaces**, as short lists.
3. **Files in an unknown state**, with their `fileState` (usually none).
4. **Collaborators on dormant workspaces.** If a dormant workspace still has external collaborators (`isGuest: true`), say so: closing it also ends their access.

Close with a proposed change list grouped by action and ask which groups to apply.

## Step 5: Clean up (only what was approved)

| Action | Tool | Notes |
|---|---|---|
| Delete a file | `delete_file` with `package_id`, `file_id`, and `directory_id` for files inside a folder | Permanent. Includes old versions. |
| Delete an empty folder | `delete_directory` | Re-list the folder first; if anything appeared in it since the scan, skip it and say so. |
| Delete a folder with contents | `delete_directory` | Permanent, removes everything inside. Only when the user approves that specific folder and its contents list. |
| Archive a folder instead of deleting | `create_directory` (e.g. `_Archive`) then `move_directory` | Folders only; there's no tool to move single files. Offer this when the user is unsure. |
| Mark a file without deleting | `update_file` to rename it (e.g. prefix `ARCHIVE - `) | For "flag it, don't delete it yet". |
| Close a dormant workspace | `delete_package` | Permanent and ends every collaborator's access. Only on an explicit request for that workspace. |

Order: archive/rename first, then file deletes, then folder deletes (so emptied folders can go last), then workspace deletes. Apply in batches of up to 20 with a progress line between batches. Stop on the first unexpected error and report it instead of repeating it. Only offer actions whose tool exists on this connector.

Finish with an **after report**: counts per action, space reclaimed, anything skipped or failed and why, and a re-listing (`get_directory`) of each folder you changed to confirm the result.

## Example

User: "Clean up the Northwind diligence room, nothing's been touched since spring."

1. Scope: workspace "Northwind diligence", cutoff 1 March, anyone's downloads count.
2. 214 files in 18 folders; Activity Log read back to 1 March (31 pages).
3. Report: "171 of 214 files (2.3 GB) haven't been downloaded since 1 March. 4 folders are empty; 3 of them (`2022`, `2023`, `2024`) look like placeholders. lee@example.com still has Contributor access."
4. User: "Archive /Phase 1, delete the empty folders, leave the rest." Create `_Archive`, move `/Phase 1` into it, delete 4 empty folders, re-list, report.
