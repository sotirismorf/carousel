import { MAX_IMAGE_ZOOM } from './constants';
import type { FrameImage, NormalImage } from '$lib/types';

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Where the bitmap sits inside its frame, in frame-local px.
 *
 * The image is laid out with explicit width/height/left/top rather than `object-fit` plus a
 * transform: plain layout is the most reliable thing to hand html-to-image's foreignObject
 * rasterizer, and it makes the "never show empty space" guarantee fall out for free.
 *
 * Pan is stored as a *fraction of the overflow*, so clamping is just [0,1] and stays valid
 * when the frame is resized or its aspect changes. Since `zoom >= 1` implies `iw >= fw` and
 * `ox ∈ [0,1]` implies `left <= 0` and `left + iw >= fw`, both edges are always covered.
 */
export function frameImageBox(
	image: FrameImage,
	frameWidth: number,
	frameHeight: number
): { left: number; top: number; width: number; height: number } {
	const coverScale = Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight);
	const width = image.naturalWidth * coverScale * image.zoom;
	const height = image.naturalHeight * coverScale * image.zoom;
	return {
		width,
		height,
		left: -(width - frameWidth) * clamp(image.ox, 0, 1),
		top: -(height - frameHeight) * clamp(image.oy, 0, 1),
	};
}

/**
 * Pan by a screen-space delta. Both the delta and the overflow are in screen px, so this is
 * scale-invariant and needs no unscaling by the preview zoom.
 */
export function panFrameImage(
	origin: { ox: number; oy: number },
	overflow: { x: number; y: number },
	delta: { x: number; y: number }
): { ox: number; oy: number } {
	return {
		// An axis with no overflow can't pan; leave it alone rather than dividing by ~0.
		ox: overflow.x > 1 ? clamp(origin.ox - delta.x / overflow.x, 0, 1) : origin.ox,
		oy: overflow.y > 1 ? clamp(origin.oy - delta.y / overflow.y, 0, 1) : origin.oy,
	};
}

/**
 * Zoom about a cursor position, keeping the pixel under the cursor put.
 * `cursor` is in frame-local px.
 */
export function zoomFrameImage(
	image: FrameImage,
	frameWidth: number,
	frameHeight: number,
	factor: number,
	cursor?: { x: number; y: number }
): FrameImage {
	const zoom = clamp(image.zoom * factor, 1, MAX_IMAGE_ZOOM);
	if (zoom === image.zoom) return image;

	const before = frameImageBox(image, frameWidth, frameHeight);
	const next = { ...image, zoom };
	const after = frameImageBox(next, frameWidth, frameHeight);

	const anchor = cursor ?? { x: frameWidth / 2, y: frameHeight / 2 };
	const overflowX = after.width - frameWidth;
	const overflowY = after.height - frameHeight;

	if (overflowX > 1) {
		const u = (anchor.x - before.left) / before.width;
		next.ox = clamp((u * after.width - anchor.x) / overflowX, 0, 1);
	}
	if (overflowY > 1) {
		const v = (anchor.y - before.top) / before.height;
		next.oy = clamp((v * after.height - anchor.y) / overflowY, 0, 1);
	}
	return next;
}

/**
 * Height of a normal image as a fraction of slide height. Always derived from the natural
 * aspect ratio, so changing the slide dimension can never distort the image.
 */
export function normalImageHeight(
	image: Pick<NormalImage, 'w' | 'naturalWidth' | 'naturalHeight'>,
	slideWidth: number,
	slideHeight: number
): number {
	const aspect = image.naturalWidth / image.naturalHeight;
	return (image.w * slideWidth) / aspect / slideHeight;
}
