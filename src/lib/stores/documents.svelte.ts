import { DEFAULT_MARKDOWN, DEFAULT_SETTINGS } from '../utils/constants';
import type { CarouselDocument, Settings } from '$lib/types';

const STORAGE_KEY = 'carousel-documents';

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

function loadFromStorage(): { documents: CarouselDocument[]; activeId: string } | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const data = JSON.parse(stored);
			if (data.documents && data.documents.length > 0) {
				// Merge stored settings with defaults to handle missing keys from older saves
				data.documents = data.documents.map((doc: CarouselDocument) => ({
					...doc,
					settings: { ...structuredClone(DEFAULT_SETTINGS), ...doc.settings } as Settings,
				}));
				return data;
			}
		}
	} catch (e) {
		console.error('Failed to load documents from storage:', e);
	}
	return null;
}

function saveToStorage(documents: CarouselDocument[], activeId: string): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ documents, activeId }));
	} catch (e) {
		console.error('Failed to save documents to storage:', e);
	}
}

export function createDocumentsStore() {
	const stored = loadFromStorage();
	const initialDocs = stored?.documents || [createDefaultDocument()];
	const initialActiveId = stored?.activeId || initialDocs[0].id;

	let documents = $state<CarouselDocument[]>(initialDocs);
	let activeId = $state<string>(initialActiveId);

	// Persist on changes
	$effect(() => {
		saveToStorage(documents, activeId);
	});

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
		getActiveDocument,
		setActiveContent,
		addDocument,
		removeDocument,
		renameDocument,
		setActiveId,
		updateActiveSettings,
	};
}
