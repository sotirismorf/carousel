<script>
  import Slide from './lib/Slide.svelte';
  import { parseAndSplitMarkdown } from './lib/utils/markdown.js';
  import { exportSlidesToZip } from './lib/utils/export.js';
  import { generateGradientColors } from './lib/utils/color.js';
  import { DIMENSIONS, CORNERS, EXPORT_SCALES, DEFAULT_MARKDOWN, DEFAULT_CORNER } from './lib/utils/constants.js';

  import { Button } from '$lib/components/ui/button';
  import { Slider } from '$lib/components/ui/slider';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';

  import FormatControls from './lib/components/FormatControls.svelte';
  import TextControls from './lib/components/TextControls.svelte';
  import BackgroundControls from './lib/components/BackgroundControls.svelte';
  import CornerControls from './lib/components/CornerControls.svelte';

  // State - UI
  let selectedDimension = $state('square');
  let exportScale = $state(2);
  let isExporting = $state(false);
  let editorCollapsed = $state(false);
  let markdownText = $state(DEFAULT_MARKDOWN);

  // State - Text styles
  let textAlign = $state('center');
  let verticalAlign = $state('center');
  let fontScale = $state(1);
  let fontColor = $state('#ffffff');
  let fontFamily = $state('');
  let slidePadding = $state(60);
  let previewZoom = $state([0.35]);
  let continuousBackground = $state(true);

  // State - Background
  let bgType = $state('gradient');
  let bgSolidColor = $state('#667eea');
  let gradientTheme = $state('dark');
  let gradientColorCount = $state(3);
  let gradientColors = $state(['#667eea', '#764ba2', '#f093fb']);
  let bgImage = $state(null);
  let bgImageFit = $state('cover');

  // State - Corner watermarks
  let corners = $state({
    topLeft: { ...DEFAULT_CORNER },
    topRight: { ...DEFAULT_CORNER },
    bottomLeft: { ...DEFAULT_CORNER },
    bottomRight: { ...DEFAULT_CORNER },
  });

  // Export refs
  let slideElements = $state([]);

  // Derived values
  const dimension = $derived(DIMENSIONS[selectedDimension]);
  const slides = $derived(parseAndSplitMarkdown(markdownText));
  const zoomValue = $derived(previewZoom[0]);
  const scaledCorners = $derived(
    Object.fromEntries(
      Object.entries(corners).map(([key, val]) => [key, { ...val, size: val.size * exportScale }])
    )
  );

  // Event handlers
  async function handleExport() {
    if (slides.length === 0) return;
    isExporting = true;
    try {
      await exportSlidesToZip(
        slideElements,
        dimension.width * exportScale,
        dimension.height * exportScale,
        'slides'
      );
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      isExporting = false;
    }
  }

  function randomizeGradient() {
    gradientColors = generateGradientColors(gradientColorCount, gradientTheme);
    fontColor = gradientTheme === 'light' ? '#000000' : '#ffffff';
  }

  function setTheme(theme) {
    gradientTheme = theme;
    randomizeGradient();
  }

  function setColorCount(count) {
    gradientColorCount = count;
    randomizeGradient();
  }

  function handleImageUpload(key, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      corners[key].image = e.target.result;
      corners[key].type = 'image';
    };
    reader.readAsDataURL(file);
  }

  function handleBgImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      bgImage = e.target.result;
      bgType = 'image';
    };
    reader.readAsDataURL(file);
  }
</script>

<div class="dark flex h-screen bg-background text-foreground text-sm">
  <!-- Sidebar -->
  <aside class="w-64 bg-card border-r border-border flex flex-col shrink-0">
    <header class="p-4 border-b border-border">
      <h1 class="text-lg font-bold mb-3 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
        Carousel
      </h1>
      <Button class="w-full" onclick={handleExport} disabled={isExporting || slides.length === 0}>
        {isExporting ? 'Exporting...' : 'Download ZIP'}
      </Button>
    </header>

    <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5">
      <FormatControls bind:selectedDimension bind:exportScale />

      <Separator />

      <TextControls
        bind:textAlign
        bind:verticalAlign
        bind:fontScale
        bind:fontColor
        bind:fontFamily
        bind:slidePadding
      />

      <Separator />

      <BackgroundControls
        bind:bgType
        bind:bgSolidColor
        bind:gradientTheme
        bind:gradientColorCount
        bind:gradientColors
        bind:bgImage
        bind:bgImageFit
        bind:continuousBackground
        onThemeChange={setTheme}
        onColorCountChange={setColorCount}
        onBgImageUpload={handleBgImageUpload}
      />

      <Separator />

      <CornerControls bind:corners onImageUpload={handleImageUpload} />

      <Separator />

      <section class="space-y-2">
        <Label class="text-xs font-semibold uppercase text-muted-foreground block">Preview</Label>
        <div class="flex items-center gap-3">
          <Slider bind:value={previewZoom} min={0.15} max={0.6} step={0.05} stepFine={0.01} class="flex-1" />
          <span class="text-muted-foreground w-10 text-right">{Math.round(zoomValue * 100)}%</span>
        </div>
      </section>
    </div>
  </aside>

  <!-- Preview -->
  <main class="flex-1 overflow-auto p-5 flex items-start justify-start">
    {#if slides.length === 0}
      <p class="text-muted-foreground">Write markdown to see slides</p>
    {:else}
      <div class="flex items-start">
        {#each slides as html, i}
          <div class="shrink-0 relative" style="width:{dimension.width * zoomValue}px;height:{dimension.height * zoomValue}px;">
            {#if i > 0}
              <div class="absolute left-0 top-0 bottom-0 w-0 border-l-2 border-dashed border-white/30 -translate-x-[1px]"></div>
            {/if}
            <Slide
              {html}
              width={dimension.width}
              height={dimension.height}
              scale={zoomValue}
              {textAlign}
              {verticalAlign}
              {fontScale}
              {fontColor}
              {fontFamily}
              {bgType}
              {bgSolidColor}
              {gradientColors}
              {bgImage}
              {bgImageFit}
              {corners}
              padding={slidePadding}
              {continuousBackground}
              slideIndex={i}
              totalSlides={slides.length}
            />
          </div>
        {/each}
      </div>
    {/if}
  </main>

  <!-- Editor -->
  <aside class="shrink-0 bg-background border-l border-border flex relative transition-all duration-200" class:w-[560px]={!editorCollapsed} class:w-8={editorCollapsed}>
    <Button
      variant="secondary"
      size="icon"
      class="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 z-10"
      onclick={() => editorCollapsed = !editorCollapsed}
    >
      {editorCollapsed ? '<' : '>'}
    </Button>
    {#if !editorCollapsed}
      <textarea
        bind:value={markdownText}
        placeholder="# Slide 1&#10;&#10;Content...&#10;&#10;---&#10;&#10;# Slide 2"
        spellcheck="false"
        class="flex-1 w-full p-4 bg-transparent text-foreground border-none font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground"
      ></textarea>
    {/if}
  </aside>
</div>

<!-- Hidden export slides -->
<div class="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
  {#each slides as html, i}
    <div bind:this={slideElements[i]}>
      <Slide
        {html}
        width={dimension.width * exportScale}
        height={dimension.height * exportScale}
        scale={1}
        {textAlign}
        {verticalAlign}
        fontScale={fontScale * exportScale}
        {fontColor}
        {fontFamily}
        {bgType}
        {bgSolidColor}
        {gradientColors}
        {bgImage}
        {bgImageFit}
        corners={scaledCorners}
        padding={slidePadding * exportScale}
        {continuousBackground}
        slideIndex={i}
        totalSlides={slides.length}
      />
    </div>
  {/each}
</div>
