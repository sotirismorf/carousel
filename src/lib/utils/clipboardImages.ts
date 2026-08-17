import { MAX_IMAGE_PX } from './constants';
import type { ImageSource } from '$lib/types';

/** Pull image files out of a paste event, if it carries any. */
export function imageFilesFromClipboard(event: ClipboardEvent): File[] {
	const items = event.clipboardData?.items;
	if (!items) return [];
	return Array.from(items)
		.filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
		.map((item) => item.getAsFile())
		.filter((file): file is File => file !== null);
}

/** Pull image files out of a drop event. */
export function imageFilesFromDataTransfer(data: DataTransfer | null): File[] {
	if (!data) return [];
	return Array.from(data.files).filter((file) => file.type.startsWith('image/'));
}

function readAsDataUrl(file: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
		reader.readAsDataURL(file);
	});
}

function loadImage(src: string): Promise<HTMLImageElement> {
	const img = new Image();
	img.src = src;
	return img.decode().then(() => img);
}

/**
 * Read an image file into an {@link ImageSource}.
 *
 * Always produces a data URL rather than an object URL: html-to-image inlines `<img>` sources
 * when it rasterizes, which is a no-op for data URLs but a fetch for `blob:` URLs — and that
 * fetch races, and fails outright once the URL has been revoked.
 *
 * Anything larger than {@link MAX_IMAGE_PX} on its longest edge is downscaled first. That is
 * the largest size we could ever export at, so beyond it we would only be spending memory and
 * rasterization time.
 */
export async function fileToImageSource(file: File): Promise<ImageSource> {
	const originalUrl = await readAsDataUrl(file);
	const img = await loadImage(originalUrl);

	const longest = Math.max(img.naturalWidth, img.naturalHeight);
	if (longest <= MAX_IMAGE_PX) {
		return {
			dataUrl: originalUrl,
			naturalWidth: img.naturalWidth,
			naturalHeight: img.naturalHeight,
		};
	}

	const ratio = MAX_IMAGE_PX / longest;
	const width = Math.round(img.naturalWidth * ratio);
	const height = Math.round(img.naturalHeight * ratio);

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		// Downscaling is an optimization; the full-size image is still correct.
		return {
			dataUrl: originalUrl,
			naturalWidth: img.naturalWidth,
			naturalHeight: img.naturalHeight,
		};
	}
	ctx.drawImage(img, 0, 0, width, height);

	// Keep JPEG as JPEG (much smaller for photos); everything else becomes PNG so alpha
	// survives — cover art with transparency is common.
	const isJpeg = file.type === 'image/jpeg';
	const dataUrl = isJpeg ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png');

	return { dataUrl, naturalWidth: width, naturalHeight: height };
}
