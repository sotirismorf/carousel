import { defaultFrameImage, frameAt, frameFillingSlide } from '../utils/frames';
import type {
	DeckImages,
	FrameRect,
	ImageSource,
	NormalImage,
	Selection,
	StripRect,
} from '$lib/types';

/**
 * Images for each document, held in memory only — deliberately never written to localStorage,
 * where a handful of pasted bitmaps would blow past the 5MB quota. The small global knobs
 * (shadow, gap, radius, border) live in the persisted `Settings` instead.
 *
 * State is keyed by document, not by slide: images live on one continuous strip and are free
 * to cross slide boundaries, so there is nothing per-slide to key by. That also means editing
 * the markdown can no longer shuffle images onto the wrong slide.
 *
 * Contains no `$effect`, so unlike the documents store it can be created anywhere.
 */

function emptyDeck(): DeckImages {
	return { normal: [], frames: [] };
}

let idCounter = 0;
function newId(): string {
	idCounter += 1;
	return `img-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Structural copy that deliberately shares the `dataUrl` string by reference. Strings are
 * immutable, so this is safe, and it keeps a history entry to a few hundred bytes instead of
 * duplicating multi-megabyte base64 payloads.
 */
function cloneDeck(deck: DeckImages): DeckImages {
	return {
		normal: deck.normal.map((n) => ({ ...n })),
		frames: deck.frames.map((f) => ({ ...f, image: f.image ? { ...f.image } : null })),
	};
}

const HISTORY_LIMIT = 30;
interface HistoryEntry {
	documentId: string;
	deck: DeckImages | undefined;
}

export function createSlideImagesStore() {
	// A plain object, not a Map: `Map` inside `$state` is not deeply reactive in Svelte 5 and
	// would silently fail to trigger updates.
	const decks = $state<Record<string, DeckImages>>({});
	let selection = $state<Selection>(null);
	let hoveredSlide = $state<number | null>(null);

	// Set while a composite operation runs, so it records one entry rather than one per step.
	let suppressHistory = false;
	const undoStack: HistoryEntry[] = [];
	const redoStack: HistoryEntry[] = [];

	function get(documentId: string): DeckImages | undefined {
		return decks[documentId];
	}

	function ensure(documentId: string): DeckImages {
		if (!decks[documentId]) decks[documentId] = emptyDeck();
		return decks[documentId];
	}

	/**
	 * Record the deck's current state so the next change can be undone. Discrete operations
	 * call this themselves; continuous ones (drag, resize, pan, zoom) must call it once at
	 * pointerdown via {@link beginHistory}, or a single drag would fill the whole stack.
	 */
	function pushHistory(documentId: string): void {
		if (suppressHistory) return;
		const deck = decks[documentId];
		undoStack.push({ documentId, deck: deck ? cloneDeck(deck) : undefined });
		if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
		redoStack.length = 0;
	}

	const beginHistory = pushHistory;

	function applyEntry(entry: HistoryEntry, opposite: HistoryEntry[]): void {
		const current = decks[entry.documentId];
		opposite.push({
			documentId: entry.documentId,
			deck: current ? cloneDeck(current) : undefined,
		});
		if (entry.deck) decks[entry.documentId] = entry.deck;
		else delete decks[entry.documentId];
		selection = null;
	}

	function undo(): void {
		const entry = undoStack.pop();
		if (entry) applyEntry(entry, redoStack);
	}

	function redo(): void {
		const entry = redoStack.pop();
		if (entry) applyEntry(entry, undoStack);
	}

	// --- free images ---

	function addNormal(documentId: string, source: ImageSource, placement: StripRect): NormalImage {
		pushHistory(documentId);
		const image: NormalImage = { ...source, ...placement, id: newId() };
		ensure(documentId).normal.push(image);
		selection = { kind: 'normal', id: image.id };
		return image;
	}

	function updateNormal(documentId: string, id: string, patch: Partial<NormalImage>): void {
		const image = get(documentId)?.normal.find((n) => n.id === id);
		if (image) Object.assign(image, patch);
	}

	function removeNormal(documentId: string, id: string): void {
		const deck = get(documentId);
		if (!deck) return;
		pushHistory(documentId);
		deck.normal = deck.normal.filter((n) => n.id !== id);
		if (selection?.kind === 'normal' && selection.id === id) selection = null;
	}

	/** Reorder within the paint order. `delta` of -1 sends backward, +1 brings forward. */
	function reorderNormal(documentId: string, id: string, delta: number): void {
		const deck = get(documentId);
		if (!deck) return;
		const from = deck.normal.findIndex((n) => n.id === id);
		if (from === -1) return;
		const to = Math.min(Math.max(from + delta, 0), deck.normal.length - 1);
		if (to === from) return;
		pushHistory(documentId);
		const [moved] = deck.normal.splice(from, 1);
		deck.normal.splice(to, 0, moved);
	}

	// --- frames ---

	/** Drop into an existing frame, or create one filling the target slide. */
	function addFrame(
		documentId: string,
		source: ImageSource,
		target: { slideIndex: number; gapX: number; gapY: number; frameId?: string }
	): void {
		pushHistory(documentId);
		const deck = ensure(documentId);
		const image = defaultFrameImage(source);

		if (target.frameId) {
			const frame = deck.frames.find((f) => f.id === target.frameId);
			if (frame) {
				frame.image = image;
				selection = { kind: 'frame', id: frame.id };
				return;
			}
		}

		// Prefer an empty frame overlapping the target slide before making a new one.
		const empty = deck.frames.find(
			(f) => f.image === null && f.x < target.slideIndex + 1 && f.x + f.w > target.slideIndex
		);
		if (empty) {
			empty.image = image;
			selection = { kind: 'frame', id: empty.id };
			return;
		}

		const frame = frameFillingSlide(target.slideIndex, image, target.gapX, target.gapY);
		deck.frames.push(frame);
		selection = { kind: 'frame', id: frame.id };
	}

	function addFrameRect(documentId: string, rect: Omit<FrameRect, 'id'>): void {
		pushHistory(documentId);
		const frame = frameAt(rect.x, rect.y, rect.w, rect.h, rect.image);
		ensure(documentId).frames.push(frame);
		selection = { kind: 'frame', id: frame.id };
	}

	function updateFrame(documentId: string, id: string, patch: Partial<FrameRect>): void {
		const frame = get(documentId)?.frames.find((f) => f.id === id);
		if (frame) Object.assign(frame, patch);
	}

	/** Replace the whole frame list, for edge drags that move several frames at once. */
	function setFrames(documentId: string, frames: FrameRect[]): void {
		const deck = get(documentId);
		if (deck) deck.frames = frames;
	}

	function updateFrameImage(
		documentId: string,
		id: string,
		patch: Partial<{ zoom: number; ox: number; oy: number }>
	): void {
		const frame = get(documentId)?.frames.find((f) => f.id === id);
		if (frame?.image) Object.assign(frame.image, patch);
	}

	/** First press empties the frame; a second removes it. */
	function deleteFrame(documentId: string, id: string): void {
		const deck = get(documentId);
		const frame = deck?.frames.find((f) => f.id === id);
		if (!deck || !frame) return;
		pushHistory(documentId);

		if (frame.image) {
			frame.image = null;
			return;
		}
		deck.frames = deck.frames.filter((f) => f.id !== id);
		selection = null;
	}

	// --- mode conversion ---

	/** Turn a free image into a frame occupying the same rectangle. */
	function normalToFrame(documentId: string, id: string, height: number): void {
		const deck = get(documentId);
		const image = deck?.normal.find((n) => n.id === id);
		if (!deck || !image) return;
		pushHistory(documentId);
		suppressHistory = true;
		deck.normal = deck.normal.filter((n) => n.id !== id);
		addFrameRect(documentId, {
			x: image.x,
			y: image.y,
			w: image.w,
			h: height,
			image: defaultFrameImage(image),
		});
		suppressHistory = false;
	}

	/** Turn a frame's image back into a free image anchored at the frame's position. */
	function frameToNormal(documentId: string, id: string): void {
		const deck = get(documentId);
		const frame = deck?.frames.find((f) => f.id === id);
		if (!deck || !frame?.image) return;
		pushHistory(documentId);
		suppressHistory = true;
		const source: ImageSource = {
			dataUrl: frame.image.dataUrl,
			naturalWidth: frame.image.naturalWidth,
			naturalHeight: frame.image.naturalHeight,
		};
		deck.frames = deck.frames.filter((f) => f.id !== id);
		addNormal(documentId, source, { x: frame.x, y: frame.y, w: frame.w });
		suppressHistory = false;
	}

	function dropDocument(documentId: string): void {
		delete decks[documentId];
	}

	return {
		get selection() {
			return selection;
		},
		set selection(value: Selection) {
			selection = value;
		},
		get hoveredSlide() {
			return hoveredSlide;
		},
		set hoveredSlide(value: number | null) {
			hoveredSlide = value;
		},
		get,
		addNormal,
		updateNormal,
		removeNormal,
		reorderNormal,
		addFrame,
		addFrameRect,
		updateFrame,
		setFrames,
		updateFrameImage,
		deleteFrame,
		normalToFrame,
		frameToNormal,
		dropDocument,
		beginHistory,
		undo,
		redo,
	};
}

export type SlideImagesStore = ReturnType<typeof createSlideImagesStore>;
