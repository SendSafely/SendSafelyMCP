import { SendSafelyApiError } from "./oauthError.js";
import { signedRequest } from "./signedFetch.js";
function toErrorMessage(code, message) {
    if (message && message.length > 0)
        return message;
    if (code !== undefined && code !== null && code !== "") {
        return `SendSafely error ${code}`;
    }
    return "Unknown SendSafely error";
}
function toSdkError(code, message) {
    const rawCode = code === undefined || code === null ? "" : String(code);
    return new SendSafelyApiError(toErrorMessage(code, message), rawCode);
}
function withErrorListener(ss, invoke) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const errorId = ss.on("sendsafely.error", (code, message) => {
            if (settled)
                return;
            settled = true;
            ss.unbind("sendsafely.error", errorId);
            reject(toSdkError(code, message));
        });
        try {
            invoke((value) => {
                if (settled)
                    return;
                settled = true;
                ss.unbind("sendsafely.error", errorId);
                resolve(value);
            });
        }
        catch (err) {
            if (settled)
                return;
            settled = true;
            ss.unbind("sendsafely.error", errorId);
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}
export function verifyCredentials(ss) {
    return withErrorListener(ss, (resolve) => {
        ss.verifyCredentials(resolve);
    });
}
export function getUserInformation(ss) {
    return withErrorListener(ss, (resolve) => {
        ss.getUserInformation(resolve);
    });
}
export function enterpriseInfo(ss) {
    return withErrorListener(ss, (resolve) => {
        ss.enterpriseInfo((host, systemName, allowUndisclosedRecipients, headerColor, linkColor, messageEncryption) => {
            const result = {
                host,
                systemName,
                allowUndisclosedRecipients,
                ...(headerColor !== undefined ? { headerColor } : {}),
                ...(linkColor !== undefined ? { linkColor } : {}),
                ...(messageEncryption !== undefined ? { messageEncryption } : {}),
            };
            resolve(result);
        });
    });
}
export function getReceivedPackagesPage(ss, rowIndex) {
    return withErrorListener(ss, (resolve) => {
        ss.getReceivedPackages(rowIndex, resolve);
    });
}
export function getActivePackagesPage(ss, rowIndex) {
    return withErrorListener(ss, (resolve) => {
        ss.getActivePackages(rowIndex, resolve);
    });
}
export function getArchivedPackagesPage(ss, rowIndex) {
    return withErrorListener(ss, (resolve) => {
        ss.getArchivedPackages(rowIndex, resolve);
    });
}
export function getWorkspacesPage(ss, rowIndex) {
    const query = rowIndex > 0 ? `?rowIndex=${encodeURIComponent(String(rowIndex))}` : "";
    return signedRequest(ss, `/package/workspaces/${query}`, "GET");
}
function fetchPackageInfoRaw(ss, packageIdOrCode) {
    return withErrorListener(ss, (resolve) => {
        const endpoint = {
            url: `/package/${encodeURIComponent(packageIdOrCode)}/`,
            HTTPMethod: "GET",
            mimetype: "application/json",
        };
        const ajax = ss.request.sendRequest(endpoint, null, true);
        ss.request.processAjaxData(ajax, (data) => {
            resolve(data);
        });
    });
}
function parseSecureLink(link) {
    const url = (() => {
        try {
            return new URL(link);
        }
        catch {
            return null;
        }
    })();
    const packageCode = url?.searchParams.get("packageCode") ?? "";
    const fragment = (link.split("#")[1] ?? "");
    const params = new URLSearchParams(fragment);
    const keyCode = params.get("keyCode") ?? params.get("keycode") ?? "";
    return { packageCode, keyCode };
}
export function packageInformation(ss, packageId) {
    return fetchPackageInfoRaw(ss, packageId);
}
export async function packageInformationFromLink(ss, link) {
    const { packageCode, keyCode } = parseSecureLink(link);
    if (!packageCode) {
        throw new Error("Invalid SendSafely link: missing packageCode parameter.");
    }
    const info = await fetchPackageInfoRaw(ss, packageCode);
    return { ...info, keyCode };
}
export function getPackageMessage(ss, packageId, packageCode, keyCode) {
    return withErrorListener(ss, (resolve) => {
        ss.getPackageMessage(packageId, packageCode, keyCode, resolve);
    });
}
export function decryptMessage(ss, packageId, keyCode, serverSecret, ciphertext) {
    return withErrorListener(ss, (resolve) => {
        ss.decryptMessage(packageId, keyCode, serverSecret, ciphertext, resolve);
    });
}
export async function getDecryptedPackageMessage(ss, packageId, packageCode, keyCode, serverSecret) {
    const fetched = (await getPackageMessage(ss, packageId, packageCode, keyCode));
    const ciphertext = fetched?.message;
    if (!ciphertext)
        return null;
    return decryptMessage(ss, packageId, keyCode, serverSecret, ciphertext);
}
export function getActivityLog(ss, packageId, rowIndex) {
    return withErrorListener(ss, (resolve) => {
        ss.getActivityLog(packageId, rowIndex, resolve);
    });
}
export function getFileInformation(ss, packageId, directoryId, fileId) {
    return withErrorListener(ss, (resolve) => {
        ss.getFileInformation(packageId, directoryId, fileId, resolve);
    });
}
export function downloadFileToPath(ss, packageId, fileId, keyCode, config) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            ss.unbind("file.saved", savedId);
            ss.unbind("sendsafely.error", errorId);
        };
        const savedId = ss.on("file.saved", (evt) => {
            if (settled)
                return;
            if (evt?.fileId !== fileId)
                return;
            settled = true;
            cleanup();
            resolve();
        });
        const errorId = ss.on("sendsafely.error", (code, message) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(toSdkError(code, message));
        });
        try {
            ss.downloadFile(packageId, fileId, keyCode, config);
        }
        catch (err) {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}
export function downloadFileFromDirectoryToPath(ss, packageId, directoryId, fileId, keyCode, config) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            ss.unbind("file.saved", savedId);
            ss.unbind("sendsafely.error", errorId);
        };
        const savedId = ss.on("file.saved", (evt) => {
            if (settled)
                return;
            if (evt?.fileId !== fileId)
                return;
            settled = true;
            cleanup();
            resolve();
        });
        const errorId = ss.on("sendsafely.error", (code, message) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(toSdkError(code, message));
        });
        try {
            ss.downloadFileFromDirectory(packageId, directoryId, fileId, keyCode, config);
        }
        catch (err) {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}
export function createPackage(ss) {
    return withErrorListener(ss, (resolve) => {
        ss.createPackage((packageId, serverSecret, packageCode, keyCode) => {
            resolve({ packageId, serverSecret, packageCode, keyCode });
        });
    });
}
export function createWorkspace(ss) {
    return withErrorListener(ss, (resolve) => {
        ss.createWorkspace((packageId, serverSecret, packageCode, keyCode) => {
            resolve({ packageId, serverSecret, packageCode, keyCode });
        });
    });
}
export function encryptAndUploadFile(ss, packageId, keyCode, serverSecret, filePath, directoryId) {
    return withErrorListener(ss, (resolve) => {
        const callback = (pkgId, fileId, fileSize, fileName) => {
            resolve({ packageId: pkgId, fileId, fileSize, fileName });
        };
        if (directoryId && directoryId.length > 0) {
            ss.encryptAndUploadFilesToDirectory(packageId, keyCode, serverSecret, [filePath], "NODE_API", directoryId, callback);
        }
        else {
            ss.encryptAndUploadFiles(packageId, keyCode, serverSecret, [filePath], "NODE_API", callback);
        }
    });
}
export function encryptAndUploadMessage(ss, packageId, keyCode, serverSecret, message) {
    return withErrorListener(ss, (resolve) => {
        ss.encryptAndUploadMessage(packageId, keyCode, serverSecret, message, resolve);
    });
}
function withFinalizeListeners(ss, invoke) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            ss.unbind("sendsafely.error", errorId);
            ss.unbind("finalization.error", finalizeErrorId);
        };
        const errorId = ss.on("sendsafely.error", (code, message) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(toSdkError(code, message));
        });
        const finalizeErrorId = ss.on("finalization.error", (data) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            const code = String(data?.response ?? "FINALIZE_ERROR");
            const safeMessage = String(data?.message ?? "").split("#")[0] ?? "";
            const text = safeMessage.length > 0 ? `${code}: ${safeMessage}` : code;
            reject(new Error(text));
        });
        try {
            invoke((value) => {
                if (settled)
                    return;
                settled = true;
                cleanup();
                resolve(value);
            }, (err) => {
                if (settled)
                    return;
                settled = true;
                cleanup();
                reject(err);
            });
        }
        catch (err) {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}
export function finalizePackage(ss, packageId, packageCode, keyCode) {
    ss.notifyRecipients = false;
    return withFinalizeListeners(ss, (resolve) => {
        ss.finalizePackage(packageId, packageCode, keyCode, (url, recipients, approvers, message, needsLink) => {
            resolve({
                bare_url: message,
                recipients,
                approvers,
                needs_link: needsLink,
                secure_link: url,
            });
        });
    });
}
export async function notifyPackageRecipients(ss, packageId, keyCode) {
    await signedRequest(ss, `/package/${encodeURIComponent(packageId)}/notify/`, "POST", { keycode: keyCode });
}
export function finalizeUndisclosedPackage(ss, packageId, packageCode, keyCode, password) {
    return withFinalizeListeners(ss, (resolve) => {
        ss.finalizeUndisclosedPackage(packageId, packageCode, keyCode, password, (_url, recipients, approvers, message, needsLink) => {
            resolve({ bare_url: message, recipients, approvers, needs_link: needsLink });
        });
    });
}
export function addRecipient(ss, packageId, email, keyCode) {
    return withErrorListener(ss, (resolve) => {
        ss.addRecipient(packageId, email, keyCode, resolve);
    });
}
export function addRecipients(ss, packageId, emails, keyCode) {
    return withErrorListener(ss, (resolve) => {
        ss.addRecipients(packageId, emails, keyCode, resolve);
    });
}
export function addRecipientWithSMS(ss, packageId, email, keyCode, phonenumber, countryCode) {
    return withErrorListener(ss, (resolve) => {
        ss.addRecipientWithSMS(packageId, email, keyCode, phonenumber, countryCode, resolve);
    });
}
export function addRecipientPhonenumber(ss, packageId, recipientId, phonenumber, countryCode) {
    return withErrorListener(ss, (resolve) => {
        ss.addRecipientPhonenumber(packageId, recipientId, phonenumber, countryCode, resolve);
    });
}
export function updateRecipientRole(ss, packageId, recipientId, roleName) {
    return withErrorListener(ss, (resolve) => {
        ss.updateRecipientRole(packageId, recipientId, roleName, resolve);
    });
}
export function removeRecipient(ss, packageId, recipientId) {
    return withErrorListener(ss, (resolve) => {
        ss.removeRecipient(packageId, recipientId, resolve);
    });
}
export function getRecipient(ss, packageId, recipientId) {
    return withErrorListener(ss, (resolve) => {
        ss.getRecipient(packageId, recipientId, resolve);
    });
}
export function generateRsaKeyPair(ss, description) {
    return withErrorListener(ss, (resolve) => {
        ss.generateRsaKeyPair(description, (privateKey, publicKey) => {
            resolve({ privateKey, publicKey });
        });
    });
}
export function getKeycode(ss, privateKey, publicKeyId, packageId) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            ss.unbind("sendsafely.error", errorId);
            ss.unbind("keycode.get.failed", failedId);
        };
        const errorId = ss.on("sendsafely.error", (code, message) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(toSdkError(code, message));
        });
        const failedId = ss.on("keycode.get.failed", (code, message) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(toSdkError(code, message));
        });
        try {
            ss.getKeycode(privateKey, publicKeyId, packageId, (keycode) => {
                if (settled)
                    return;
                settled = true;
                cleanup();
                resolve(keycode);
            });
        }
        catch (err) {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}
export function deletePackage(ss, packageId) {
    return withErrorListener(ss, (resolve) => {
        ss.deletePackage(packageId, resolve);
    });
}
export function updatePackage(ss, packageId, data) {
    return withErrorListener(ss, (resolve) => {
        ss.updatePackage(packageId, data, resolve);
    });
}
export function deleteFile(ss, packageId, fileId, directoryId) {
    return withErrorListener(ss, (resolve) => {
        if (directoryId && directoryId.length > 0) {
            ss.deleteFileWithDirectory(packageId, fileId, directoryId, resolve);
        }
        else {
            ss.deleteFile(packageId, fileId, resolve);
        }
    });
}
export function updateFile(ss, packageId, fileId, fileName) {
    return withErrorListener(ss, (resolve) => {
        ss.updateFile(packageId, fileId, fileName, resolve);
    });
}
export function createDirectory(ss, packageId, directoryName, parentDirectoryId) {
    return withErrorListener(ss, (resolve) => {
        if (parentDirectoryId && parentDirectoryId.length > 0) {
            ss.createSubdirectory(packageId, directoryName, parentDirectoryId, resolve);
        }
        else {
            ss.createDirectory(packageId, directoryName, resolve);
        }
    });
}
export function getDirectory(ss, packageId, directoryId, directoryIndex, fileIndex, sortField, sortOrder) {
    return withErrorListener(ss, (resolve) => {
        ss.getDirectory(packageId, directoryId, directoryIndex, fileIndex, sortField, sortOrder, resolve);
    });
}
export function renameDirectory(ss, packageId, directoryId, directoryName) {
    return withErrorListener(ss, (resolve) => {
        ss.renameDirectory(packageId, directoryId, directoryName, resolve);
    });
}
export function moveDirectory(ss, packageId, sourceDirectoryId, targetDirectoryId) {
    return withErrorListener(ss, (resolve) => {
        ss.updateDirectory(packageId, sourceDirectoryId, targetDirectoryId, resolve);
    });
}
export function deleteDirectory(ss, packageId, directoryId) {
    return withErrorListener(ss, (resolve) => {
        ss.deleteDirectory(packageId, directoryId, resolve);
    });
}
