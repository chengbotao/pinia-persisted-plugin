/*
 * @Author: Chengbotao
 * @Contact: https://github.com/chengbotao
 */
import type { PiniaPluginContext, StateTree, SubscriptionCallbackMutation } from "pinia";
import {
	deepClone,
	deepMerge,
	isEmpty,
	isPlainObject,
	reducerState,
} from "./utils";

const DEFAULT_STORAGE = localStorage;
const DEFAULT_STORAGE_KEY = "__PINIA_PERSIST_PLUGIN__";

declare module "pinia" {
	export interface PiniaCustomProperties {
		$hydrate: (payload?: string[])=> void
	}
	export interface DefineStoreOptionsBase<S, Store> {
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
export function persistedPlugin(factoryOptions: Options = {}) {
	const {
		storage = DEFAULT_STORAGE,
		storageKey = (storeKey) => `${DEFAULT_STORAGE_KEY}${storeKey}`,
		getState = (storage, key) => {
			return storage.getItem(key) && JSON.parse(storage.getItem(key)!);
		},
		setState = (storage, key, value) => {
			storage.setItem(key, JSON.stringify(value));
		},
		removeState = (storage, key) => {
			storage.removeItem(key);
		},
	} = factoryOptions;

	return (context: PiniaPluginContext) => {
		const {
			store,
			options: { persisted = false },
		} = context;
		// 如果是 false 则不需要持久化
		if (!persisted) return;

		// 持久化
		let initState = deepClone(store.$state);
		let {
			paths,
			setState: storeSetState = setState,
			getState: storeGetState = getState,
			removeState: storeRemoveState = removeState,
			storage: storeStorage = storage,
			storageKey: storeStorageKey = typeof storageKey === "string"
				? storageKey
				: storageKey(store.$id),
		} = persisted as Options;

		paths = Array.isArray(paths) ? paths : Object.keys(initState);

		let unifyPaths: Required<Path>[] = [];
		let unifyStringPath: Required<Path> = {
			storage: storeStorage,
			storageKey: storeStorageKey,
			getState: storeGetState,
			setState: storeSetState,
			removeState: storeRemoveState,
			paths: [],
		};
		paths.forEach((path) => {
			if (typeof path === "string") {
				unifyStringPath.paths.push(path);
			} else if (isPlainObject(path)) {
				unifyPaths.push(
					Object.assign(
						{},
						{
							storage: storeStorage,
							storageKey: storeStorageKey,
							getState: storeGetState,
							setState: storeSetState,
							removeState: storeRemoveState,
						},
						path
					)
				);
			}
		});
		unifyPaths.push(unifyStringPath);

		let saveState = unifyPaths.reduce((acc, cur) => {
			const { storage, storageKey, getState } = cur;
			return deepMerge(
				acc,
				getState(
					storage,
					typeof storageKey === "string" ? storageKey : storageKey(store.$id)!
				)
			);
		}, {});

		if (!isEmpty(saveState)) {
			store.$patch(saveState);
		}

		store.$hydrate= (payload?: string[])=>{
			const mutationState = deepClone(store.$state);
			if (!payload) {
				unifyPaths.forEach((path) => {
					const { storage, storageKey, removeState } = path;
					removeState(storage, typeof storageKey === "string" ? storageKey : storageKey(store.$id));
				});
				store.$patch(deepMerge(store.$state, initState) as Record<string, any>);
			} else {
				const mutationMergeState = deepMerge(
					mutationState,
					reducerState(initState as Record<string, unknown>, payload)
				);
				unifyPaths.forEach((path) => {
					const { storage, storageKey, getState, setState, paths } = path;
					let savedKey = getState(storage, typeof storageKey === "string" ? storageKey : storageKey(store.$id));
					setState(
						storage,
						typeof storageKey === "string" ? storageKey : storageKey(store.$id),
						deepMerge(
							savedKey,
							reducerState(
								mutationMergeState as Record<string, unknown>,
								paths
							)
						)
					);
				});
				store.$patch(deepMerge(store.$state, mutationMergeState) as Record<string, any>);
			}
		}

		store.$subscribe(
			(mutation: SubscriptionCallbackMutation<StateTree>, state: StateTree) => {
				unifyPaths.forEach((path) => {
					const { storage, storageKey, getState, setState, paths } = path;
					let savedKey = getState(
						storage,
						typeof storageKey === "string" ? storageKey : storageKey(store.$id)
					);
					setState(
						storage,
						typeof storageKey === "string" ? storageKey : storageKey(store.$id),
						deepMerge(
							savedKey,
							reducerState(state as Record<string, unknown>, paths)
						)
					);
				});
			},
			{ detached: true }
		);
	};
}
