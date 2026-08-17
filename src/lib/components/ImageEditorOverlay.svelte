<script lang="ts">
	import { SNAP_PX } from '$lib/utils/constants';
	import { startPointerDrag } from '$lib/utils/drag';
	import {
		HANDLES,
		HANDLE_CURSORS,
		gluedEdges,
		handleEdges,
		junctionPoints,
		minFrameSize,
		moveEdges,
		type Handle,
	} from '$lib/utils/frames';
	import {
		clamp,
		frameImageBox,
		normalImageHeight,
		panFrameImage,
		zoomFrameImage,
	} from '$lib/utils/imageFit';
	import { resolveSnap, snapCandidates } from '$lib/utils/snap';
	import ImageToolbar from './ImageToolbar.svelte';
	import type { SlideImagesStore } from '$lib/stores/slideImages.svelte';
	import type { DeckImages, FrameRect, NormalImage, Settings } from '$lib/types';

	/**
	 * Every editing affordance lives here rather than inside Slide.svelte, and this component is
	 * only ever mounted in the preview. That is what keeps the hidden export copy free of
	 * handles and guides by construction.
	 *
	 * It spans the ENTIRE strip rather than one slide, because images do too — one overlay means
	 * an image straddling a slide boundary is a single draggable object, not two halves.
	 * Positions are percentages of the strip so they need no zoom arithmetic, while handle
	 * *sizes* stay in screen px and stay grabbable at 15% zoom.
	 */
	let {
		images,
		settings,
		store,
		documentId,
		slideCount,
		slideWidth,
		slideHeight,
		zoom,
		onDropOnFrame,
	}: {
		images: DeckImages;
		settings: Settings;
		store: SlideImagesStore;
		documentId: string;
		slideCount: number;
		/** Base slide size in px. */
		slideWidth: number;
		slideHeight: number;
		zoom: number;
		onDropOnFrame: (frameId: string, files: File[]) => void;
	} = $props();

	let guides = $state<{ x: number[]; y: number[] }>({ x: [], y: [] });
	let readout = $state<string | null>(null);
	let dropTarget = $state<string | null>(null);

	const selection = $derived(store.selection);
	const selectedNormalId = $derived(selection?.kind === 'normal' ? selection.id : null);
	const selectedFrameId = $derived(selection?.kind === 'frame' ? selection.id : null);
	const selectedFrame = $derived(images.frames.find((f) => f.id === selectedFrameId));

	// Screen px -> strip units.
	const perPixelX = $derived(1 / (slideWidth * zoom));
	const perPixelY = $derived(1 / (slideHeight * zoom));
	const thresholdX = $derived(SNAP_PX * perPixelX);
	const thresholdY = $derived(SNAP_PX * perPixelY);

	// Geometric tolerance for "these edges are touching": 2 base px, independent of zoom.
	const epsX = $derived(2 / slideWidth);
	const epsY = $derived(2 / slideHeight);

	// Percent of the strip, for CSS positioning.
	const pctX = (x: number) => (x / slideCount) * 100;
	const pctW = (w: number) => (w / slideCount) * 100;

	const gapX = $derived(settings.frameGap / slideWidth);
	const gapY = $derived(settings.frameGap / slideHeight);
	const minSize = $derived(minFrameSize(slideWidth, slideHeight));

	const heightOf = (image: NormalImage) => normalImageHeight(image, slideWidth, slideHeight);

	const junctions = $derived(
		junctionPoints(images.frames, { x: gapX, y: gapY }, { x: epsX, y: epsY })
	);

	function candidates(axis: 'x' | 'y', excludeId?: string) {
		return snapCandidates(axis, {
			slideCount,
			inset:
				axis === 'x' ? settings.slidePadding / slideWidth : settings.slidePadding / slideHeight,
			gap: axis === 'x' ? gapX : gapY,
			frames: images.frames,
			normal: images.normal,
			normalHeight: heightOf,
			excludeId,
		});
	}

	function frameOf(list: FrameRect[], id: string): FrameRect | undefined {
		return list.find((f) => f.id === id);
	}

	/** Handle offsets as inline styles, so no dynamically-named CSS classes are needed. */
	function handleStyle(handle: Handle): string {
		const parts: string[] = [];
		if (handle.includes('w')) parts.push('left:-5px');
		else if (handle.includes('e')) parts.push('right:-5px');
		else parts.push('left:50%', 'margin-left:-4.5px');
		if (handle.includes('n')) parts.push('top:-5px');
		else if (handle.includes('s')) parts.push('bottom:-5px');
		else parts.push('top:50%', 'margin-top:-4.5px');
		return parts.join(';');
	}

	// --- free images ---

	function startMoveNormal(event: PointerEvent, image: NormalImage): void {
		event.stopPropagation();
		store.selection = { kind: 'normal', id: image.id };
		store.beginHistory(documentId);

		// Snapshot at pointerdown; every move recomputes from this, never from the live value.
		const origin = { x: image.x, y: image.y };
		const h = heightOf(image);
		const cx = candidates('x', image.id);
		const cy = candidates('y', image.id);

		startPointerDrag(event, {
			onMove: (delta, e) => {
				let dx = delta.x * perPixelX;
				let dy = delta.y * perPixelY;
				if (e.shiftKey) {
					if (Math.abs(delta.x) > Math.abs(delta.y)) dy = 0;
					else dx = 0;
				}

				let x = origin.x + dx;
				let y = origin.y + dy;
				const next: { x: number[]; y: number[] } = { x: [], y: [] };

				if (!e.altKey) {
					const sx = resolveSnap([x, x + image.w / 2, x + image.w], cx, thresholdX);
					if (sx) {
						x += sx.delta;
						next.x = sx.guides;
					}
					const sy = resolveSnap([y, y + h / 2, y + h], cy, thresholdY);
					if (sy) {
						y += sy.delta;
						next.y = sy.guides;
					}
				}

				// Partly outside is allowed (and clipped), but an image can never be lost entirely.
				store.updateNormal(documentId, image.id, {
					x: clamp(x, -image.w * 0.9, slideCount - image.w * 0.1),
					y: clamp(y, -h * 0.9, 1 - h * 0.1),
				});
				guides = next;
			},
			onEnd: () => {
				guides = { x: [], y: [] };
			},
		});
	}

	/** Free images keep their aspect ratio, so only the corners resize them. */
	function startResizeNormal(event: PointerEvent, image: NormalImage, handle: Handle): void {
		event.stopPropagation();
		store.selection = { kind: 'normal', id: image.id };
		store.beginHistory(documentId);

		const origin = { x: image.x, y: image.y, w: image.w, h: heightOf(image) };
		// The opposite corner stays pinned.
		const anchor = {
			x: handle.includes('w') ? origin.x + origin.w : origin.x,
			y: handle.includes('n') ? origin.y + origin.h : origin.y,
		};
		const aspect = image.naturalWidth / image.naturalHeight;

		startPointerDrag(event, {
			onMove: (delta) => {
				const signed = handle.includes('w') ? -delta.x : delta.x;
				const w = Math.max(minSize.x, origin.w + signed * perPixelX);
				const h = (w * slideWidth) / aspect / slideHeight;
				store.updateNormal(documentId, image.id, {
					w,
					x: handle.includes('w') ? anchor.x - w : anchor.x,
					y: handle.includes('n') ? anchor.y - h : anchor.y,
				});
				readout = `${Math.round(w * slideWidth)}×${Math.round(h * slideHeight)}`;
			},
			onEnd: () => {
				readout = null;
			},
		});
	}

	// --- frames ---

	function startMoveFrame(event: PointerEvent, frame: FrameRect): void {
		event.stopPropagation();
		store.selection = { kind: 'frame', id: frame.id };
		store.beginHistory(documentId);

		const origin = { x: frame.x, y: frame.y, w: frame.w, h: frame.h };
		const cx = candidates('x', frame.id);
		const cy = candidates('y', frame.id);

		startPointerDrag(event, {
			onMove: (delta, e) => {
				let dx = delta.x * perPixelX;
				let dy = delta.y * perPixelY;
				if (e.shiftKey) {
					if (Math.abs(delta.x) > Math.abs(delta.y)) dy = 0;
					else dx = 0;
				}

				let x = origin.x + dx;
				let y = origin.y + dy;
				const next: { x: number[]; y: number[] } = { x: [], y: [] };

				if (!e.altKey) {
					const sx = resolveSnap([x, x + origin.w / 2, x + origin.w], cx, thresholdX);
					if (sx) {
						x += sx.delta;
						next.x = sx.guides;
					}
					const sy = resolveSnap([y, y + origin.h / 2, y + origin.h], cy, thresholdY);
					if (sy) {
						y += sy.delta;
						next.y = sy.guides;
					}
				}

				store.updateFrame(documentId, frame.id, { x, y });
				guides = next;
			},
			onEnd: () => {
				guides = { x: [], y: [] };
			},
		});
	}

	/**
	 * Resize a frame from any of its eight handles.
	 *
	 * Each edge carries every edge glued to it across the gap, so neighbours follow and the gap
	 * between them never changes width. A corner handle drives one horizontal and one vertical
	 * edge at once — which is what makes the corner where three frames meet resize all three,
	 * while a lone frame just gets smaller and leaves the rest of the slide empty.
	 */
	function startResizeFrame(event: PointerEvent, frame: FrameRect, handle: Handle): void {
		event.stopPropagation();
		store.selection = { kind: 'frame', id: frame.id };
		store.beginHistory(documentId);

		const snapshot = images.frames.map((f) => ({ ...f }));
		const origin = { ...frame };
		const edges = handleEdges(handle);
		const horizontal = edges.find((e) => e === 'left' || e === 'right');
		const vertical = edges.find((e) => e === 'top' || e === 'bottom');

		const refsX = horizontal ? gluedEdges(snapshot, frame.id, horizontal, gapX, epsX) : [];
		const refsY = vertical ? gluedEdges(snapshot, frame.id, vertical, gapY, epsY) : [];

		const cx = candidates('x', frame.id);
		const cy = candidates('y', frame.id);

		startPointerDrag(event, {
			onMove: (delta, e) => {
				let dx = horizontal ? delta.x * perPixelX : 0;
				let dy = vertical ? delta.y * perPixelY : 0;
				const next: { x: number[]; y: number[] } = { x: [], y: [] };

				if (!e.altKey) {
					if (horizontal) {
						const base = horizontal === 'left' ? origin.x : origin.x + origin.w;
						const snap = resolveSnap([base + dx], cx, thresholdX);
						if (snap) {
							dx += snap.delta;
							next.x = snap.guides;
						}
					}
					if (vertical) {
						const base = vertical === 'top' ? origin.y : origin.y + origin.h;
						const snap = resolveSnap([base + dy], cy, thresholdY);
						if (snap) {
							dy += snap.delta;
							next.y = snap.guides;
						}
					}
				}

				let result = snapshot;
				if (refsX.length > 0) result = moveEdges(result, refsX, dx, minSize.x);
				if (refsY.length > 0) result = moveEdges(result, refsY, dy, minSize.y);
				store.setFrames(documentId, result);

				const current = frameOf(result, frame.id);
				if (current) {
					readout = `${Math.round(current.w * slideWidth)}×${Math.round(current.h * slideHeight)}`;
				}
				guides = next;
			},
			onEnd: () => {
				guides = { x: [], y: [] };
				readout = null;
			},
		});
	}

	/** InDesign-style content grabber: drag the donut to pan the bitmap, drag anywhere else on
	 * the frame to move the frame itself. */
	function startPan(event: PointerEvent, frame: FrameRect): void {
		event.stopPropagation();
		store.selection = { kind: 'frame', id: frame.id };
		const image = frame.image;
		if (!image) return;
		store.beginHistory(documentId);

		const fw = frame.w * slideWidth;
		const fh = frame.h * slideHeight;
		const box = frameImageBox(image, fw, fh);
		// Overflow in screen px, matching the delta's units — panning is scale-invariant.
		const overflow = { x: (box.width - fw) * zoom, y: (box.height - fh) * zoom };
		const origin = { ox: image.ox, oy: image.oy };

		startPointerDrag(event, {
			onMove: (delta) => {
				store.updateFrameImage(documentId, frame.id, panFrameImage(origin, overflow, delta));
			},
		});
	}

	function handleWheel(event: WheelEvent, frame: FrameRect): void {
		// Only claim the wheel when this frame is the active target, so the preview strip still
		// scrolls normally the rest of the time.
		if (!frame.image) return;
		if (selectedFrameId !== frame.id && !event.ctrlKey) return;
		event.preventDefault();

		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const next = zoomFrameImage(
			frame.image,
			frame.w * slideWidth,
			frame.h * slideHeight,
			event.deltaY < 0 ? 1.1 : 1 / 1.1,
			{ x: (event.clientX - bounds.left) / zoom, y: (event.clientY - bounds.top) / zoom }
		);
		store.updateFrameImage(documentId, frame.id, { zoom: next.zoom, ox: next.ox, oy: next.oy });
	}

	function zoomSelectedFrame(factor: number): void {
		if (!selectedFrame?.image) return;
		store.beginHistory(documentId);
		const next = zoomFrameImage(
			selectedFrame.image,
			selectedFrame.w * slideWidth,
			selectedFrame.h * slideHeight,
			factor
		);
		store.updateFrameImage(documentId, selectedFrame.id, {
			zoom: next.zoom,
			ox: next.ox,
			oy: next.oy,
		});
	}

	// --- dropping onto an existing frame replaces its image ---

	function handleFrameDragOver(event: DragEvent, frame: FrameRect): void {
		if (!event.dataTransfer?.types.includes('Files')) return;
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = 'copy';
		dropTarget = frame.id;
	}

	function handleFrameDrop(event: DragEvent, frame: FrameRect): void {
		dropTarget = null;
		const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
			f.type.startsWith('image/')
		);
		if (files.length === 0) return;
		event.preventDefault();
		event.stopPropagation();
		onDropOnFrame(frame.id, files);
	}

	// --- toolbar anchor ---

	const anchor = $derived.by(() => {
		if (selectedNormalId) {
			const image = images.normal.find((n) => n.id === selectedNormalId);
			if (!image) return null;
			return { kind: 'normal' as const, x: image.x, y: image.y, bottom: image.y + heightOf(image) };
		}
		if (selectedFrame) {
			return {
				kind: 'frame' as const,
				x: selectedFrame.x,
				y: selectedFrame.y,
				bottom: selectedFrame.y + selectedFrame.h,
			};
		}
		return null;
	});
</script>

<div class="overlay">
	<!-- Frames -->
	{#each images.frames as frame (frame.id)}
		{@const selected = selectedFrameId === frame.id}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="box frame"
			class:selected
			class:drop-target={dropTarget === frame.id}
			style:left="{pctX(frame.x)}%"
			style:top="{frame.y * 100}%"
			style:width="{pctW(frame.w)}%"
			style:height="{frame.h * 100}%"
			onpointerdown={(e) => startMoveFrame(e, frame)}
			onwheel={(e) => handleWheel(e, frame)}
			ondragover={(e) => handleFrameDragOver(e, frame)}
			ondragleave={() => (dropTarget = null)}
			ondrop={(e) => handleFrameDrop(e, frame)}
		>
			{#if selected && frame.image}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="grabber"
					title="Drag to pan the image inside the frame"
					onpointerdown={(e) => startPan(e, frame)}
				></div>
			{/if}

			{#if selected}
				{#each HANDLES as handle (handle)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="handle"
						style="{handleStyle(handle)};cursor:{HANDLE_CURSORS[handle]}"
						onpointerdown={(e) => startResizeFrame(e, frame, handle)}
					></div>
				{/each}
			{/if}
		</div>
	{/each}

	<!-- Free images -->
	{#each images.normal as image (image.id)}
		{@const h = heightOf(image)}
		{@const selected = selectedNormalId === image.id}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="box move"
			class:selected
			style:left="{pctX(image.x)}%"
			style:top="{image.y * 100}%"
			style:width="{pctW(image.w)}%"
			style:height="{h * 100}%"
			onpointerdown={(e) => startMoveNormal(e, image)}
		>
			{#if selected}
				{#each ['nw', 'ne', 'se', 'sw'] as const as handle (handle)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="handle"
						style="{handleStyle(handle)};cursor:{HANDLE_CURSORS[handle]}"
						onpointerdown={(e) => startResizeNormal(e, image, handle)}
					></div>
				{/each}
			{/if}
		</div>
	{/each}

	<!-- Markers where three or more frames meet; the corner handle there resizes them all -->
	{#each junctions as point, i (i)}
		<div class="junction" style:left="{pctX(point.x)}%" style:top="{point.y * 100}%"></div>
	{/each}

	{#each guides.x as position (position)}
		<div class="guide guide-x" style:left="{pctX(position)}%"></div>
	{/each}
	{#each guides.y as position (position)}
		<div class="guide guide-y" style:top="{position * 100}%"></div>
	{/each}

	{#if readout}
		<div class="readout">{readout}</div>
	{/if}

	{#if anchor}
		{@const near = anchor.y < 0.12}
		<ImageToolbar
			kind={anchor.kind}
			left={pctX(anchor.x)}
			top={clamp(near ? anchor.bottom : anchor.y, 0.05, 0.95) * 100}
			below={near}
			zoom={selectedFrame?.image?.zoom}
			onToggleMode={() => {
				if (anchor.kind === 'normal' && selectedNormalId) {
					const image = images.normal.find((n) => n.id === selectedNormalId);
					if (image) store.normalToFrame(documentId, selectedNormalId, heightOf(image));
				} else if (selectedFrameId) {
					store.frameToNormal(documentId, selectedFrameId);
				}
			}}
			onDelete={() => {
				if (anchor.kind === 'normal' && selectedNormalId) {
					store.removeNormal(documentId, selectedNormalId);
				} else if (selectedFrameId) {
					store.deleteFrame(documentId, selectedFrameId);
				}
			}}
			onReorder={(delta) => {
				if (selectedNormalId) store.reorderNormal(documentId, selectedNormalId, delta);
			}}
			onZoom={zoomSelectedFrame}
			onResetFit={() => {
				if (selectedFrameId) {
					store.updateFrameImage(documentId, selectedFrameId, { zoom: 1, ox: 0.5, oy: 0.5 });
				}
			}}
		/>
	{/if}
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 20;
		/* Only the affordances themselves take pointer events, so clicking bare slide still
		   reaches the wrapper underneath and deselects. */
		pointer-events: none;
	}

	.box {
		position: absolute;
		pointer-events: auto;
		box-sizing: border-box;
	}

	.frame,
	.move {
		cursor: move;
	}

	.box.selected {
		outline: 1px solid var(--ring);
	}

	.frame.drop-target {
		background: color-mix(in oklch, var(--ring) 35%, transparent);
		outline: 2px solid var(--ring);
	}

	/* Handle sizes are screen px, never scaled by the preview zoom — that is the whole reason
	   the chrome lives out here instead of inside the slide. */
	.handle {
		position: absolute;
		width: 9px;
		height: 9px;
		border-radius: 2px;
		background: var(--background);
		border: 1px solid var(--ring);
		pointer-events: auto;
	}

	.grabber {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 22px;
		height: 22px;
		margin: -11px 0 0 -11px;
		border-radius: 50%;
		border: 3px solid var(--ring);
		background: color-mix(in oklch, var(--background) 55%, transparent);
		cursor: grab;
		pointer-events: auto;
	}

	.grabber:active {
		cursor: grabbing;
	}

	.junction {
		position: absolute;
		width: 7px;
		height: 7px;
		margin: -3.5px 0 0 -3.5px;
		border-radius: 50%;
		background: var(--ring);
		opacity: 0.6;
		pointer-events: none;
	}

	.guide {
		position: absolute;
		background: var(--ring);
		pointer-events: none;
	}

	.guide-x {
		top: -14px;
		bottom: -14px;
		width: 1px;
	}

	.guide-y {
		left: -14px;
		right: -14px;
		height: 1px;
	}

	.readout {
		position: absolute;
		right: 4px;
		bottom: 4px;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		background: var(--background);
		color: var(--foreground);
		pointer-events: none;
	}
</style>
