/**
 * A minimal promise wrapper over IndexedDB — just enough for key/value access to a couple of
 * object stores. IndexedDB rather than localStorage because images need far more than
 * localStorage's ~5MB quota, and it stores `Blob`s natively instead of as base64 text.
 */

const DB_NAME = 'carousel';
const DB_VERSION = 1;

export const STORES = {
	/** The whole editing session as one small record: documents, image layouts, UI state. */
	workspace: 'workspace',
	/** Image bitmaps as `Blob`s, keyed by content hash. */
	images: 'images',
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
	dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			for (const name of Object.values(STORES)) {
				if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
	}).catch((err: unknown) => {
		// Forget the failure so a later call can retry.
		dbPromise = null;
		throw err;
	});
	return dbPromise;
}

/**
 * Run one request in its own transaction and resolve once the transaction has committed, so
 * a resolved write is durable rather than merely queued.
 */
async function run<T>(
	storeName: StoreName,
	mode: IDBTransactionMode,
	makeRequest: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const db = await openDb();
	const tx = db.transaction(storeName, mode);
	// Attach before issuing the request: the transaction can commit as soon as it goes idle.
	const committed = new Promise<void>((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
	});
	const request = makeRequest(tx.objectStore(storeName));
	const result = new Promise<T>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
	});
	const [value] = await Promise.all([result, committed]);
	return value;
}

export function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
	return run(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
}

export async function idbPut(store: StoreName, key: string, value: unknown): Promise<void> {
	await run(store, 'readwrite', (s) => s.put(value, key));
}

export async function idbDelete(store: StoreName, key: string): Promise<void> {
	await run(store, 'readwrite', (s) => s.delete(key));
}

export async function idbKeys(store: StoreName): Promise<string[]> {
	const keys = await run(store, 'readonly', (s) => s.getAllKeys());
	return keys.map(String);
}
