<script>
  import Slide from './lib/Slide.svelte';
  import { parseAndSplitMarkdown } from './lib/utils/markdown.js';
  import { exportSlidesToZip } from './lib/utils/export.js';
  import { generateGradientColors } from './lib/utils/color.js';
import { generateRandomPositions } from './lib/utils/background.js';
  import { DIMENSIONS, CORNERS, EXPORT_SCALES, DEFAULT_CORNER } from './lib/utils/constants.js';
  import { createDocumentsStore } from './lib/stores/documents.svelte.js';

  import { Button } from '$lib/components/ui/button';
  import { Slider } from '$lib/components/ui/slider';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Input } from '$lib/components/ui/input';

  import FormatControls from './lib/components/FormatControls.svelte';
  import TextControls from './lib/components/TextControls.svelte';
  import BackgroundControls from './lib/components/BackgroundControls.svelte';
  import CornerControls from './lib/components/CornerControls.svelte';

  // Documents store for persistence
  const docs = createDocumentsStore();

  // State - UI
  let selectedDimension = $state('square');
  let exportScale = $state(2);
  let isExporting = $state(false);
  let editorCollapsed = $state(false);
  let editingTabId = $state(null);
  let editingTabName = $state('');

  // Derived markdown text from active document
  const markdownText = $derived(docs.getActiveDocument()?.content || '');

  // State - Text styles
  let textAlign = $state('center');
  let verticalAlign = $state('center');
  let fontScale = $state(1);
  let fontColor = $state('#ffffff');
  let fontFamily = $state('');
  let slidePadding = $state(60);
  let previewZoom = $state([0.35]);
  let continuousBackground = $state(true);
  let lineHeight = $state(1.5);
  let hyphenate = $state(false);
  let textLang = $state('en');

  // State - Background
  let bgType = $state('gradient');
  let bgSolidColor = $state('#667eea');
  let gradientTheme = $state('dark');
  let gradientColorCount = $state(3);
  let gradientColors = $state(['#667eea', '#764ba2', '#f093fb']);
  let gradientPositions = $state(['40% 20%', '80% 0%', '0% 50%']);
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
    gradientPositions = generateRandomPositions(gradientColorCount);
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

<div class="dark flex h-screen max-h-screen overflow-hidden bg-background text-foreground text-sm">
  <!-- Sidebar -->
  <aside class="w-64 min-w-64 bg-card border-r border-border flex flex-col shrink-0">
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
        bind:lineHeight
        bind:hyphenate
        bind:textLang
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
  <main class="flex-1 min-w-0 grid place-items-center overflow-auto p-5">
    {#if slides.length === 0}
      <p class="text-muted-foreground">Write markdown to see slides</p>
    {:else}
      <div class="flex items-start w-max">
        {#each slides as html, i}
          <div class="shrink-0 relative overflow-hidden" style="width:{dimension.width * zoomValue}px;height:{dimension.height * zoomValue}px;">
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
              {gradientPositions}
              {bgImage}
              {bgImageFit}
              {corners}
              padding={slidePadding}
              {continuousBackground}
              slideIndex={i}
              totalSlides={slides.length}
              {lineHeight}
              {hyphenate}
              {textLang}
            />
          </div>
        {/each}
      </div>
    {/if}
  </main>

  <!-- Editor -->
  <aside class="shrink-0 h-full max-h-full bg-card border-l border-border flex flex-col transition-all duration-200 overflow-hidden" class:w-[560px]={!editorCollapsed} class:w-0={editorCollapsed}>
    {#if !editorCollapsed}
      <!-- Header with tabs and controls -->
      <div class="flex items-center border-b border-border bg-muted/30 shrink-0 min-h-fit">
        <div class="flex-1 flex items-center overflow-x-auto">
          {#each docs.documents as doc (doc.id)}
            <div
              class="group relative flex items-center gap-1 px-3 py-2 text-xs border-r border-border hover:bg-muted/50 transition-colors shrink-0 cursor-pointer"
              class:bg-card={doc.id === docs.activeId}
              class:text-foreground={doc.id === docs.activeId}
              class:text-muted-foreground={doc.id !== docs.activeId}
              role="tab"
              tabindex="0"
              onclick={() => docs.setActiveId(doc.id)}
              ondblclick={() => {
                editingTabId = doc.id;
                editingTabName = doc.name;
              }}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') docs.setActiveId(doc.id);
              }}
            >
              {#if editingTabId === doc.id}
                <input
                  type="text"
                  bind:value={editingTabName}
                  class="w-20 bg-transparent border-none outline-none text-xs"
                  onblur={() => {
                    docs.renameDocument(doc.id, editingTabName);
                    editingTabId = null;
                  }}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      docs.renameDocument(doc.id, editingTabName);
                      editingTabId = null;
                    }
                    if (e.key === 'Escape') {
                      editingTabId = null;
                    }
                  }}
                  onclick={(e) => e.stopPropagation()}
                />
              {:else}
                <span class="max-w-24 truncate">{doc.name}</span>
              {/if}
              {#if docs.documents.length > 1}
                <button
                  class="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-1"
                  onclick={(e) => {
                    e.stopPropagation();
                    docs.removeDocument(doc.id);
                  }}
                >
                  ×
                </button>
              {/if}
            </div>
          {/each}
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0 shrink-0"
          onclick={() => docs.addDocument()}
          title="New document"
        >
          +
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0 shrink-0"
          onclick={() => editorCollapsed = true}
          title="Hide editor"
        >
          ⟩
        </Button>
      </div>
      <!-- Editor textarea -->
      <textarea
        value={markdownText}
        oninput={(e) => docs.setActiveContent(e.target.value)}
        placeholder="# Slide 1&#10;&#10;Content...&#10;&#10;---&#10;&#10;# Slide 2"
        spellcheck="false"
        class="flex-1 min-h-0 w-full p-4 bg-transparent text-foreground border-none font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground overflow-y-auto"
      ></textarea>
    {/if}
  </aside>

  <!-- Show editor button when collapsed -->
  {#if editorCollapsed}
    <Button
      variant="secondary"
      size="sm"
      class="fixed right-4 top-1/2 -translate-y-1/2 z-20"
      onclick={() => editorCollapsed = false}
    >
      ⟨ Editor
    </Button>
  {/if}
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
        {gradientPositions}
        {bgImage}
        {bgImageFit}
        corners={scaledCorners}
        padding={slidePadding * exportScale}
        {continuousBackground}
        slideIndex={i}
        totalSlides={slides.length}
        {lineHeight}
        {hyphenate}
        {textLang}
      />
    </div>
  {/each}
</div>
