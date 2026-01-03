<script>
  import { tick } from 'svelte';
  import Slide from './lib/Slide.svelte';
  import { parseAndSplitMarkdown } from './lib/utils/markdown.js';
  import { exportSlidesToZip } from './lib/utils/export.js';

  const DIMENSIONS = {
    square: { width: 1080, height: 1080, label: 'Square (1:1)' },
    portrait: { width: 1080, height: 1350, label: 'Portrait (4:5)' },
    landscape: { width: 1080, height: 608, label: 'Landscape (16:9)' },
  };

  const GRADIENT_DIRECTIONS = [
    { value: 0, label: 'Top' },
    { value: 45, label: 'Top Right' },
    { value: 90, label: 'Right' },
    { value: 135, label: 'Bottom Right' },
    { value: 180, label: 'Bottom' },
    { value: 225, label: 'Bottom Left' },
    { value: 270, label: 'Left' },
    { value: 315, label: 'Top Left' },
  ];

  const CORNER_POSITIONS = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

  let selectedDimension = 'square';
  let isExporting = false;
  let markdownText = `# Welcome!

This is a **markdown to carousel** demo.

---

## How It Works

- Write markdown on the left
- See slides update in real-time
- Export as PNG images

---

## Tips

Use \`---\` to separate slides.

**Bold** and *italic* work great!

---

# Get Started!

Edit this text to create your own carousel.`;

  // Style options
  let textAlign = 'center';
  let verticalAlign = 'center';
  let fontScale = 1;
  let fontColor = '#ffffff';
  let fontFamily = '';
  let gradientColor1 = '#667eea';
  let gradientColor2 = '#764ba2';
  let gradientDirection = 135;
  let gradientType = 'linear';
  let slidePadding = 60;

  // Preview zoom
  let previewZoom = 0.35;

  // Corner watermarks
  let corners = {
    topLeft: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    topRight: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    bottomLeft: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    bottomRight: { enabled: false, type: 'text', text: '', image: null, size: 24 },
  };

  let slideElements = [];

  $: currentDimension = DIMENSIONS[selectedDimension];
  $: slides = parseAndSplitMarkdown(markdownText);

  async function handleExport() {
    if (slides.length === 0) return;
    isExporting = true;
    try {
      await exportSlidesToZip(
        slideElements,
        currentDimension.width,
        currentDimension.height,
        'slides'
      );
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      isExporting = false;
    }
  }

  function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  function randomizeColor1() { gradientColor1 = randomColor(); }
  function randomizeColor2() { gradientColor2 = randomColor(); }
  function randomizeDirection() {
    const dirs = GRADIENT_DIRECTIONS.map(d => d.value);
    gradientDirection = dirs[Math.floor(Math.random() * dirs.length)];
  }
  function randomizeType() { gradientType = Math.random() > 0.5 ? 'linear' : 'radial'; }
  function randomizeAll() {
    randomizeColor1();
    randomizeColor2();
    randomizeDirection();
    randomizeType();
  }

  function toggleCorner(position) {
    corners[position].enabled = !corners[position].enabled;
    corners = corners;
  }

  function handleImageUpload(position, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      corners[position].image = e.target.result;
      corners[position].type = 'image';
      corners = corners;
    };
    reader.readAsDataURL(file);
  }

  function clearCornerImage(position) {
    corners[position].image = null;
    corners[position].type = 'text';
    corners = corners;
  }

  function getCornerLabel(pos) {
    return { topLeft: 'Top Left', topRight: 'Top Right', bottomLeft: 'Bottom Left', bottomRight: 'Bottom Right' }[pos];
  }

  function getCornerShort(pos) {
    return { topLeft: 'TL', topRight: 'TR', bottomLeft: 'BL', bottomRight: 'BR' }[pos];
  }
</script>

<div class="app">
  <!-- Left Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>Carousel</h1>
      <button class="btn-export" on:click={handleExport} disabled={isExporting || slides.length === 0}>
        {isExporting ? 'Exporting...' : 'Download ZIP'}
      </button>
    </div>

    <div class="sidebar-content">
      <!-- Format -->
      <section class="option-group">
        <h3>Format</h3>
        <select bind:value={selectedDimension}>
          {#each Object.entries(DIMENSIONS) as [key, dim]}
            <option value={key}>{dim.label}</option>
          {/each}
        </select>
      </section>

      <!-- Text -->
      <section class="option-group">
        <h3>Text</h3>
        <div class="option-row">
          <label>Align</label>
          <div class="btn-group">
            {#each ['left', 'center', 'right', 'justify'] as align}
              <button class="btn-toggle" class:active={textAlign === align} on:click={() => textAlign = align}>
                {align.charAt(0).toUpperCase()}
              </button>
            {/each}
          </div>
        </div>
        <div class="option-row">
          <label>Vertical</label>
          <div class="btn-group">
            {#each [['top', 'T'], ['center', 'C'], ['bottom', 'B']] as [val, lbl]}
              <button class="btn-toggle" class:active={verticalAlign === val} on:click={() => verticalAlign = val}>
                {lbl}
              </button>
            {/each}
          </div>
        </div>
        <div class="option-row">
          <label>Size</label>
          <input type="number" min="50" max="200" step="5" value={Math.round(fontScale * 100)} on:input={(e) => fontScale = parseInt(e.target.value) / 100} class="num-input" />
          <span class="unit">%</span>
        </div>
        <div class="option-row">
          <label>Color</label>
          <input type="color" bind:value={fontColor} class="color-input" />
        </div>
        <div class="option-row">
          <label>Font</label>
          <input type="text" bind:value={fontFamily} placeholder="Arial, Roboto..." class="text-input" />
        </div>
        <div class="option-row">
          <label>Padding</label>
          <input type="number" min="0" max="200" step="10" bind:value={slidePadding} class="num-input" />
          <span class="unit">px</span>
        </div>
      </section>

      <!-- Gradient -->
      <section class="option-group">
        <h3>Gradient</h3>
        <div class="option-row">
          <label>Color 1</label>
          <input type="color" bind:value={gradientColor1} class="color-input" />
          <button class="btn-mini" on:click={randomizeColor1}>?</button>
        </div>
        <div class="option-row">
          <label>Color 2</label>
          <input type="color" bind:value={gradientColor2} class="color-input" />
          <button class="btn-mini" on:click={randomizeColor2}>?</button>
        </div>
        <div class="option-row">
          <label>Direction</label>
          <select bind:value={gradientDirection} class="select-small">
            {#each GRADIENT_DIRECTIONS as dir}
              <option value={dir.value}>{dir.label}</option>
            {/each}
          </select>
          <button class="btn-mini" on:click={randomizeDirection}>?</button>
        </div>
        <div class="option-row">
          <label>Type</label>
          <select bind:value={gradientType} class="select-small">
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
          <button class="btn-mini" on:click={randomizeType}>?</button>
        </div>
        <button class="btn-random-all" on:click={randomizeAll}>Randomize All</button>
      </section>

      <!-- Corners -->
      <section class="option-group">
        <h3>Corners</h3>
        <div class="corner-toggles">
          {#each CORNER_POSITIONS as pos}
            <button class="btn-corner" class:active={corners[pos].enabled} on:click={() => toggleCorner(pos)}>
              {getCornerShort(pos)}
            </button>
          {/each}
        </div>

        {#each CORNER_POSITIONS as pos}
          {#if corners[pos].enabled}
            <div class="corner-config">
              <div class="corner-header">{getCornerLabel(pos)}</div>
              <div class="option-row">
                <label>Type</label>
                <div class="btn-group small">
                  <button class="btn-toggle" class:active={corners[pos].type === 'text'} on:click={() => { corners[pos].type = 'text'; corners = corners; }}>Text</button>
                  <button class="btn-toggle" class:active={corners[pos].type === 'image'} on:click={() => { corners[pos].type = 'image'; corners = corners; }}>Logo</button>
                </div>
              </div>
              <div class="option-row">
                <label>Size</label>
                <input type="number" min="10" max="100" step="2" bind:value={corners[pos].size} class="num-input" />
                <span class="unit">px</span>
              </div>
              {#if corners[pos].type === 'text'}
                <input type="text" bind:value={corners[pos].text} placeholder="*my brand*" class="text-input full" />
              {:else}
                {#if corners[pos].image}
                  <div class="image-row">
                    <img src={corners[pos].image} alt="" class="thumb" />
                    <button class="btn-clear" on:click={() => clearCornerImage(pos)}>x</button>
                  </div>
                {:else}
                  <label class="upload-btn">
                    <input type="file" accept=".svg,.png" on:change={(e) => handleImageUpload(pos, e)} />
                    Upload Logo
                  </label>
                {/if}
              {/if}
            </div>
          {/if}
        {/each}
      </section>

      <!-- Preview Zoom -->
      <section class="option-group">
        <h3>Preview Zoom</h3>
        <div class="option-row">
          <input type="range" min="0.15" max="0.6" step="0.01" bind:value={previewZoom} class="zoom-slider" />
          <span class="zoom-value">{Math.round(previewZoom * 100)}%</span>
        </div>
      </section>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Editor -->
    <div class="editor-panel">
      <textarea
        class="markdown-editor"
        bind:value={markdownText}
        placeholder="# Slide 1

Content...

---

# Slide 2

More content..."
        spellcheck="false"
      ></textarea>
    </div>

    <!-- Preview -->
    <div class="preview-panel">
      {#if slides.length === 0}
        <div class="empty-state">Write markdown to see slides</div>
      {:else}
        <div class="slides-row">
          {#each slides as html, i (i + '-' + fontScale + '-' + fontColor + '-' + slidePadding)}
            {#if i > 0}
              <div class="slide-divider"></div>
            {/if}
            <div
              class="slide-wrapper"
              style="width: {currentDimension.width * previewZoom}px; height: {currentDimension.height * previewZoom}px;"
            >
              <Slide
                {html}
                width={currentDimension.width}
                height={currentDimension.height}
                scale={previewZoom}
                {textAlign}
                {verticalAlign}
                {fontScale}
                {fontColor}
                {fontFamily}
                {gradientColor1}
                {gradientColor2}
                {gradientDirection}
                {gradientType}
                {corners}
                padding={slidePadding}
              />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>

<!-- Hidden export slides -->
<div class="export-container" aria-hidden="true">
  {#each slides as html, i}
    <div bind:this={slideElements[i]}>
      <Slide
        {html}
        width={currentDimension.width}
        height={currentDimension.height}
        scale={1}
        {textAlign}
        {verticalAlign}
        {fontScale}
        {fontColor}
        {fontFamily}
        {gradientColor1}
        {gradientColor2}
        {gradientDirection}
        {gradientType}
        {corners}
        padding={slidePadding}
      />
    </div>
  {/each}
</div>

<style>
  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #1a1a2e;
  }

  /* Sidebar */
  .sidebar {
    width: 260px;
    background: #fff;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
  }

  .sidebar-header h1 {
    font-size: 1.2rem;
    margin: 0 0 12px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .btn-export {
    width: 100%;
    padding: 10px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
  }

  .btn-export:hover:not(:disabled) {
    background: #5a6fd6;
  }

  .btn-export:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .option-group {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }

  .option-group:last-child {
    border-bottom: none;
  }

  .option-group h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #888;
    margin: 0 0 10px 0;
  }

  .option-group select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
  }

  .option-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .option-row label {
    font-size: 11px;
    color: #666;
    min-width: 50px;
  }

  .btn-group {
    display: flex;
  }

  .btn-group.small .btn-toggle {
    padding: 3px 8px;
    font-size: 10px;
  }

  .btn-toggle {
    padding: 4px 8px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    color: #666;
  }

  .btn-toggle:first-child {
    border-radius: 4px 0 0 4px;
  }

  .btn-toggle:last-child {
    border-radius: 0 4px 4px 0;
  }

  .btn-toggle:not(:first-child) {
    border-left: none;
  }

  .btn-toggle.active {
    background: #667eea;
    border-color: #667eea;
    color: white;
  }

  .num-input {
    width: 50px;
    padding: 4px 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 11px;
    text-align: center;
  }

  .text-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 11px;
  }

  .text-input.full {
    width: 100%;
    margin-top: 6px;
  }

  .color-input {
    width: 32px;
    height: 24px;
    padding: 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }

  .select-small {
    flex: 1;
    padding: 4px 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 11px;
  }

  .unit {
    font-size: 10px;
    color: #888;
  }

  .btn-mini {
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 11px;
    color: #667eea;
  }

  .btn-mini:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }

  .btn-random-all {
    width: 100%;
    padding: 6px;
    border: 1px solid #667eea;
    border-radius: 4px;
    background: #fff;
    color: #667eea;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
  }

  .btn-random-all:hover {
    background: #667eea;
    color: white;
  }

  .corner-toggles {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
  }

  .btn-corner {
    flex: 1;
    padding: 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    color: #666;
  }

  .btn-corner.active {
    background: #667eea;
    border-color: #667eea;
    color: white;
  }

  .corner-config {
    background: #f8f8f8;
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 8px;
  }

  .corner-header {
    font-size: 11px;
    font-weight: 600;
    color: #667eea;
    margin-bottom: 8px;
  }

  .image-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }

  .thumb {
    height: 28px;
    width: auto;
  }

  .btn-clear {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: #ff4444;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    font-size: 11px;
  }

  .upload-btn {
    display: block;
    width: 100%;
    padding: 6px;
    background: #667eea;
    color: white;
    border-radius: 4px;
    font-size: 11px;
    text-align: center;
    cursor: pointer;
    margin-top: 6px;
  }

  .upload-btn input {
    display: none;
  }

  .zoom-slider {
    flex: 1;
    cursor: pointer;
  }

  .zoom-value {
    font-size: 11px;
    color: #666;
    min-width: 35px;
    text-align: right;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .editor-panel {
    width: 280px;
    min-width: 200px;
    background: #252538;
    display: flex;
    flex-direction: column;
  }

  .markdown-editor {
    flex: 1;
    width: 100%;
    padding: 16px;
    border: none;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.6;
    resize: none;
    background: transparent;
    color: #e0e0e0;
  }

  .markdown-editor:focus {
    outline: none;
  }

  .markdown-editor::placeholder {
    color: #666;
  }

  .preview-panel {
    flex: 1;
    overflow: auto;
    padding: 20px;
    display: flex;
    align-items: flex-start;
  }

  .empty-state {
    color: #666;
    font-size: 14px;
  }

  .slides-row {
    display: flex;
    align-items: flex-start;
  }

  .slide-wrapper {
    flex-shrink: 0;
    border-radius: 4px;
    overflow: hidden;
  }

  .slide-divider {
    width: 0;
    align-self: stretch;
    border-left: 2px dotted rgba(255, 255, 255, 0.3);
    margin: 0;
  }

  .export-container {
    position: absolute;
    left: -9999px;
    top: -9999px;
  }
</style>
