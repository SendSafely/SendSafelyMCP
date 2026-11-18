export interface KeyStore {
    set(id: string, secret: string): Promise<void>;
    get(id: string): Promise<string | undefined>;
    delete(id: string): Promise<void>;
}
export declare const ACTIVE_KEY_ID = "_active";
