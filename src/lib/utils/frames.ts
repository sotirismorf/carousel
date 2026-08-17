import { MIN_FRAME_PX } from './constants';
import type { FrameImage, FrameRect } from '$lib/types';

/**
 * Frame geometry: free rectangles on the continuous strip, not a tiling of the slide.
 *
 * A frame may occupy any part of the strip and leave the rest empty — dragging one frame's
 * right edge leftwards just makes it narrower, it does not grow a neighbour to compensate.
 *
 * What *does* survive from the tiling idea is the behaviour that actually mattered: edges
 * facing each other across the gap are **glued**. Dragging an edge carries every edge glued to
 * it (transitively), so a gap between frames never changes width, and dragging the corner
 * where three frames meet resizes all three at once — which is exactly the shared-junction
 * drag, without forcing frames to partition the slide.
 *
 * Units are the strip units described on `StripRect`: x/w in slide widths, y/h in fractions of
 * slide height.
 */

export type Edge = 'left' | 'right' | 'top' | 'bottom';
export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Which edges a handle drives. Corners drive one horizontal and one vertical edge, which is
 * what makes a corner handle at a three-frame junction resize all three. */
export function handleEdges(handle: Handle): Edge[] {
	const edges: Edge[] = [];
	if (handle.includes('w')) edges.push('left');
	if (handle.includes('e')) edges.push('right');
	if (handle.includes('n')) edges.push('top');
	if (handle.includes('s')) edges.push('bottom');
	return edges;
}

export const HANDLE_CURSORS: Record<Handle, string> = {
	nw: 'nwse-resize',
	n: 'ns-resize',
	ne: 'nesw-resize',
	e: 'ew-resize',
	se: 'nwse-resize',
	s: 'ns-resize',
	sw: 'nesw-resize',
	w: 'ew-resize',
};

let idCounter = 0;
function newId(): string {
	idCounter += 1;
	return `frame-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultFrameImage(
	source: Pick<FrameImage, 'dataUrl' | 'naturalWidth' | 'naturalHeight'>
): FrameImage {
	return { ...source, zoom: 1, ox: 0.5, oy: 0.5 };
}

/** A new frame filling slide `slideIndex`, inset by the gap on every side. */
export function frameFillingSlide(
	slideIndex: number,
	image: FrameImage | null,
	gapX: number,
	gapY: number
): FrameRect {
	return {
		id: newId(),
		x: slideIndex + gapX,
		y: gapY,
		w: 1 - gapX * 2,
		h: 1 - gapY * 2,
		image,
	};
}

export function frameAt(x: number, y: number, w: number, h: number, image: FrameImage | null) {
	return { id: newId(), x, y, w, h, image };
}

export function edgePosition(frame: FrameRect, edge: Edge): number {
	switch (edge) {
		case 'left':
			return frame.x;
		case 'right':
			return frame.x + frame.w;
		case 'top':
			return frame.y;
		case 'bottom':
			return frame.y + frame.h;
	}
}

const isHorizontalEdge = (edge: Edge) => edge === 'left' || edge === 'right';

interface EdgeRef {
	id: string;
	edge: Edge;
}

/**
 * Every edge glued to the given one, transitively.
 *
 * Two edges are glued when they face each other exactly one gap apart (or are flush). Only
 * *opposing* edges glue — two frames whose right edges merely happen to line up are not
 * dragged together, which would be surprising.
 */
export function gluedEdges(
	frames: FrameRect[],
	startId: string,
	startEdge: Edge,
	gap: number,
	epsilon: number
): EdgeRef[] {
	const queue: EdgeRef[] = [{ id: startId, edge: startEdge }];
	const seen = new Set<string>();
	const out: EdgeRef[] = [];

	while (queue.length > 0) {
		const current = queue.pop()!;
		const token = `${current.id}:${current.edge}`;
		if (seen.has(token)) continue;
		seen.add(token);
		out.push(current);

		const frame = frames.find((f) => f.id === current.id);
		if (!frame) continue;
		const position = edgePosition(frame, current.edge);

		// The edge that would face this one, and where it would sit.
		const facing: { edge: Edge; at: number }[] =
			current.edge === 'right'
				? [
						{ edge: 'left', at: position + gap },
						{ edge: 'left', at: position },
					]
				: current.edge === 'left'
					? [
							{ edge: 'right', at: position - gap },
							{ edge: 'right', at: position },
						]
					: current.edge === 'bottom'
						? [
								{ edge: 'top', at: position + gap },
								{ edge: 'top', at: position },
							]
						: [
								{ edge: 'bottom', at: position - gap },
								{ edge: 'bottom', at: position },
							];

		for (const other of frames) {
			if (other.id === current.id) continue;
			for (const candidate of facing) {
				if (Math.abs(edgePosition(other, candidate.edge) - candidate.at) < epsilon) {
					queue.push({ id: other.id, edge: candidate.edge });
				}
			}
		}
	}
	return out;
}

/**
 * Move a set of glued edges by the same delta, so the gaps between them are preserved exactly.
 * The delta is clamped so no frame in the set collapses below the minimum size.
 */
export function moveEdges(
	frames: FrameRect[],
	refs: EdgeRef[],
	delta: number,
	minSize: number
): FrameRect[] {
	let low = -Infinity;
	let high = Infinity;

	for (const ref of refs) {
		const frame = frames.find((f) => f.id === ref.id);
		if (!frame) continue;
		const size = isHorizontalEdge(ref.edge) ? frame.w : frame.h;
		if (ref.edge === 'right' || ref.edge === 'bottom') {
			low = Math.max(low, minSize - size); // shrinking: delta can't take it below min
		} else {
			high = Math.min(high, size - minSize); // growing the start edge shrinks the frame
		}
	}

	const applied = Math.min(Math.max(delta, low), high);

	return frames.map((frame) => {
		const mine = refs.filter((r) => r.id === frame.id);
		if (mine.length === 0) return frame;
		const next = { ...frame };
		for (const ref of mine) {
			switch (ref.edge) {
				case 'left':
					next.x = frame.x + applied;
					next.w = frame.w - applied;
					break;
				case 'right':
					next.w = frame.w + applied;
					break;
				case 'top':
					next.y = frame.y + applied;
					next.h = frame.h - applied;
					break;
				case 'bottom':
					next.h = frame.h + applied;
					break;
			}
		}
		return next;
	});
}

/**
 * Junction markers: points where a vertical and a horizontal frame boundary cross with at
 * least three distinct frames around them. Purely a hint for the editor — the actual resize
 * comes from the corner handle sitting there, which drives both axes.
 */
export function junctionPoints(
	frames: FrameRect[],
	gap: { x: number; y: number },
	epsilon: { x: number; y: number }
): { x: number; y: number }[] {
	const points: { x: number; y: number }[] = [];

	for (const frame of frames) {
		for (const corner of [
			{ x: frame.x, y: frame.y },
			{ x: frame.x + frame.w, y: frame.y },
			{ x: frame.x, y: frame.y + frame.h },
			{ x: frame.x + frame.w, y: frame.y + frame.h },
		]) {
			const touching = frames.filter((other) => {
				const nearX =
					Math.abs(other.x - corner.x) < epsilon.x + gap.x ||
					Math.abs(other.x + other.w - corner.x) < epsilon.x + gap.x;
				const nearY =
					Math.abs(other.y - corner.y) < epsilon.y + gap.y ||
					Math.abs(other.y + other.h - corner.y) < epsilon.y + gap.y;
				return nearX && nearY;
			});
			if (touching.length < 3) continue;
			if (
				points.some(
					(p) => Math.abs(p.x - corner.x) < epsilon.x && Math.abs(p.y - corner.y) < epsilon.y
				)
			)
				continue;
			points.push(corner);
		}
	}
	return points;
}

/** Minimum frame size in strip units. */
export function minFrameSize(slideWidth: number, slideHeight: number) {
	return { x: MIN_FRAME_PX / slideWidth, y: MIN_FRAME_PX / slideHeight };
}
