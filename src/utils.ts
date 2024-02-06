/*
 * @Author: Chengbotao
 * @Contact: https://github.com/chengbotao
 */

export function isPlainObject(val: unknown): val is Record<string, unknown> {
	return Object.prototype.toString.call(val) === "[object Object]";
}

export function isEmpty(values: unknown[] | Record<string, unknown>): boolean {
	if (Array.isArray(values)) {
		// 数组为空
		if (values.length > 0) return false;
	} else {
		// 对象为空
		for (const key in values) {
			return !!key && false;
		}
	}
	return true;
}

export function deepClone(target: any, map = new WeakMap()) {
	if (target === null || typeof target !== "object") {
		return target;
	}

	if (map.get(target)) {
		return target;
	}

	const Ctor = target.constructor;
	const ctorName = Ctor.name;
	if (/^(RegExp|Date|Number|String|Boolean|Error)$/i.test(ctorName)) {
		return new Ctor(target);
	}

	if (ctorName === "Symbol") {
		return Object(Object.prototype.valueOf.call(target));
	}

	if (ctorName === "Map") {
		const cloneMap = new Map();
		map.set(target, true);
		target.forEach((value: unknown, key: unknown) => {
			cloneMap.set(deepClone(key, map), deepClone(value, map));
		});
		return cloneMap;
	}

	if (ctorName === "Set") {
		const cloneSet = new Set();
		map.set(target, true);

		target.forEach((value: unknown) => {
			cloneSet.add(deepClone(value, map));
		});
		return cloneSet;
	}

	map.set(target, true);

	const cloneResult: Record<string, any> = Array.isArray(target) ? [] : {};

	Object.getOwnPropertyNames(target).forEach((key: string) => {
		cloneResult[key] = deepClone(target[key], map);
	});

	return cloneResult;
}

export function deepMerge(...objects: any[]): Object {
	const result = Object.create({});
	objects.forEach((obj) => {
		if (!isEmpty(obj)) {
			Object.keys(obj).forEach((key) => {
				const val = obj[key];
				if (isPlainObject(val)) {
					if (isPlainObject(result[key])) {
						result[key] = deepMerge(result[key], val);
					} else {
						result[key] = deepMerge(val);
					}
				} else {
					result[key] = val;
				}
			});
		}
	});
	return result;
}

export function getValueByReference<T extends Record<string, any>>(
	target: T,
	refer: string | string[]
): any {
	const refers: string[] =
		typeof refer === "string"
			? (refer as string).split(".")
			: (refer as string[]);

	return refers.reduce((obj, key) => {
		return obj && obj[key];
	}, target);
}

export function setValueByReference(
	target: any,
	refer: string | string[],
	val: any
): any {
	const refers: string[] =
		typeof refer === "string"
			? (refer as string).split(".")
			: (refer as string[]);

	return (
		(refers.slice(0, -1).reduce((obj, key) => {
			return (obj[key] = obj[key] || {});
		}, target)[refers.pop() as string] = val),
		target
	);
}
export function reducerState(state: Record<string, unknown>, paths: string[]) {
	return Array.isArray(paths)
		? paths.reduce((subState, path) => {
				return setValueByReference(
					subState,
					path,
					getValueByReference(state, path)
				);
		  }, {})
		: state;
}
