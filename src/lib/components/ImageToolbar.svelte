<script lang="ts">
	/**
	 * Floating actions for the current selection. Rendered inside ImageEditorOverlay, so it is
	 * preview-only and its sizes are screen px regardless of preview zoom.
	 */
	let {
		kind,
		left,
		top,
		below,
		zoom,
		onToggleMode,
		onDelete,
		onReorder,
		onZoom,
		onResetFit,
	}: {
		kind: 'normal' | 'frame';
		/** Anchor position as a percentage of the strip box. */
		left: number;
		top: number;
		/** Place the bar under the anchor instead of above it (selection near the top edge). */
		below: boolean;
		zoom?: number;
		onToggleMode: () => void;
		onDelete: () => void;
		onReorder?: (delta: number) => void;
		onZoom?: (factor: number) => void;
		onResetFit?: () => void;
	} = $props();
</script>

<div
	class="toolbar"
	class:below
	role="toolbar"
	tabindex="-1"
	aria-label="Image actions"
	style:left="{left}%"
	style:top="{top}%"
	onpointerdown={(e) => e.stopPropagation()}
>
	<button
		title={kind === 'normal' ? 'Convert to frame (F)' : 'Convert to free image (F)'}
		onclick={onToggleMode}
	>
		{kind === 'normal' ? 'Frame' : 'Free'}
	</button>

	{#if kind === 'frame'}
		<span class="sep"></span>
		<button title="Zoom out (-)" onclick={() => onZoom?.(1 / 1.1)}>−</button>
		<span class="value">{Math.round((zoom ?? 1) * 100)}%</span>
		<button title="Zoom in (+)" onclick={() => onZoom?.(1.1)}>+</button>
		<button title="Reset fit (0)" onclick={onResetFit}>Fit</button>
	{:else}
		<span class="sep"></span>
		<button title="Send backward ([)" onclick={() => onReorder?.(-1)}>↓</button>
		<button title="Bring forward (])" onclick={() => onReorder?.(1)}>↑</button>
	{/if}

	<span class="sep"></span>
	<button class="danger" title="Delete (Del)" onclick={onDelete}>×</button>
</div>

<style>
	.toolbar {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 2px;
		border-radius: 6px;
		background: var(--popover);
		color: var(--popover-foreground);
		border: 1px solid var(--border);
		box-shadow: 0 2px 8px rgb(0 0 0 / 40%);
		transform: translateY(calc(-100% - 6px));
		pointer-events: auto;
		white-space: nowrap;
		z-index: 3;
	}

	.toolbar.below {
		transform: translateY(6px);
	}

	button {
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: inherit;
		font-size: 11px;
		line-height: 1;
		cursor: pointer;
	}

	button:hover {
		background: var(--accent);
	}

	button.danger:hover {
		background: var(--destructive);
		color: var(--primary-foreground);
	}

	.value {
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		min-width: 34px;
		text-align: center;
	}

	.sep {
		width: 1px;
		height: 14px;
		background: var(--border);
	}
</style>
