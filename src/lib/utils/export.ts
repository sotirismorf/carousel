import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

async function nodeToBlob(node: HTMLElement, width: number, height: number): Promise<Blob> {
	const dataUrl = await toPng(node, {
		width,
		height,
		pixelRatio: 1,
		style: {
			transform: 'scale(1)',
			transformOrigin: 'top left',
		},
	});

	// Convert data URL to blob
	const response = await fetch(dataUrl);
	return response.blob();
}

export async function exportSlidesToZip(
	slideNodes: HTMLElement[],
	width: number,
	height: number,
	filename = 'slides'
): Promise<void> {
	const zip = new JSZip();

	const nodes = slideNodes.filter((n): n is HTMLElement => n instanceof HTMLElement);
	if (nodes.length === 0) {
		throw new Error('No slides available to export');
	}

	for (let i = 0; i < nodes.length; i++) {
		const blob = await nodeToBlob(nodes[i], width, height);
		const slideNumber = String(i + 1).padStart(2, '0');
		zip.file(`slide-${slideNumber}.png`, blob);
	}

	const zipBlob = await zip.generateAsync({ type: 'blob' });
	saveAs(zipBlob, `${filename}.zip`);
}
