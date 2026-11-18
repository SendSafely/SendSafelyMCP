export function buildKeyedLink(client, packageCode, keyCode) {
    const base = client.url.replace(/\/+$/, "");
    return `${base}/receive/?packageCode=${packageCode}#keyCode=${keyCode}`;
}
