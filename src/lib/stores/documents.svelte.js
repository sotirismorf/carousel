import { DEFAULT_MARKDOWN } from '../utils/constants.js';

const STORAGE_KEY = 'carousel-documents';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function createDefaultDocument() {
  return {
    id: generateId(),
    name: 'Untitled',
    content: DEFAULT_MARKDOWN,
    createdAt: Date.now(),
  };
}

function loadFromStorage() {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.documents && data.documents.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Failed to load documents from storage:', e);
  }
  return null;
}

function saveToStorage(documents, activeId) {
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

  let documents = $state(initialDocs);
  let activeId = $state(initialActiveId);

  // Persist on changes
  $effect(() => {
    saveToStorage(documents, activeId);
  });

  function getActiveDocument() {
    return documents.find(d => d.id === activeId) || documents[0];
  }

  function setActiveContent(content) {
    const doc = documents.find(d => d.id === activeId);
    if (doc) {
      doc.content = content;
    }
  }

  function addDocument() {
    const newDoc = createDefaultDocument();
    documents = [...documents, newDoc];
    activeId = newDoc.id;
  }

  function removeDocument(id) {
    if (documents.length <= 1) return;
    const index = documents.findIndex(d => d.id === id);
    documents = documents.filter(d => d.id !== id);
    if (activeId === id) {
      activeId = documents[Math.max(0, index - 1)].id;
    }
  }

  function renameDocument(id, name) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      doc.name = name;
    }
  }

  function setActiveId(id) {
    activeId = id;
  }

  return {
    get documents() { return documents; },
    get activeId() { return activeId; },
    getActiveDocument,
    setActiveContent,
    addDocument,
    removeDocument,
    renameDocument,
    setActiveId,
  };
}
