<script lang="ts">
	import { frameImageBox, normalImageHeight } from '$lib/utils/imageFit';
	import { imageShadowCss } from '$lib/utils/shadow';
	import { borderColorCss } from '$lib/utils/color';
	import type { DeckImages, Settings } from '$lib/types';

	/**
	 * Purely presentational image layer, with zero editing chrome — all handles, guides and
	 * drop indicators live in ImageEditorOverlay instead. That split is what makes the hidden
	 * full-resolution export copy clean by construction rather than by remembering to strip
	 * things out.
	 *
	 * Images are positioned on the continuous strip and this component renders the window onto
	 * it belonging to one slide: everything shifts left by `slideIndex` slide widths and the
	 * slide's own `overflow: hidden` does the cropping. An image straddling a slide boundary is
	 * therefore drawn by both slides, each showing its own half — which is what makes a
	 * panorama across the carousel work, in the preview and in every exported PNG alike.
	 */
	let {
		images,
		settings,
		width,
		height,
		geometryScale,
		slideIndex,
		showPlaceholders = false,
	}: {
		images: DeckImages;
		settings: Settings;
		/** Scaled slide size in px. */
		width: number;
		height: number;
		geometryScale: number;
		slideIndex: number;
		/** Outline empty frames so they read as drop targets. Preview only — an export must not
		 * show editing affordances. */
		showPlaceholders?: boolean;
	} = $props();

	const radius = $derived(settings.frameRadius * geometryScale);
	const borderWidth = $derived(settings.frameBorderWidth * geometryScale);
	const borderColor = $derived(
		borderColorCss(settings.frameBorderColor, settings.frameBorderOpacity)
	);

	const shadow = $derived(
		imageShadowCss(settings.imageShadowSize, settings.imageShadowSoftness, geometryScale)
	);

	/** Strip units -> px within this slide's window. */
	const toLeft = (x: number) => (x - slideIndex) * width;

	function cellBorder(hasImage: boolean): string {
		if (hasImage) return `${borderWidth}px solid ${borderColor}`;
		return showPlaceholders ? `${borderWidth}px dashed ${borderColor}` : 'none';
	}
</script>

{#each images.frames as frame (frame.id)}
	{@const w = frame.w * width}
	{@const h = frame.h * height}
	<div
		class="frame"
		style:left="{toLeft(frame.x)}px"
		style:top="{frame.y * height}px"
		style:width="{w}px"
		style:height="{h}px"
		style:border-radius="{radius}px"
		style:border={cellBorder(frame.image !== null)}
	>
		{#if frame.image}
			{@const box = frameImageBox(frame.image, w, h)}
			<img
				src={frame.image.dataUrl}
				alt=""
				style:left="{box.left}px"
				style:top="{box.top}px"
				style:width="{box.width}px"
				style:height="{box.height}px"
			/>
		{/if}
	</div>
{/each}

{#each images.normal as image (image.id)}
	{@const h = normalImageHeight(image, width, height)}
	<img
		class="normal-image"
		src={image.dataUrl}
		alt=""
		style:left="{toLeft(image.x)}px"
		style:top="{image.y * height}px"
		style:width="{image.w * width}px"
		style:height="{h * height}px"
		style:box-shadow={shadow}
	/>
{/each}

<style>
	/* Sits above the text layer (z-index 1) but below the corner rows (z-index 10). */
	.frame {
		position: absolute;
		z-index: 5;
		overflow: hidden;
		box-sizing: border-box;
	}

	.frame img {
		position: absolute;
		display: block;
		max-width: none;
		/* Radius on the clipper alone is flaky for replaced elements in WebKit's foreignObject,
		   which is what html-to-image rasterizes through. Inheriting it costs nothing. */
		border-radius: inherit;
	}

	.normal-image {
		position: absolute;
		display: block;
		z-index: 5;
		max-width: none;
	}
</style>
