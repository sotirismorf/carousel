import { onMount } from 'svelte';
import { loadWorkspace, saveWorkspace, type Workspace } from '$lib/persistence/workspace';
import type { DocumentsStore } from './documents.svelte';
import type { SlideImagesStore } from './slideImages.svelte';
import type { UiState } from '$lib/types';

/**
 * How long edits must pause before a save. Long enough that a whole drag is one save, short
 * enough that closing the tab right after an edit rarely loses it — and we flush immediately
 * when the tab is hidden anyway.
 */
const SAVE_DELAY_MS = 400;

/**
 * - `loading`: restoring the saved workspace; the UI should not render yet.
 * - `ready`: restored, and every change is autosaved.
 * - `unavailable`: storage couldn't be read. Autosave stays OFF, because saving now would
 *   overwrite whatever is stored with a blank workspace.
 */
export type PersistenceStatus = 'loading' | 'ready' | 'unavailable';

/**
 * Restores the workspace on start-up and autosaves it on every change. Uses `onMount` and
 * `$effect`, so it must be created during component initialisation.
 */
export function createPersistence(docs: DocumentsStore, images: SlideImagesStore, ui: UiState) {
	let status = $state<PersistenceStatus>('loading');
	let saveFailed = $state(false);

	let pending: Workspace | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;
	// Saves run one at a time, so an older snapshot can never land after a newer one.
	let queue: Promise<void> = Promise.resolve();

	function flush(): void {
		clearTimeout(timer);
		if (!pending) return;
		const workspace = pending;
		pending = null;
		queue = queue
			.then(() => saveWorkspace(workspace))
			.then(
				() => {
					saveFailed = false;
				},
				(err: unknown) => {
					console.error('Failed to save workspace:', err);
					saveFailed = true;
				}
			);
	}

	async function restore(): Promise<void> {
		// Ask the browser not to evict our data under storage pressure. Best effort.
		navigator.storage?.persist?.().catch(() => {});
		try {
			const workspace = await loadWorkspace();
			if (workspace) {
				docs.hydrate(workspace);
				images.hydrate(workspace.decks);
				Object.assign(ui, workspace.ui);
			}
			status = 'ready';
		} catch (err) {
			console.error('Failed to restore workspace:', err);
			status = 'unavailable';
		}
	}

	onMount(() => {
		void restore();

		// Don't wait out the debounce when the tab is going away.
		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') flush();
		};
		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('pagehide', flush);
		return () => {
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('pagehide', flush);
		};
	});

	$effect(() => {
		if (status !== 'ready') return;
		// Snapshotting reads every field, which is also what subscribes this effect to all of them.
		pending = $state.snapshot({
			documents: docs.documents,
			activeId: docs.activeId,
			decks: images.decks,
			ui,
		});
		clearTimeout(timer);
		timer = setTimeout(flush, SAVE_DELAY_MS);
	});

	return {
		get status() {
			return status;
		},
		get saveFailed() {
			return saveFailed;
		},
	};
}
