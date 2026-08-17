export interface DragDelta {
	x: number;
	y: number;
}

export interface DragHandlers {
	onMove: (delta: DragDelta, event: PointerEvent) => void;
	onEnd?: (delta: DragDelta, event: PointerEvent) => void;
}

/**
 * Pointer drag with capture, reporting the delta **from the pointerdown origin** rather than
 * per-move increments.
 *
 * That distinction matters: callers apply the delta to a snapshot taken at pointerdown, so
 * once a value hits a clamp and the pointer keeps moving, backing off immediately tracks the
 * cursor again. Accumulating increments instead makes the dragged thing drift away from the
 * pointer every time it bottoms out.
 */
export function startPointerDrag(event: PointerEvent, handlers: DragHandlers): void {
	const target = event.currentTarget as HTMLElement | null;
	if (!target) return;

	const startX = event.clientX;
	const startY = event.clientY;
	try {
		target.setPointerCapture(event.pointerId);
	} catch {
		// The pointer can already be gone (a very fast click, or a synthesized event). Capture is
		// an optimization for tracking outside the element, not a requirement — carry on without.
	}

	const delta = (e: PointerEvent): DragDelta => ({ x: e.clientX - startX, y: e.clientY - startY });

	const onMove = (e: PointerEvent) => handlers.onMove(delta(e), e);

	const onUp = (e: PointerEvent) => {
		target.removeEventListener('pointermove', onMove);
		target.removeEventListener('pointerup', onUp);
		target.removeEventListener('pointercancel', onUp);
		try {
			if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
		} catch {
			// Capture may never have been taken; releasing is best-effort.
		}
		handlers.onEnd?.(delta(e), e);
	};

	target.addEventListener('pointermove', onMove);
	target.addEventListener('pointerup', onUp);
	target.addEventListener('pointercancel', onUp);
}
