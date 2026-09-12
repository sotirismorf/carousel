import { STORES, idbGet, idbPut } from './idb';
import { deleteImagesExcept, loadImage, storeImage } from './imageBlobs';
import type { CarouselDocument, DeckImages, Settings, UiState } from '$lib/types';

/** Everything needed to reopen the app exactly where it was left. */
export interface Workspace {
	documents: CarouselDocument[];
	activeId: string;
	/** Image decks keyed by document id. */
	decks: Record<string, DeckImages>;
	ui: UiState;
}

export const DEFAULT_UI_STATE: UiState = {
	editorCollapsed: false,
	mobilePanel: 'preview',
};

/**
 * The stored form has the same shape as {@link Workspace}, except every image field holds a
 * ref into the image store instead of a data URL. `version` is there for future migrations.
 */
interface StoredWorkspace extends Workspace {
	version: 1;
}

const WORKSPACE_KEY = 'current';

/** Where documents lived before IndexedDB. Read once to migrate, then removed. */
const LEGACY_STORAGE_KEY = 'carousel-documents';

// --- image field traversal -------------------------------------------------------------------

/** Maps one image (data URL ⇄ ref). `null` means the image is gone and should be dropped. */
type ImageMapper = (image: string) => Promise<string | null>;

async function mapOptional(image: string | null, map: ImageMapper): Promise<string | null> {
	return image ? map(image) : null;
}

async function mapSettingsImages(settings: Settings, map: ImageMapper): Promise<Settings> {
	const corners = Object.fromEntries(
		await Promise.all(
			Object.entries(settings.corners).map(
				async ([key, corner]) =>
					[key, { ...corner, image: await mapOptional(corner.image, map) }] as const
			)
		)
	);
	return { ...settings, bgImage: await mapOptional(settings.bgImage, map), corners };
}

async function mapDeckImages(deck: DeckImages, map: ImageMapper): Promise<DeckImages> {
	const normal = await Promise.all(
		deck.normal.map(async (image) => {
			const dataUrl = await map(image.dataUrl);
			return dataUrl ? { ...image, dataUrl } : null;
		})
	);
	const frames = await Promise.all(
		deck.frames.map(async (frame) => {
			if (!frame.image) return frame;
			const dataUrl = await map(frame.image.dataUrl);
			// A frame whose image is lost stays on the slide as an empty frame.
			return { ...frame, image: dataUrl ? { ...frame.image, dataUrl } : null };
		})
	);
	return { normal: normal.filter((image) => image !== null), frames };
}

/**
 * The single place that knows where images live in a workspace. Anything that adds a new image
 * field must be handled here, or that image won't survive a reload.
 */
async function mapWorkspaceImages(workspace: Workspace, map: ImageMapper): Promise<Workspace> {
	const documents = await Promise.all(
		workspace.documents.map(async (doc) => ({
			...doc,
			settings: await mapSettingsImages(doc.settings, map),
		}))
	);
	const decks = Object.fromEntries(
		await Promise.all(
			Object.entries(workspace.decks).map(
				async ([id, deck]) => [id, await mapDeckImages(deck, map)] as const
			)
		)
	);
	return { ...workspace, documents, decks };
}

// --- load / save ----------------------------------------------------------------------------

function loadLegacyWorkspace(): Workspace | null {
	try {
		const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as { documents?: CarouselDocument[]; activeId?: string };
		if (!data.documents?.length) return null;
		return {
			documents: data.documents,
			activeId: data.activeId ?? data.documents[0].id,
			decks: {},
			ui: DEFAULT_UI_STATE,
		};
	} catch (err) {
		console.error('Failed to read legacy documents:', err);
		return null;
	}
}

/**
 * Restore the saved workspace with images resolved back to data URLs, or `null` if nothing has
 * been saved yet. Throws if storage can't be read at all.
 */
export async function loadWorkspace(): Promise<Workspace | null> {
	const stored = await idbGet<StoredWorkspace>(STORES.workspace, WORKSPACE_KEY);
	if (!stored) return loadLegacyWorkspace();
	const { version: _version, ...workspace } = stored;
	const restored = await mapWorkspaceImages(workspace, loadImage);
	return { ...restored, ui: { ...DEFAULT_UI_STATE, ...restored.ui } };
}

/** Save the workspace, then delete images it no longer references. */
export async function saveWorkspace(workspace: Workspace): Promise<void> {
	const liveRefs = new Set<string>();
	const stored = await mapWorkspaceImages(workspace, async (dataUrl) => {
		const ref = await storeImage(dataUrl);
		liveRefs.add(ref);
		return ref;
	});
	const record: StoredWorkspace = { version: 1, ...stored };
	await idbPut(STORES.workspace, WORKSPACE_KEY, record);
	await deleteImagesExcept(liveRefs);
	// Only now is the migrated copy safely in IndexedDB.
	localStorage.removeItem(LEGACY_STORAGE_KEY);
}
