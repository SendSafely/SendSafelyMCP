export declare const SERVICE_NAME = "SendSafelyMCP";
export type CredentialName = "url" | "api_key" | "api_secret";
export declare function keyringAvailable(): boolean;
export declare function getCredential(name: CredentialName): string;
export declare function storeCredential(name: CredentialName, value: string): void;
export declare function deleteCredential(name: CredentialName): void;
export declare function credentialSource(name: CredentialName): "keychain" | "environment" | "not found";
