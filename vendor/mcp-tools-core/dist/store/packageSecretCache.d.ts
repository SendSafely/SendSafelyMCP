import type { ToolExtra } from "../context.js";
export interface PackageSecrets {
    keyCode: string;
    serverSecret: string;
    packageCode?: string;
}
export interface PackageSecretCache {
    set(packageId: string, secrets: PackageSecrets): void;
    get(packageId: string): PackageSecrets | undefined;
    delete(packageId: string): void;
    clear(): void;
}
export declare function createPackageSecretCache(): PackageSecretCache;
export type CacheFor = (extra: ToolExtra) => PackageSecretCache;
export declare class MissingPackageSecretsError extends Error {
    constructor(packageId: string);
}
export declare function stripPackageSecrets<T extends object>(info: T): Omit<T, "keyCode" | "serverSecret">;
