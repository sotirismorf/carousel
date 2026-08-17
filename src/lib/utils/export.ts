import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const PNG_OPTIONS = {
	pixelRatio: 1,
	style: {
		transform: 'scale(1)',
		transformOrigin: 'top left',
	},
} as const;

/**
 * html-to-image rasterizes into an SVG foreignObject, which paints whatever the DOM looks
 * like at that instant. Fonts that are still loading and images that have not decoded yet
 * are simply missing from the output, so both have to be awaited first.
 */
async function waitForAssets(nodes: HTMLElement[]): Promise<void> {
	await document.fonts.ready;

	const images = nodes.flatMap((node) => Array.from(node.querySelectorAll('img')));
	await Promise.all(
		images.map((img) =>
			// A broken/unsupported source must not abort the whole export.
			img.decode().catch(() => undefined)
		)
	);
}

async function nodeToBlob(node: HTMLElement, width: number, height: number): Promise<Blob> {
	const dataUrl = await toPng(node, { width, height, ...PNG_OPTIONS });

	// Convert data URL to blob
	const response = await fetch(dataUrl);
	return response.blob();
}

export async function exportSlidesToZip(
	slideNodes: HTMLElement[],
	width: number,
	height: number,
	filename = 'slides',
	onProgress?: (done: number, total: number) => void
): Promise<void> {
	const zip = new JSZip();

	const nodes = slideNodes.filter((n): n is HTMLElement => n instanceof HTMLElement);
	if (nodes.length === 0) {
		throw new Error('No slides available to export');
	}

	await waitForAssets(nodes);

	// Warm-up pass: html-to-image's first capture of a node tree routinely drops images it
	// has only just inlined. The result is discarded; the second capture of the same node
	// below is the one that ends up in the zip.
	await toPng(nodes[0], { width, height, ...PNG_OPTIONS }).catch(() => undefined);

	onProgress?.(0, nodes.length);

	for (let i = 0; i < nodes.length; i++) {
		const blob = await nodeToBlob(nodes[i], width, height);
		const slideNumber = String(i + 1).padStart(2, '0');
		zip.file(`slide-${slideNumber}.png`, blob);
		onProgress?.(i + 1, nodes.length);
	}

	const zipBlob = await zip.generateAsync({ type: 'blob' });
	saveAs(zipBlob, `${filename}.zip`);
}
