export function jsonResult(payload) {
    return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
        structuredContent: payload,
        isError: false,
    };
}
export function jsonError(message, extra) {
    const payload = { status: "error", message, ...extra };
    return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
        structuredContent: payload,
        isError: true,
    };
}
