import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Convert a DOM node to PNG blob
 * @param {HTMLElement} node - DOM element to convert
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {Promise<Blob>} PNG blob
 */
async function nodeToBlob(node, width, height) {
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

/**
 * Export slide elements as a zip file of PNGs
 * @param {HTMLElement[]} slideNodes - Array of slide DOM elements
 * @param {number} width - Slide width in pixels
 * @param {number} height - Slide height in pixels
 * @param {string} filename - Output zip filename (without extension)
 */
export async function exportSlidesToZip(slideNodes, width, height, filename = 'slides') {
  const zip = new JSZip();

  for (let i = 0; i < slideNodes.length; i++) {
    const blob = await nodeToBlob(slideNodes[i], width, height);
    const slideNumber = String(i + 1).padStart(2, '0');
    zip.file(`slide-${slideNumber}.png`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${filename}.zip`);
}
