/*
 * @Author: Chengbotao
 * @Contact: https://github.com/chengbotao
 */
import { createApp, nextTick } from "vue";
import { createPinia, defineStore, setActivePinia } from "pinia";
import { persistedPlugin } from "../src/index";
import { localStore, sessionStore } from "@manzhixing/web-storage-adapter";

const key = "TEST";

describe("persistedPlugin", () => {
	it("持久化数据基础使用", async () => {
		const app = createApp({});
		const pinia = createPinia();
		pinia.use(persistedPlugin());
		app.use(pinia);
		setActivePinia(pinia);
		const useStore = defineStore(key, {
			state: () => ({ count: 0 }),
			persisted: true,
		});
		const store = useStore();
		store.count++;
		await nextTick();
		expect(store.count).toBe(1);
		expect(
			JSON.parse(localStorage.getItem("__PINIA_PERSIST_PLUGIN__TEST")!).count
		).toBe(1);
	});
	it("重新实例化 Store，验证持久化数据", async () => {
		const app = createApp({});
		const pinia = createPinia();
		pinia.use(persistedPlugin());
		app.use(pinia);
		setActivePinia(pinia);
		const useStore = defineStore(key, {
			state: () => ({ count: 0 }),
			persisted: true,
		});
		const store = useStore();
		await nextTick();
		expect(store.count).toBe(1);
		expect(
			JSON.parse(localStorage.getItem("__PINIA_PERSIST_PLUGIN__TEST")!).count
		).toBe(1);
	});
	it("持久化参数配置：storage", async () => {
		const app = createApp({});
		const pinia = createPinia();
		pinia.use(persistedPlugin());
		app.use(pinia);
		setActivePinia(pinia);
		const useStore = defineStore(key, {
			state: () => ({ count: 0 }),
			persisted: {
				storage: sessionStorage,
			},
		});
		const store = useStore();
		store.count++;
		await nextTick();
		expect(store.count).toBe(1);
		expect(
			JSON.parse(sessionStorage.getItem("__PINIA_PERSIST_PLUGIN__TEST")!).count
		).toBe(1);
	});
	it("持久化参数配置：storageKey", async () => {
		const app = createApp({});
		const pinia = createPinia();
		pinia.use(persistedPlugin());
		app.use(pinia);
		setActivePinia(pinia);
		const useStore = defineStore(key, {
			state: () => ({ count: 0 }),
			persisted: {
				storage: sessionStorage,
				storageKey: "__PERSIST_PLUGIN__",
			},
		});
		const store = useStore();
		store.count++;
		await nextTick();
		expect(store.count).toBe(1);
		expect(
			JSON.parse(sessionStorage.getItem("__PERSIST_PLUGIN__")!).count
		).toBe(1);
	});
	it("持久化参数配置：对不同State保存在不同Storage", async () => {
		const app = createApp({});
		const pinia = createPinia();
		pinia.use(persistedPlugin());
		app.use(pinia);
		setActivePinia(pinia);
		const useStore = defineStore(key, {
			state: () => ({
				count: 0,
				userInfo: {
					name: "chengbotao",
					email: "chengbotao5221@163.com",
				},
			}),
			persisted: {
				storage: sessionStorage,
				storageKey: "__PERSIST_PLUGIN__",
				paths: [
					"count",
					{
						paths: ["userInfo.name"],
						storage: localStorage,
					},
				],
			},
		});
		const store = useStore();
		store.count++;
		store.userInfo.name = "botaocheng";
		await nextTick();
		expect(store.count).toBe(2);
		expect(store.userInfo.name).toBe("botaocheng");
		expect(
			JSON.parse(sessionStorage.getItem("__PERSIST_PLUGIN__")!).count
		).toBe(2);
		expect(
			JSON.parse(localStorage.getItem("__PERSIST_PLUGIN__")!).userInfo.name
		).toBe("botaocheng");
	});
	it("持久化参数配置：getState setState removeState", async () => {
		const app = createApp({});
		const pinia = createPinia();
		pinia.use(persistedPlugin());
		app.use(pinia);
		setActivePinia(pinia);
		const useStore = defineStore(key, {
			state: () => ({
				count: 0,
				userInfo: {
					name: "chengbotao",
					email: "chengbotao5221@163.com",
				},
			}),
			persisted: {
				storage: localStore,
				storageKey: "__PERSIST_PLUGIN_2__",
				paths: [
					"count",
					{
						paths: ["userInfo.name"],
						storage: sessionStore,
					},
				],
				getState(storage, key) {
					return storage.get(key) as Record<string, unknown>;
				},
				setState(storage, key, value) {
					storage.set(key, value);
				},
				removeState(storage, key) {
					storage.remove(key);
				},
			},
		});
		const store = useStore();
		store.count++;
		store.userInfo.name = "botaocheng";
		await nextTick();
		expect(store.count).toBe(1);
		expect(store.userInfo.name).toBe("botaocheng");
		expect(localStore.get("__PERSIST_PLUGIN_2__").count).toBe(1);
		expect(sessionStore.get("__PERSIST_PLUGIN_2__").userInfo.name).toBe(
			"botaocheng"
		);
	});
	it("持久化参数配置：重置指定持久化状态", async () => {
		const app = createApp({});
		const pinia = createPinia();
		pinia.use(persistedPlugin());
		app.use(pinia);
		setActivePinia(pinia);
		const useStore = defineStore(key, {
			state: () => ({
				count: 0,
				userInfo: {
					name: "chengbotao",
					email: "chengbotao5221@163.com",
				},
			}),
			persisted: {
				storage: localStore,
				storageKey: "__PERSIST_PLUGIN_2__",
				paths: [
					"count",
					{
						paths: ["userInfo.name"],
						storage: sessionStore,
					},
				],
				getState(storage, key) {
					return storage.get(key) as Record<string, unknown>;
				},
				setState(storage, key, value) {
					storage.set(key, value);
				},
				removeState(storage, key) {
					storage.remove(key);
				},
			},
		});
		const store = useStore();
		store.count++;
		store.userInfo.name = "botaocheng";
		await nextTick();
		store.$hydrate();
		expect(store.count).toBe(0);
		expect(store.userInfo.name).toBe("chengbotao");

	})
});
