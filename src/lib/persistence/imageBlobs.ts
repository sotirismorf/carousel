import { STORES, idbDelete, idbGet, idbKeys, idbPut } from './idb';
import { readAsDataUrl } from '$lib/utils/clipboardImages';

/**
 * Content-addressed image storage.
 *
 * In memory every image is a data URL (see `ImageSource` for why). On disk it is a `Blob` keyed
 * by the SHA-256 of that data URL, so the saved workspace only carries short refs, the same
 * image used twice is stored once, and re-saving an unchanged workspace writes no image bytes.
 */

/** Memoized hashes, so each multi-megabyte data URL is hashed at most once. */
const refByDataUrl = new Map<string, string>();
/** Refs we know are already in the database, so we skip rewriting them. */
const storedRefs = new Set<string>();

async function hashOf(dataUrl: string): Promise<string> {
	const cached = refByDataUrl.get(dataUrl);
	if (cached) return cached;
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataUrl));
	const ref = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
	refByDataUrl.set(dataUrl, ref);
	return ref;
}

/** Persist an image (if not already stored) and return the ref to save in its place. */
export async function storeImage(dataUrl: string): Promise<string> {
	const ref = await hashOf(dataUrl);
	if (!storedRefs.has(ref)) {
		// `fetch` decodes data URLs locally; no network involved.
		const blob = await (await fetch(dataUrl)).blob();
		await idbPut(STORES.images, ref, blob);
		storedRefs.add(ref);
	}
	return ref;
}

/** Resolve a ref back to a data URL, or `null` if the image is missing from storage. */
export async function loadImage(ref: string): Promise<string | null> {
	const blob = await idbGet<Blob>(STORES.images, ref);
	if (!blob) {
		console.warn(`Saved image ${ref} is missing from storage; dropping it.`);
		return null;
	}
	const dataUrl = await readAsDataUrl(blob);
	refByDataUrl.set(dataUrl, ref);
	storedRefs.add(ref);
	return dataUrl;
}

/**
 * Delete every stored image not in `liveRefs`. Images that are only reachable through undo
 * history get deleted too — that's fine, because {@link storeImage} writes them back if an
 * undo brings them back into the workspace.
 */
export async function deleteImagesExcept(liveRefs: Set<string>): Promise<void> {
	for (const ref of await idbKeys(STORES.images)) {
		if (liveRefs.has(ref)) continue;
		await idbDelete(STORES.images, ref);
		storedRefs.delete(ref);
	}
	// Let the memo drop dead images too, rather than pinning their data URLs for the session.
	for (const [dataUrl, ref] of refByDataUrl) {
		if (!liveRefs.has(ref)) refByDataUrl.delete(dataUrl);
	}
}
