<script>
  import Slide from './Slide.svelte';

  export let slides = [];
  export let width = 1080;
  export let height = 1080;

  let currentIndex = 0;
  let slideElements = [];

  // Calculate preview scale based on viewport
  $: previewScale = Math.min(0.35, 400 / width);

  function prev() {
    if (currentIndex > 0) currentIndex--;
  }

  function next() {
    if (currentIndex < slides.length - 1) currentIndex++;
  }

  function goTo(index) {
    currentIndex = index;
  }

  export function getSlideElements() {
    return slideElements;
  }
</script>

<div class="carousel">
  <div class="preview-container">
    <div
      class="preview-wrapper"
      style="width: {width * previewScale}px; height: {height * previewScale}px;"
    >
      {#each slides as html, i}
        <div
          class="slide-wrapper"
          class:active={i === currentIndex}
          style="display: {i === currentIndex ? 'block' : 'none'};"
          bind:this={slideElements[i]}
        >
          <Slide {html} {width} {height} scale={previewScale} />
        </div>
      {/each}
    </div>
  </div>

  <div class="navigation">
    <button on:click={prev} disabled={currentIndex === 0}>
      &#8592; Prev
    </button>
    <span class="counter">{currentIndex + 1} / {slides.length}</span>
    <button on:click={next} disabled={currentIndex === slides.length - 1}>
      Next &#8594;
    </button>
  </div>

  <div class="thumbnails">
    {#each slides as html, i}
      <button
        class="thumbnail"
        class:active={i === currentIndex}
        on:click={() => goTo(i)}
      >
        {i + 1}
      </button>
    {/each}
  </div>
</div>

<!-- Hidden full-size slides for export -->
<div class="export-container" aria-hidden="true">
  {#each slides as html, i}
    <div bind:this={slideElements[i]}>
      <Slide {html} {width} {height} scale={1} />
    </div>
  {/each}
</div>

<style>
  .carousel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .preview-container {
    background: #1a1a2e;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .preview-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
  }

  .slide-wrapper {
    position: absolute;
    top: 0;
    left: 0;
  }

  .navigation {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .navigation button {
    background: #667eea;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.2s, opacity 0.2s;
  }

  .navigation button:hover:not(:disabled) {
    background: #5a6fd6;
  }

  .navigation button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .counter {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    min-width: 80px;
    text-align: center;
  }

  .thumbnails {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 400px;
  }

  .thumbnail {
    width: 36px;
    height: 36px;
    border: 2px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .thumbnail:hover {
    border-color: #667eea;
  }

  .thumbnail.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }

  .export-container {
    position: absolute;
    left: -9999px;
    top: -9999px;
  }
</style>
