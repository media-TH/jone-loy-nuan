/**
 * Browser side of "ลบข้อมูลของฉัน": removes the keys the server told us to clear.
 * Every access is guarded: storage can be missing or throw (private mode, blocked site data).
 */

import type { ClientStorageKeys } from "@/lib/privacy/policy";

function removeAll(getStorage: () => Storage, keys: readonly string[]): void {
	let storage: Storage;
	try {
		storage = getStorage();
	} catch {
		return;
	}
	for (const key of keys) {
		try {
			storage.removeItem(key);
		} catch {
			// Nothing else to do: the key is unreadable to us as well.
		}
	}
}

export function clearClientStorage(keys: ClientStorageKeys): void {
	if (typeof window === "undefined") return;
	removeAll(() => window.localStorage, keys.localStorage);
	removeAll(() => window.sessionStorage, keys.sessionStorage);
}
