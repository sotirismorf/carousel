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

	for (let i = 0; i < slideNodes.length; i++) {
		const blob = await nodeToBlob(slideNodes[i], width, height);
		const slideNumber = String(i + 1).padStart(2, '0');
		zip.file(`slide-${slideNumber}.png`, blob);
	}

	const zipBlob = await zip.generateAsync({ type: 'blob' });
	saveAs(zipBlob, `${filename}.zip`);
}
