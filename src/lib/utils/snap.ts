import type { FrameRect, NormalImage } from '$lib/types';

/**
 * Alignment snapping on the continuous strip.
 *
 * Everything here is in strip units, but the *threshold* is derived from screen px by the
 * caller. A fixed unit threshold would be unusable across the 15%-60% preview zoom range: far
 * too coarse when zoomed out, far too fine when zoomed in.
 */

export interface SnapResolution {
	/** Correction to add to the moving value, in strip units. */
	delta: number;
	/** Lines to draw, in strip units. */
	guides: number[];
}

/**
 * Pick the single closest probe/candidate pairing within `threshold`. Each axis is resolved
 * independently and only one correction is applied per axis, so nothing can be pulled two
 * directions at once.
 */
export function resolveSnap(
	probes: number[],
	candidates: number[],
	threshold: number
): SnapResolution | null {
	let best: { delta: number; target: number } | null = null;

	for (const probe of probes) {
		for (const candidate of candidates) {
			const delta = candidate - probe;
			if (Math.abs(delta) > threshold) continue;
			if (!best || Math.abs(delta) < Math.abs(best.delta)) best = { delta, target: candidate };
		}
	}
	if (!best) return null;
	return { delta: best.delta, guides: [best.target] };
}

interface CandidateOptions {
	slideCount: number;
	/** Slide padding as a fraction of the axis. */
	inset: number;
	/** Frame gap as a fraction of the axis. */
	gap: number;
	frames: FrameRect[];
	normal: NormalImage[];
	/** Height of a normal image, per id, since it is derived rather than stored. */
	normalHeight: (image: NormalImage) => number;
	/** Exclude the thing being dragged. */
	excludeId?: string;
}

/**
 * Snap targets along one axis.
 *
 * Horizontally these repeat per slide, which is what keeps a continuous strip feeling like a
 * carousel: you can still line something up to "the left edge of slide 3" even though nothing
 * stops at slide boundaries any more.
 */
export function snapCandidates(axis: 'x' | 'y', options: CandidateOptions): number[] {
	const { slideCount, inset, gap, frames, normal, normalHeight, excludeId } = options;
	const candidates: number[] = [];

	if (axis === 'x') {
		for (let i = 0; i <= slideCount; i++) {
			candidates.push(i, i + inset, i - inset);
			if (i < slideCount) candidates.push(i + 0.5);
			candidates.push(i + gap, i - gap);
		}
	} else {
		candidates.push(0, 0.5, 1, inset, 1 - inset, gap, 1 - gap);
	}

	const pushEdges = (start: number, size: number) => {
		const end = start + size;
		candidates.push(start, start + size / 2, end);
		// Gap-offset positions, so dragging a frame next to another lands one gap away.
		candidates.push(end + gap, start - gap);
	};

	for (const frame of frames) {
		if (frame.id === excludeId) continue;
		if (axis === 'x') pushEdges(frame.x, frame.w);
		else pushEdges(frame.y, frame.h);
	}

	for (const image of normal) {
		if (image.id === excludeId) continue;
		if (axis === 'x') pushEdges(image.x, image.w);
		else pushEdges(image.y, normalHeight(image));
	}

	return candidates;
}
