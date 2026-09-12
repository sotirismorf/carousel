import { DEFAULT_MARKDOWN, DEFAULT_SETTINGS } from '../utils/constants';
import type { CarouselDocument, Settings } from '$lib/types';

/**
 * The open documents and which one is active. Saving and restoring is handled by the
 * persistence store; this one only exposes {@link hydrate} for it to fill in saved state.
 */

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function createDefaultDocument(): CarouselDocument {
	return {
		id: generateId(),
		name: 'Untitled',
		content: DEFAULT_MARKDOWN,
		settings: structuredClone(DEFAULT_SETTINGS),
		createdAt: Date.now(),
	};
}

/** Fill in settings added since the document was saved. */
function normalizeDocument(doc: CarouselDocument): CarouselDocument {
	return {
		...doc,
		settings: { ...structuredClone(DEFAULT_SETTINGS), ...doc.settings } as Settings,
	};
}

export function createDocumentsStore() {
	let documents = $state<CarouselDocument[]>([createDefaultDocument()]);
	let activeId = $state<string>(documents[0].id);

	/** Replace everything with saved state. Ignored if there is nothing to restore. */
	function hydrate(saved: { documents: CarouselDocument[]; activeId: string }): void {
		if (saved.documents.length === 0) return;
		documents = saved.documents.map(normalizeDocument);
		activeId = documents.some((d) => d.id === saved.activeId) ? saved.activeId : documents[0].id;
	}

	function getActiveDocument(): CarouselDocument | undefined {
		return documents.find((d) => d.id === activeId) || documents[0];
	}

	function setActiveContent(content: string): void {
		const doc = documents.find((d) => d.id === activeId);
		if (doc) {
			doc.content = content;
		}
	}

	function addDocument(): void {
		const newDoc = createDefaultDocument();
		documents = [...documents, newDoc];
		activeId = newDoc.id;
	}

	function removeDocument(id: string): void {
		if (documents.length <= 1) return;
		const index = documents.findIndex((d) => d.id === id);
		documents = documents.filter((d) => d.id !== id);
		if (activeId === id) {
			activeId = documents[Math.max(0, index - 1)].id;
		}
	}

	function renameDocument(id: string, name: string): void {
		const doc = documents.find((d) => d.id === id);
		if (doc) {
			doc.name = name;
		}
	}

	function setActiveId(id: string): void {
		activeId = id;
	}

	function updateActiveSettings(newSettings: Settings): void {
		const doc = documents.find((d) => d.id === activeId);
		if (doc) {
			doc.settings = newSettings;
		}
	}

	return {
		get documents() {
			return documents;
		},
		get activeId() {
			return activeId;
		},
		get activeSettings() {
			return getActiveDocument()?.settings;
		},
		hydrate,
		getActiveDocument,
		setActiveContent,
		addDocument,
		removeDocument,
		renameDocument,
		setActiveId,
		updateActiveSettings,
	};
}

export type DocumentsStore = ReturnType<typeof createDocumentsStore>;
