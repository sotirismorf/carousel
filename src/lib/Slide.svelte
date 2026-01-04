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
    bgImage = null,
    bgImageFit = 'cover',
    padding = 60,
    corners = {
      topLeft: { enabled: false, type: 'text', text: '', image: null, size: 24 },
      topRight: { enabled: false, type: 'text', text: '', image: null, size: 24 },
      bottomLeft: { enabled: false, type: 'text', text: '', image: null, size: 24 },
      bottomRight: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    },
    continuousBackground = false,
    slideIndex = 0,
    totalSlides = 1,
  } = $props();

  // Derived values using Svelte 5 runes
  const verticalJustify = $derived(
    { top: 'flex-start', center: 'center', bottom: 'flex-end' }[verticalAlign] || 'center'
  );

  const backgroundColor = $derived(getBackgroundColor(bgType, bgSolidColor, gradientColors));

  const backgroundImageValue = $derived(getBackgroundImage(bgType, gradientColors, bgImage));

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
  style:align-items={verticalJustify}
  style:padding="{padding}px"
>
  {#each ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as pos}
    {#if corners[pos].enabled}
      <div
        class="corner {pos}"
        style:color={fontColor}
        style:font-family={font}
        style:font-size="{corners[pos].size}px"
        style:top={pos.includes('top') ? `${padding}px` : 'auto'}
        style:bottom={pos.includes('bottom') ? `${padding}px` : 'auto'}
        style:left={pos.includes('Left') ? `${padding}px` : 'auto'}
        style:right={pos.includes('Right') ? `${padding}px` : 'auto'}
      >
        {#if corners[pos].type === 'image' && corners[pos].image}
          <img src={corners[pos].image} alt="" style:height="{corners[pos].size * 2}px" />
        {:else}
          {@html parseInline(corners[pos].text)}
        {/if}
      </div>
    {/if}
  {/each}

  <div
    class="slide-content"
    style:text-align={textAlign}
    style:font-size="{baseFontSize}px"
    style:color={fontColor}
    style:font-family={font}
  >
    {@html html}
  </div>
</div>

<style>
  .slide {
    position: relative;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
    transform-origin: top left;
  }

  .corner {
    position: absolute;
    font-weight: 500;
    z-index: 10;
    max-width: 35%;
    line-height: 1;
  }

  .corner img {
    display: block;
    width: auto;
    max-width: 100%;
    object-fit: contain;
  }

  .corner.topRight,
  .corner.bottomRight {
    text-align: right;
  }

  .slide-content {
    width: 100%;
    max-height: 100%;
    overflow: hidden;
  }

  .slide-content :global(h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 0 0 0.4em;
    line-height: 1.2;
  }

  .slide-content :global(h2) {
    font-size: 1.55em;
    font-weight: 600;
    margin: 0 0 0.4em;
    line-height: 1.3;
  }

  .slide-content :global(h3) {
    font-size: 1.22em;
    font-weight: 600;
    margin: 0 0 0.4em;
  }

  .slide-content :global(p) {
    font-size: 1em;
    line-height: 1.5;
    margin: 0 0 0.5em;
  }

  .slide-content :global(ul),
  .slide-content :global(ol) {
    font-size: 0.9em;
    margin: 0.5em auto;
    padding-left: 1.2em;
    max-width: 90%;
  }

  .slide-content :global(li) {
    margin-bottom: 0.3em;
    line-height: 1.4;
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

  .corner :global(strong) { font-weight: 700; }
  .corner :global(em) { font-style: italic; }
</style>
