export const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f\x7f]/g;
export function sanitizeFilename(name) {
    return name.replace(UNSAFE_FILENAME_CHARS, "_");
}
export const PROMPT_UNSAFE_CHARS = /[\x00-\x1f\x7f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
export function sanitizeForPrompt(text) {
    return text.replace(/[\r\n\t]+/g, " ").replace(PROMPT_UNSAFE_CHARS, "");
}
