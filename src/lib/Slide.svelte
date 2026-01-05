<script>
  import { marked } from 'marked';
  import {
    getBackgroundColor,
    getBackgroundImage,
    getBackgroundSize,
    getBackgroundPosition,
    getBackgroundRepeat,
  } from './utils/background.js';

  let {
    html = '',
    width = 1080,
    height = 1080,
    scale = 0.3,
    textAlign = 'center',
    verticalAlign = 'center',
    fontScale = 1,
    fontColor = '#ffffff',
    fontFamily = '',
    bgType = 'gradient',
    bgSolidColor = '#667eea',
    gradientColors = ['#667eea', '#764ba2', '#f093fb'],
    gradientPositions = ['40% 20%', '80% 0%', '0% 50%'],
    bgImage = null,
    bgImageFit = 'cover',
    padding = 60,
    corners = {
      topLeft: { enabled: false, type: 'text', text: '', image: null, size: 24, fontFamily: '' },
      topRight: { enabled: false, type: 'text', text: '', image: null, size: 24, fontFamily: '' },
      bottomLeft: { enabled: false, type: 'text', text: '', image: null, size: 24, fontFamily: '' },
      bottomRight: { enabled: false, type: 'text', text: '', image: null, size: 24, fontFamily: '' },
    },
    continuousBackground = false,
    slideIndex = 0,
    totalSlides = 1,
    lineHeight = 1.5,
    hyphenate = false,
    textLang = 'en',
  } = $props();

  // Derived values using Svelte 5 runes
  const verticalJustify = $derived(
    { top: 'flex-start', center: 'center', bottom: 'flex-end' }[verticalAlign] || 'center'
  );

  const backgroundColor = $derived(getBackgroundColor(bgType, bgSolidColor, gradientColors));

  const backgroundImageValue = $derived(getBackgroundImage(bgType, gradientColors, bgImage, gradientPositions));

  const backgroundSize = $derived(
    getBackgroundSize(bgType, continuousBackground, bgImageFit, totalSlides)
  );

  const backgroundPosition = $derived(
    getBackgroundPosition(bgType, continuousBackground, slideIndex, width, totalSlides)
  );

  const backgroundRepeat = $derived(
    getBackgroundRepeat(bgType, continuousBackground, bgImageFit)
  );

  const baseFontSize = $derived(36 * fontScale);

  const font = $derived(
    fontFamily ? `${fontFamily}, 'Segoe UI', system-ui, sans-serif` : `'Segoe UI', system-ui, sans-serif`
  );

  function getCornerFont(cornerFontFamily) {
    return cornerFontFamily
      ? `${cornerFontFamily}, 'Segoe UI', system-ui, sans-serif`
      : font;
  }

  function parseInline(text) {
    return text ? marked.parseInline(text) : '';
  }

</script>

<div
  class="slide"
  style:width="{width}px"
  style:height="{height}px"
  style:transform="scale({scale})"
  style:background-color={backgroundColor}
  style:background-image={backgroundImageValue}
  style:background-size={backgroundSize}
  style:background-position={backgroundPosition}
  style:background-repeat={backgroundRepeat}
  style:padding="{padding}px"
  style:--line-height={lineHeight}
  style:--vertical-align={verticalJustify}
>
  <!-- Top corners row (always rendered for grid layout) -->
  <div class="corner-row top">
    {#if corners.topLeft.enabled}
      <div
        class="corner-item left"
        style:color={fontColor}
        style:font-family={getCornerFont(corners.topLeft.fontFamily)}
        style:font-size="{corners.topLeft.size}px"
      >
        {#if corners.topLeft.type === 'image' && corners.topLeft.image}
          <img src={corners.topLeft.image} alt="" style:height="{corners.topLeft.size * 2}px" />
        {:else}
          {@html parseInline(corners.topLeft.text)}
        {/if}
      </div>
    {/if}
    {#if corners.topRight.enabled}
      <div
        class="corner-item right"
        style:color={fontColor}
        style:font-family={getCornerFont(corners.topRight.fontFamily)}
        style:font-size="{corners.topRight.size}px"
      >
        {#if corners.topRight.type === 'image' && corners.topRight.image}
          <img src={corners.topRight.image} alt="" style:height="{corners.topRight.size * 2}px" />
        {:else}
          {@html parseInline(corners.topRight.text)}
        {/if}
      </div>
    {/if}
  </div>

  <!-- Main content -->
  <div
    class="slide-content"
    lang={hyphenate ? textLang : undefined}
    style:text-align={textAlign}
    style:font-size="{baseFontSize}px"
    style:color={fontColor}
    style:font-family={font}
    style:hyphens={hyphenate ? 'auto' : 'none'}
    style:-webkit-hyphens={hyphenate ? 'auto' : 'none'}
  >
    {@html html}
  </div>

  <!-- Bottom corners row (always rendered for grid layout) -->
  <div class="corner-row bottom">
    {#if corners.bottomLeft.enabled}
      <div
        class="corner-item left"
        style:color={fontColor}
        style:font-family={getCornerFont(corners.bottomLeft.fontFamily)}
        style:font-size="{corners.bottomLeft.size}px"
      >
        {#if corners.bottomLeft.type === 'image' && corners.bottomLeft.image}
          <img src={corners.bottomLeft.image} alt="" style:height="{corners.bottomLeft.size * 2}px" />
        {:else}
          {@html parseInline(corners.bottomLeft.text)}
        {/if}
      </div>
    {/if}
    {#if corners.bottomRight.enabled}
      <div
        class="corner-item right"
        style:color={fontColor}
        style:font-family={getCornerFont(corners.bottomRight.fontFamily)}
        style:font-size="{corners.bottomRight.size}px"
      >
        {#if corners.bottomRight.type === 'image' && corners.bottomRight.image}
          <img src={corners.bottomRight.image} alt="" style:height="{corners.bottomRight.size * 2}px" />
        {:else}
          {@html parseInline(corners.bottomRight.text)}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .slide {
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
    margin: 0 0 0.5em;
  }

  .slide-content :global(ul) {
    font-size: 0.9em;
    margin: 0.5emi 0;
    padding-left: 1.5em;
    max-width: 90%;
    list-style-position: outside;
    list-style-type: disc;
  }

  .slide-content :global(ol) {
    font-size: 0.9em;
    margin: 0.5emi 0;
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

  .slide-content :global(strong) { font-weight: 700; }
  .slide-content :global(em) { font-style: italic; }

  .slide-content :global(blockquote) {
    border-left: 4px solid rgba(255, 255, 255, 0.5);
    padding-left: 0.7em;
    margin: 0.5em 0;
    font-style: italic;
  }

  .corner-item :global(strong) { font-weight: 700; }
  .corner-item :global(em) { font-style: italic; }
</style>
