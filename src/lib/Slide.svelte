<script>
  import { marked } from 'marked';

  export let html = '';
  export let width = 1080;
  export let height = 1080;
  export let scale = 0.3;
  export let textAlign = 'center';
  export let verticalAlign = 'center';
  export let fontScale = 1;
  export let fontColor = '#ffffff';
  export let fontFamily = '';
  export let gradientColor1 = '#667eea';
  export let gradientColor2 = '#764ba2';
  export let gradientDirection = 135;
  export let gradientType = 'linear';
  export let padding = 60;
  export let corners = {
    topLeft: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    topRight: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    bottomLeft: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    bottomRight: { enabled: false, type: 'text', text: '', image: null, size: 24 },
  };

  $: verticalJustify = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
  }[verticalAlign] || 'center';

  $: backgroundStyle = gradientType === 'linear'
    ? `linear-gradient(${gradientDirection}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`
    : `radial-gradient(circle, ${gradientColor1} 0%, ${gradientColor2} 100%)`;

  $: baseFontSize = 36 * fontScale;

  $: fontFamilyStyle = fontFamily
    ? `${fontFamily}, 'Segoe UI', system-ui, -apple-system, sans-serif`
    : `'Segoe UI', system-ui, -apple-system, sans-serif`;

  function parseCornerText(text) {
    if (!text) return '';
    return marked.parseInline(text);
  }
</script>

<div
  class="slide"
  style:width="{width}px"
  style:height="{height}px"
  style:transform="scale({scale})"
  style:background={backgroundStyle}
  style:align-items={verticalJustify}
  style:padding="{padding}px"
>
  {#if corners.topLeft.enabled}
    <div class="corner top-left" style:color={fontColor} style:font-family={fontFamilyStyle} style:font-size="{corners.topLeft.size}px">
      {#if corners.topLeft.type === 'image' && corners.topLeft.image}
        <img src={corners.topLeft.image} alt="" style:height="{corners.topLeft.size * 2}px" />
      {:else}
        {@html parseCornerText(corners.topLeft.text)}
      {/if}
    </div>
  {/if}

  {#if corners.topRight.enabled}
    <div class="corner top-right" style:color={fontColor} style:font-family={fontFamilyStyle} style:font-size="{corners.topRight.size}px">
      {#if corners.topRight.type === 'image' && corners.topRight.image}
        <img src={corners.topRight.image} alt="" style:height="{corners.topRight.size * 2}px" />
      {:else}
        {@html parseCornerText(corners.topRight.text)}
      {/if}
    </div>
  {/if}

  {#if corners.bottomLeft.enabled}
    <div class="corner bottom-left" style:color={fontColor} style:font-family={fontFamilyStyle} style:font-size="{corners.bottomLeft.size}px">
      {#if corners.bottomLeft.type === 'image' && corners.bottomLeft.image}
        <img src={corners.bottomLeft.image} alt="" style:height="{corners.bottomLeft.size * 2}px" />
      {:else}
        {@html parseCornerText(corners.bottomLeft.text)}
      {/if}
    </div>
  {/if}

  {#if corners.bottomRight.enabled}
    <div class="corner bottom-right" style:color={fontColor} style:font-family={fontFamilyStyle} style:font-size="{corners.bottomRight.size}px">
      {#if corners.bottomRight.type === 'image' && corners.bottomRight.image}
        <img src={corners.bottomRight.image} alt="" style:height="{corners.bottomRight.size * 2}px" />
      {:else}
        {@html parseCornerText(corners.bottomRight.text)}
      {/if}
    </div>
  {/if}

  <div
    class="slide-content"
    style:text-align={textAlign}
    style:font-size="{baseFontSize}px"
    style:color={fontColor}
    style:font-family={fontFamilyStyle}
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
  }

  .corner img {
    width: auto;
    max-width: 100%;
    object-fit: contain;
  }

  .corner.top-left {
    top: 30px;
    left: 30px;
  }

  .corner.top-right {
    top: 30px;
    right: 30px;
    text-align: right;
  }

  .corner.bottom-left {
    bottom: 30px;
    left: 30px;
  }

  .corner.bottom-right {
    bottom: 30px;
    right: 30px;
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
    margin: 0 0 0.4em 0;
    line-height: 1.2;
  }

  .slide-content :global(h2) {
    font-size: 1.55em;
    font-weight: 600;
    margin: 0 0 0.4em 0;
    line-height: 1.3;
  }

  .slide-content :global(h3) {
    font-size: 1.22em;
    font-weight: 600;
    margin: 0 0 0.4em 0;
  }

  .slide-content :global(p) {
    font-size: 1em;
    line-height: 1.5;
    margin: 0 0 0.5em 0;
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
    border-radius: 6px;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.9em;
  }

  .slide-content :global(pre) {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.7em;
    border-radius: 12px;
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
    border-left: 6px solid rgba(255, 255, 255, 0.5);
    padding-left: 0.7em;
    margin: 0.5em 0;
    font-style: italic;
  }

  .corner :global(strong) {
    font-weight: 700;
  }

  .corner :global(em) {
    font-style: italic;
  }
</style>
