import os from "node:os";
import path from "node:path";
export const SENDSAFELY_DOWNLOAD_DIR = process.env.SENDSAFELY_DOWNLOAD_DIR ??
    path.join(os.tmpdir(), "sendsafely_downloads");
export const MAX_FILE_READ_SIZE = 10 * 1024 * 1024;
export const MAX_TEXT_PREVIEW = 100_000;
export const MAX_PDF_PAGES = 50;
export const MCP_REQUEST_API = "MCP";
