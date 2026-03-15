import { marked } from 'marked';

export function parseAndSplitMarkdown(markdown: string): string[] {
	if (!markdown || !markdown.trim()) {
		return [];
	}

	// Split by horizontal rules (--- on its own line)
	// Handle various formats: ---, - - -, ***, etc.
	const segments = markdown.split(/\n(?:---+|\*\*\*+|- - -+)\n/);

	// Parse each segment and filter out empty ones
	return segments
		.map((segment) => segment.trim())
		.filter((segment) => segment.length > 0)
		.map((segment) => marked.parse(segment) as string);
}

export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e: ProgressEvent<FileReader>) => resolve(e.target!.result as string);
		reader.onerror = (e) => reject(e);
		reader.readAsText(file);
	});
}
