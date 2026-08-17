<script lang="ts">
	import { marked } from 'marked';
	import {
		getBackgroundColor,
		getBackgroundImage,
		getBackgroundSize,
		getBackgroundPosition,
		getBackgroundRepeat,
	} from './utils/background';
	import { CORNER_ROWS } from './utils/constants';
	import SlideImages from './components/SlideImages.svelte';
	import type { Settings, RenderContext, DeckImages } from '$lib/types';

	let {
		html = '',
		settings,
		render,
		images,
		showPlaceholders = false,
	}: {
		html?: string;
		settings: Settings;
		render: RenderContext;
		images?: DeckImages;
		showPlaceholders?: boolean;
	} = $props();

	// Every px-valued setting is authored in the 1080-wide base design space and scaled here,
	// so the preview and the export copy stay pixel-proportional without either call site
	// doing arithmetic. See RenderContext.
	const gs = $derived(render.geometryScale);
	const width = $derived(render.width * gs);
	const height = $derived(render.height * gs);
	const padding = $derived(settings.slidePadding * gs);
	const baseFontSize = $derived(36 * settings.fontScale * gs);
	const textBgPadding = $derived(settings.textBgPadding * gs);

	// Derived values using Svelte 5 runes
	const verticalJustify = $derived(
		{ top: 'flex-start', center: 'center', bottom: 'flex-end' }[settings.verticalAlign] || 'center'
	);

	const backgroundColor = $derived(
		getBackgroundColor(settings.bgType, settings.bgSolidColor, settings.gradientColors)
	);

	const backgroundImageValue = $derived(
		getBackgroundImage(
			settings.bgType,
			settings.gradientColors,
			settings.bgImage,
			settings.gradientPositions
		)
	);

	const backgroundSize = $derived(
		getBackgroundSize(
			settings.bgType,
			settings.continuousBackground,
			settings.bgImageFit,
			render.totalSlides
		)
	);

	// NOTE: this offsets a seamless background by whole slide widths, so it needs the *scaled*
	// width — passing the base width would break continuous backgrounds at 2x/3x export.
	const backgroundPosition = $derived(
		getBackgroundPosition(
			settings.bgType,
			settings.continuousBackground,
			render.slideIndex,
			width,
			render.totalSlides
		)
	);

	const backgroundRepeat = $derived(
		getBackgroundRepeat(settings.bgType, settings.continuousBackground, settings.bgImageFit)
	);

	const processedHtml = $derived(
		settings.textBgEnabled
			? html
					.replace(/<(h[1-6]|p|li)(\s[^>]*)?>/g, '<$1$2><span class="text-bg-inner">')
					.replace(/<\/(h[1-6]|p|li)>/g, '</span></$1>')
			: html
	);

	const font = $derived(
		settings.fontFamily
			? `${settings.fontFamily}, 'Segoe UI', system-ui, sans-serif`
			: `'Segoe UI', system-ui, sans-serif`
	);

	function getCornerFont(cornerFontFamily: string): string {
		return cornerFontFamily ? `${cornerFontFamily}, 'Segoe UI', system-ui, sans-serif` : font;
	}

	function parseInline(text: string): string {
		return text ? (marked.parseInline(text) as string) : '';
	}
</script>

{#snippet cornerRow(position: 'top' | 'bottom')}
	<div class="corner-row {position}">
		{#each CORNER_ROWS[position] as key (key)}
			{@const corner = settings.corners[key]}
			{#if corner.enabled}
				<div
					class="corner-item {key.endsWith('Left') ? 'left' : 'right'}"
					style:color={settings.fontColor}
					style:font-family={getCornerFont(corner.fontFamily)}
					style:font-size="{corner.size * gs}px"
				>
					{#if corner.type === 'image' && corner.image}
						<img src={corner.image} alt="" style:height="{corner.size * gs * 2}px" />
					{:else}
						{@html parseInline(corner.text)}
					{/if}
				</div>
			{/if}
		{/each}
	</div>
{/snippet}

<div
	class="slide"
	style:width="{width}px"
	style:height="{height}px"
	style:transform="scale({render.scale})"
	style:background-color={backgroundColor}
	style:background-image={backgroundImageValue}
	style:background-size={backgroundSize}
	style:background-position={backgroundPosition}
	style:background-repeat={backgroundRepeat}
	style:padding="{padding}px"
	style:--line-height={settings.lineHeight}
	style:--vertical-align={verticalJustify}
>
	<!-- Top corners row (always rendered for grid layout) -->
	{@render cornerRow('top')}

	<!-- Main content -->
	{#if settings.textBgEnabled}
		<div
			class="slide-content slide-bg-layer"
			aria-hidden="true"
			lang={settings.hyphenate ? settings.textLang : undefined}
			style:text-align={settings.textAlign}
			style:font-size="{baseFontSize}px"
			style:font-family={font}
			style:hyphens={settings.hyphenate ? 'auto' : 'none'}
			style:-webkit-hyphens={settings.hyphenate ? 'auto' : 'none'}
			style:--text-bg-color={settings.textBgColor}
			style:--text-bg-padding="{textBgPadding}px"
		>
			{@html processedHtml}
		</div>
	{/if}
	<div
		class="slide-content"
		class:has-text-bg={settings.textBgEnabled}
		lang={settings.hyphenate ? settings.textLang : undefined}
		style:text-align={settings.textAlign}
		style:font-size="{baseFontSize}px"
		style:color={settings.fontColor}
		style:font-family={font}
		style:hyphens={settings.hyphenate ? 'auto' : 'none'}
		style:-webkit-hyphens={settings.hyphenate ? 'auto' : 'none'}
		style:--text-bg-color={settings.textBgColor}
		style:--text-bg-padding="{textBgPadding}px"
	>
		{@html processedHtml}
	</div>

	{#if images}
		<SlideImages
			{images}
			{settings}
			{width}
			{height}
			geometryScale={gs}
			slideIndex={render.slideIndex}
			{showPlaceholders}
		/>
	{/if}

	<!-- Bottom corners row (always rendered for grid layout) -->
	{@render cornerRow('bottom')}
</div>

<style>
	.slide {
		position: relative;
		display: grid;
		grid-template-rows: auto 1fr auto;
		box-sizing: border-box;
		overflow: hidden;
		transform-origin: top left;
	}

	.corner-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1em;
		z-index: 10;
	}

	.corner-row.bottom {
		align-items: flex-end;
	}

	.corner-item {
		font-weight: 500;
		line-height: 1.2;
		min-width: 0;
		flex-shrink: 1;
	}

	.corner-item.left {
		text-align: left;
	}

	.corner-item.right {
		text-align: right;
		margin-left: auto;
	}

	.corner-item img {
		display: block;
		width: auto;
		max-width: 100%;
		object-fit: contain;
	}

	.slide-content {
		width: 100%;
		min-height: 0;
		overflow: hidden;
		z-index: 1;
		align-self: var(--vertical-align, center);
		grid-row: 2;
		grid-column: 1;
	}

	.slide-content :global(h1) {
		font-size: 2em;
		font-weight: 700;
		margin: 0 0 0.4em;
		line-height: var(--line-height, 1.5);
	}

	.slide-content :global(h2) {
		font-size: 1.55em;
		font-weight: 600;
		margin: 0 0 0.4em;
		line-height: var(--line-height, 1.5);
	}

	.slide-content :global(h3) {
		font-size: 1.22em;
		font-weight: 600;
		margin: 0 0 0.4em;
		line-height: var(--line-height, 1.5);
	}

	.slide-content :global(p) {
		font-size: 1em;
		line-height: var(--line-height, 1.5);
		margin: 0 0 1em;
	}

	.slide-content :global(ul) {
		font-size: 0.9em;
		margin: 0.5em 0;
		padding-left: 1.5em;
		max-width: 90%;
		list-style-position: outside;
		list-style-type: disc;
	}

	.slide-content :global(ol) {
		font-size: 0.9em;
		margin: 0.5em 0;
		padding-left: 1.5em;
		max-width: 90%;
		list-style-position: outside;
		list-style-type: decimal;
	}

	.slide-content :global(li) {
		margin-bottom: 0.3em;
		line-height: var(--line-height, 1.5);
	}

	.slide-content :global(code) {
		background: rgba(0, 0, 0, 0.3);
		padding: 0.1em 0.3em;
		border-radius: 4px;
		font-family: 'Fira Code', 'Consolas', monospace;
		font-size: 0.9em;
	}

	.slide-content :global(pre) {
		background: rgba(0, 0, 0, 0.3);
		padding: 0.7em;
		border-radius: 8px;
		text-align: left;
		overflow-x: auto;
	}

	.slide-content :global(pre code) {
		background: none;
		padding: 0;
	}

	.slide-content :global(strong) {
		font-weight: 700;
	}
	.slide-content :global(em) {
		font-style: italic;
	}

	.slide-content :global(blockquote) {
		border-left: 4px solid rgba(255, 255, 255, 0.5);
		padding-left: 0.7em;
		margin: 0.5em 0;
		font-style: italic;
	}

	/* Background layer: behind, text invisible */
	.slide-bg-layer {
		color: transparent;
		pointer-events: none;
		z-index: 0;
		overflow: visible;
	}

	.slide-bg-layer :global(.text-bg-inner) {
		background-color: var(--text-bg-color);
		padding: var(--text-bg-padding);
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		text-box: trim-both cap alphabetic;
	}

	/* Text layer: same padding for layout match, no background */
	.slide-content.has-text-bg :global(.text-bg-inner) {
		padding: var(--text-bg-padding);
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		background: transparent;
		text-box: trim-both cap alphabetic;
	}

	.corner-item :global(strong) {
		font-weight: 700;
	}
	.corner-item :global(em) {
		font-style: italic;
	}
</style>
