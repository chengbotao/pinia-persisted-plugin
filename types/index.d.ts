import { PiniaPluginContext } from 'pinia';

declare module "pinia" {
    interface DefineStoreOptionsBase<S, Store> {
        persisted?: boolean | Options;
    }
}
interface Path {
    paths: string[];
    storage?: Storage;
    storageKey?: string | ((id: string) => string);
    getState?: (storage: Storage, key: string) => Record<string, unknown>;
    setState?: (storage: Storage, key: string, value: unknown) => void;
    removeState?: (storage: Storage, key: string) => void;
}
interface Options {
    paths?: (string | Path)[];
    storage?: Storage;
    storageKey?: string | ((id: string) => string);
    getState?: (storage: Storage, key: string) => Record<string, unknown>;
    setState?: (storage: Storage, key: string, value: unknown) => void;
    removeState?: (storage: Storage, key: string) => void;
}
declare function persistedPlugin(factoryOptions?: Options): (context: PiniaPluginContext) => void;

export { persistedPlugin };
