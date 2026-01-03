import { marked } from 'marked';

/**
 * Split markdown content by horizontal rules (---) and parse each segment
 * @param {string} markdown - Raw markdown content
 * @returns {string[]} Array of HTML strings, one per slide
 */
export function parseAndSplitMarkdown(markdown) {
  if (!markdown || !markdown.trim()) {
    return [];
  }

  // Split by horizontal rules (--- on its own line)
  // Handle various formats: ---, - - -, ***, etc.
  const segments = markdown.split(/\n(?:---+|\*\*\*+|- - -+)\n/);

  // Parse each segment and filter out empty ones
  return segments
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0)
    .map(segment => marked(segment));
}

/**
 * Read file content as text
 * @param {File} file - File object from input
 * @returns {Promise<string>} File content as string
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}
