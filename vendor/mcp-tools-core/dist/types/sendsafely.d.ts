declare module "@sendsafely/sendsafely" {
  export interface PackageFile {
    fileId: string;
    fileName: string;
    fileSize: number;
    fileParts?: number;
    parts?: number;
  }
  export interface PackageInfo {
    packageId: string;
    keyCode: string;
    packageCode?: string;
    serverSecret: string;
    packageSender?: string;
    sender?: string;
    subject?: string;
    created?: string;
    expiration?: string;
    files: PackageFile[];
    state?: string;
    recipients?: unknown[];
    response?: string;
    rootDirectoryId?: string;
    packageType?: string;
    isVDR?: boolean;
    packageContainsMessage?: boolean;
  }
  export interface ReceivedPackageSummary {
    packageId: string;
    packageCode?: string;
    sender?: string;
    subject?: string;
    created?: string;
    files?: unknown[];
    state?: string;
    [key: string]: unknown;
  }
  export interface ReceivedPackagesResult {
    packages: ReceivedPackageSummary[];
    totalPackages?: number;
    response?: string;
  }
  export interface SentPackagesResult {
    packages?: unknown[];
    totalPackages?: number;
    response?: string;
    [key: string]: unknown;
  }
  export interface ActivityLogResult {
    activityLogEntries?: unknown[];
    response?: string;
    [key: string]: unknown;
  }
  export interface UserInfo {
    email: string;
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  }
  export interface EnterpriseInfo {
    host: string;
    systemName: string;
    allowUndisclosedRecipients: boolean;
    headerColor?: string;
    linkColor?: string;
    messageEncryption?: string;
  }
  export interface Recipient {
    recipientId: string;
    email?: string;
    [key: string]: unknown;
  }
  export interface RecipientsResult {
    recipients?: Recipient[];
    response?: string;
    [key: string]: unknown;
  }
  export interface UploadedPublicKey {
    id: string;
    description: string;
    dateStr: string;
    key: string;
    visible: boolean;
  }
  export interface FileInfo {
    fileId?: string;
    fileName?: string;
    fileSize?: number;
    response?: string;
    [key: string]: unknown;
  }
  export interface DirectoryListing {
    directoryId?: string;
    directoryName?: string;
    files?: PackageFile[];
    subdirectories?: unknown[];
    response?: string;
    [key: string]: unknown;
  }
  export interface CreatePackageResult {
    packageId: string;
    serverSecret: string;
    packageCode: string;
    keyCode: string;
  }
  export interface FinalizeResult {
    bare_url: string;
    recipients: unknown;
    approvers: unknown;
    needs_link: boolean;
    secure_link?: string;
  }
  export interface DownloadConfig {
    path?: string;
    fileName?: string;
  }
  export interface FileSavedEvent {
    fileId: string;
    config?: DownloadConfig;
  }
  export interface SaveFileEvent {
    fileId: string;
    file: Buffer;
  }
  export interface DownloadProgressEvent {
    fileId: string;
    percent?: number;
    [key: string]: unknown;
  }
  export interface FileUploadedEvent {
    fileId: string;
    packageId: string;
    keyCode?: string;
    fileSize?: number;
    fileName?: string;
  }
  export interface SendSafelyEndpoint {
    url: string;
    HTTPMethod: "GET" | "POST" | "PUT" | "DELETE";
    mimetype: string;
  }
  export interface SendSafelyAjaxPromise {
    done(callback: (data: unknown) => void): SendSafelyAjaxPromise;
    fail(
      callback: (xhr: unknown, status: string, error: { message?: string }) => void,
    ): SendSafelyAjaxPromise;
  }
  export interface SendSafelyRequest {
    sendRequest(
      endpoint: SendSafelyEndpoint,
      messageData: unknown,
      async: boolean,
    ): SendSafelyAjaxPromise;
    processAjaxData(
      ajax: SendSafelyAjaxPromise,
      successCallback: (data: Record<string, unknown>) => void,
    ): void;
  }
  export interface SendSafelyFetchRequest {
    sendSignedRequest(endpoint: SendSafelyEndpoint, data: unknown): Promise<Response>;
  }
  export interface WorkspacesResult {
    packages?: unknown[];
    totalPackages?: number;
    response?: string;
    [key: string]: unknown;
  }
  export default class SendSafely {
    constructor(url: string, apiKeyId: string, apiKeySecret: string, requestAPI?: string);
    static setClientVersion(version: string | null): void;
    static withBearerToken(
      url: string,
      token: string,
      requestAPI?: string,
    ): SendSafely;
    setAccessToken(token: string): void;
    readonly url: string;
    readonly request: SendSafelyRequest;
    readonly wrapperRequest: SendSafelyFetchRequest;
    notifyRecipients?: boolean;
    verifyCredentials(finished: (email: string) => void): void;
    getUserInformation(finished: (userInfo: UserInfo) => void, customErrorEvent?: string): void;
    enterpriseInfo(
      finished: (
        host: string,
        systemName: string,
        allowUndisclosedRecipients: boolean,
        headerColor?: string,
        linkColor?: string,
        messageEncryption?: string,
      ) => void,
    ): void;
    getReceivedPackages(rowIndex: number, finished: (result: ReceivedPackagesResult) => void): void;
    getActivePackages(rowIndex: number, finished: (result: SentPackagesResult) => void): void;
    getArchivedPackages(rowIndex: number, finished: (result: SentPackagesResult) => void): void;
    packageInformation(packageId: string, finished: (info: PackageInfo) => void): void;
    packageInformationFromLink(link: string, finished: (info: PackageInfo) => void): void;
    getPackageMessage(
      packageId: string,
      packageCode: string,
      keyCode: string,
      finished: (message: unknown) => void,
    ): void;
    decryptMessage(
      packageId: string,
      keyCode: string,
      serverSecret: string,
      ciphertext: string,
      finished: (decryptedMessage: string) => void,
    ): void;
    getActivityLog(
      packageId: string,
      rowIndex: number,
      finished: (log: ActivityLogResult) => void,
    ): void;
    getFileInformation(
      packageId: string,
      directoryId: string | undefined,
      fileId: string,
      finished: (info: FileInfo) => void,
    ): void;
    downloadFile(packageId: string, fileId: string, keyCode: string, config?: DownloadConfig): void;
    downloadFileFromDirectory(
      packageId: string,
      directoryId: string,
      fileId: string,
      keyCode: string,
      config?: DownloadConfig,
    ): void;
    createPackage(
      finished: (
        packageId: string,
        serverSecret: string,
        packageCode: string,
        keyCode: string,
      ) => void,
    ): void;
    createWorkspace(
      finished: (
        packageId: string,
        serverSecret: string,
        packageCode: string,
        keyCode: string,
      ) => void,
    ): void;
    encryptAndUploadFiles(
      packageId: string,
      keyCode: string,
      serverSecret: string,
      files: string[],
      uploadType: string,
      finished: (
        packageId: string,
        fileId: string,
        fileSize: number,
        fileName: string,
      ) => void,
    ): void;
    encryptAndUploadFilesToDirectory(
      packageId: string,
      keyCode: string,
      serverSecret: string,
      files: string[],
      uploadType: string,
      directoryId: string,
      finished: (
        packageId: string,
        fileId: string,
        fileSize: number,
        fileName: string,
      ) => void,
    ): void;
    encryptAndUploadMessage(
      packageId: string,
      keyCode: string,
      serverSecret: string,
      message: string,
      finished: (result: unknown) => void,
    ): void;
    finalizePackage(
      packageId: string,
      packageCode: string,
      keyCode: string,
      finished: (
        url: string,
        recipients: unknown,
        approvers: unknown,
        message: string,
        needsLink: boolean,
      ) => void,
    ): void;
    finalizeUndisclosedPackage(
      packageId: string,
      packageCode: string,
      keyCode: string,
      password: string,
      finished: (
        url: string,
        recipients: unknown,
        approvers: unknown,
        message: string,
        needsLink: boolean,
      ) => void,
    ): void;
    addRecipient(
      packageId: string,
      email: string,
      keyCode: string,
      finished: (recipient: Recipient) => void,
    ): void;
    addRecipients(
      packageId: string,
      emails: string[],
      keyCode: string,
      finished: (result: RecipientsResult) => void,
      customEvent?: string,
    ): void;
    addRecipientWithSMS(
      packageId: string,
      email: string,
      keyCode: string,
      phonenumber: string,
      countryCode: string,
      finished: (recipient: Recipient) => void,
    ): void;
    addRecipientPhonenumber(
      packageId: string,
      recipientId: string,
      phonenumber: string,
      countryCode: string,
      finished: (result: unknown) => void,
    ): void;
    updateRecipientRole(
      packageId: string,
      recipientId: string,
      roleName: string,
      finished: (result: unknown) => void,
    ): void;
    removeRecipient(
      packageId: string,
      recipientId: string,
      finished: (result: unknown) => void,
    ): void;
    getRecipient(
      packageId: string,
      recipientId: string,
      finished: (recipient: Recipient) => void,
    ): void;
    generateRsaKeyPair(
      description: string,
      callback: (privateKey: string, publicKey: UploadedPublicKey) => void,
    ): void;
    getKeycode(
      privateKey: string,
      publicKeyId: string,
      packageId: string,
      callback: (keycode: string) => void,
    ): void;
    deletePackage(packageId: string, finished: (result: unknown) => void): void;
    updatePackage(
      packageId: string,
      data: Record<string, unknown>,
      finished: (info: PackageInfo) => void,
    ): void;
    deleteFile(packageId: string, fileId: string, finished: (result: unknown) => void): void;
    deleteFileWithDirectory(
      packageId: string,
      fileId: string,
      directoryId: string,
      finished: (result: unknown) => void,
    ): void;
    updateFile(
      packageId: string,
      fileId: string,
      fileName: string,
      finished: (result: unknown) => void,
    ): void;
    createDirectory(
      packageId: string,
      directoryName: string,
      finished: (result: unknown) => void,
    ): void;
    createSubdirectory(
      packageId: string,
      directoryName: string,
      directoryId: string,
      finished: (result: unknown) => void,
    ): void;
    getDirectory(
      packageId: string,
      directoryId: string,
      directoryIndex: number,
      fileIndex: number,
      sortField: string,
      sortOrder: string,
      finished: (result: DirectoryListing) => void,
    ): void;
    renameDirectory(
      packageId: string,
      directoryId: string,
      directoryName: string,
      finished: (result: unknown) => void,
    ): void;
    updateDirectory(
      packageId: string,
      sourceDirectoryId: string,
      targetDirectoryId: string,
      finished: (result: unknown) => void,
    ): void;
    deleteDirectory(
      packageId: string,
      directoryId: string,
      finished: (result: unknown) => void,
    ): void;
    on(event: "file.saved", listener: (evt: FileSavedEvent) => void): number;
    on(event: "save.file", listener: (evt: SaveFileEvent) => void): number;
    on(event: "download.progress", listener: (evt: DownloadProgressEvent) => void): number;
    on(event: "sendsafely.files.uploaded", listener: (evt: FileUploadedEvent) => void): number;
    on(event: "sendsafely.error", listener: (code: string | number, message: string) => void): number;
    on(
      event: "finalization.error",
      listener: (data: { response?: string; message?: string; [key: string]: unknown }) => void,
    ): number;
    on(
      event: "keycode.get.failed",
      listener: (code: string | number, message: string) => void,
    ): number;
    on(event: string, listener: (...args: unknown[]) => void): number;
    unbind(event: string, id?: number): void;
    isBound(event: string): boolean;
  }
}
