export declare function assertSafePackageId(packageId: string): string;
export declare function preparePackageDir(root: string, packageId: string): Promise<string>;
export interface OwnershipStats {
    uid: number;
    mode: number;
}
export declare function isTrustedRoot(stats: OwnershipStats, uid: number): boolean;
export declare function isPrivateToUser(stats: OwnershipStats, uid: number): boolean;
