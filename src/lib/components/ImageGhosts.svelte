<script lang="ts">
	import { frameImageBox, normalImageHeight } from '$lib/utils/imageFit';
	import type { DeckImages } from '$lib/types';

	/**
	 * Faded full-size copies of every image, drawn *behind* the slide strip.
	 *
	 * The slides are opaque, so this layer is invisible wherever an image is actually on-canvas
	 * — it only shows the parts hanging off the top, bottom or ends of the strip, which is
	 * exactly the content that will be cropped away on export. Standard canvas-editor behaviour
	 * (Figma, Canva): you can always see what you are about to lose while you drag.
	 */
	let {
		images,
		slideCount,
		slideWidth,
		slideHeight,
	}: {
		images: DeckImages;
		slideCount: number;
		slideWidth: number;
		slideHeight: number;
	} = $props();

	const pctX = (x: number) => (x / slideCount) * 100;
	const pctW = (w: number) => (w / slideCount) * 100;
</script>

<div class="ghosts" aria-hidden="true">
	{#each images.frames as frame (frame.id)}
		<div
			class="ghost-frame"
			style:left="{pctX(frame.x)}%"
			style:top="{frame.y * 100}%"
			style:width="{pctW(frame.w)}%"
			style:height="{frame.h * 100}%"
		>
			{#if frame.image}
				{@const box = frameImageBox(frame.image, frame.w * slideWidth, frame.h * slideHeight)}
				<img
					src={frame.image.dataUrl}
					alt=""
					style:left="{(box.left / (frame.w * slideWidth)) * 100}%"
					style:top="{(box.top / (frame.h * slideHeight)) * 100}%"
					style:width="{(box.width / (frame.w * slideWidth)) * 100}%"
					style:height="{(box.height / (frame.h * slideHeight)) * 100}%"
				/>
			{/if}
		</div>
	{/each}

	{#each images.normal as image (image.id)}
		<img
			class="ghost-image"
			src={image.dataUrl}
			alt=""
			style:left="{pctX(image.x)}%"
			style:top="{image.y * 100}%"
			style:width="{pctW(image.w)}%"
			style:height="{normalImageHeight(image, slideWidth, slideHeight) * 100}%"
		/>
	{/each}
</div>

<style>
	.ghosts {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		opacity: 0.28;
		filter: grayscale(0.35);
	}

	.ghost-frame {
		position: absolute;
		overflow: hidden;
	}

	.ghost-frame img,
	.ghost-image {
		position: absolute;
		display: block;
		max-width: none;
	}
</style>
