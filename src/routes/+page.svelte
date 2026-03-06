<script>
  import Slide from '$lib/Slide.svelte';
  import { parseAndSplitMarkdown } from '$lib/utils/markdown.js';
  import { exportSlidesToZip } from '$lib/utils/export.js';
  import { generateGradientColors } from '$lib/utils/color.js';
  import { generateRandomPositions } from '$lib/utils/background.js';
  import { DIMENSIONS, CORNERS, EXPORT_SCALES, DEFAULT_SETTINGS } from '$lib/utils/constants.js';
  import { createDocumentsStore } from '$lib/stores/documents.svelte.js';

  import { Button } from '$lib/components/ui/button';
  import { Slider } from '$lib/components/ui/slider';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Input } from '$lib/components/ui/input';

  import FormatControls from '$lib/components/FormatControls.svelte';
  import TextControls from '$lib/components/TextControls.svelte';
  import BackgroundControls from '$lib/components/BackgroundControls.svelte';
  import CornerControls from '$lib/components/CornerControls.svelte';

  // Documents store for persistence
  const docs = createDocumentsStore();

  // State - UI (not per-document)
  let isExporting = $state(false);
  let editorCollapsed = $state(false);
  let editingTabId = $state(null);
  let editingTabName = $state('');

  // Mobile state
  let mobilePanel = $state('preview'); // 'preview' | 'edit' | 'settings'
  let isMobile = $state(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  $effect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => { isMobile = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  // Export refs
  let slideElements = $state([]);

  // Settings are a reactive lens into the active document — mutations flow straight to the store
  const settings = $derived(docs.activeSettings);

  // Derived markdown text from active document
  const markdownText = $derived(docs.getActiveDocument()?.content || '');

  // Derived values
  const dimension = $derived(DIMENSIONS[settings.selectedDimension]);
  const slides = $derived(parseAndSplitMarkdown(markdownText));
  const zoomValue = $derived(settings.previewZoom[0]);
  const scaledCorners = $derived(
    Object.fromEntries(
      Object.entries(settings.corners).map(([key, val]) => [key, { ...val, size: val.size * settings.exportScale }])
    )
  );

  // Event handlers
  async function handleExport() {
    if (slides.length === 0) return;
    isExporting = true;
    try {
      await exportSlidesToZip(
        slideElements,
        dimension.width * settings.exportScale,
        dimension.height * settings.exportScale,
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
    settings.gradientColors = generateGradientColors(settings.gradientColorCount, settings.gradientTheme);
    settings.gradientPositions = generateRandomPositions(settings.gradientColorCount);
    settings.fontColor = settings.gradientTheme === 'light' ? '#000000' : '#ffffff';
  }

  function setTheme(theme) {
    settings.gradientTheme = theme;
    randomizeGradient();
  }

  function setColorCount(count) {
    settings.gradientColorCount = count;
    randomizeGradient();
  }

  function handleImageUpload(key, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      settings.corners[key].image = e.target.result;
      settings.corners[key].type = 'image';
    };
    reader.readAsDataURL(file);
  }

  function handleBgImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      settings.bgImage = e.target.result;
      settings.bgType = 'image';
    };
    reader.readAsDataURL(file);
  }
</script>

<div class="dark flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-background text-foreground text-sm">

  <!-- Mobile header -->
  <header class="flex md:hidden items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
    <h1 class="text-base font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
      Carousel
    </h1>
    <Button onclick={handleExport} disabled={isExporting || slides.length === 0} size="sm">
      {isExporting ? 'Exporting…' : 'Export'}
    </Button>
  </header>

  <!-- Sidebar (Settings panel) -->
  <aside
    class="bg-card border-border flex flex-col shrink-0 overflow-hidden
           w-full flex-1 md:flex-none md:w-64 md:min-w-64 md:border-r"
    class:hidden={isMobile && mobilePanel !== 'settings'}
  >
    <!-- Desktop-only header -->
    <header class="hidden md:block p-4 border-b border-border">
      <h1 class="text-lg font-bold mb-3 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
        Carousel
      </h1>
      <Button class="w-full" onclick={handleExport} disabled={isExporting || slides.length === 0}>
        {isExporting ? 'Exporting...' : 'Download ZIP'}
      </Button>
    </header>

    <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5">
      <FormatControls bind:selectedDimension={settings.selectedDimension} bind:exportScale={settings.exportScale} />

      <Separator />

      <TextControls
        bind:textAlign={settings.textAlign}
        bind:verticalAlign={settings.verticalAlign}
        bind:fontScale={settings.fontScale}
        bind:fontColor={settings.fontColor}
        bind:fontFamily={settings.fontFamily}
        bind:slidePadding={settings.slidePadding}
        bind:lineHeight={settings.lineHeight}
        bind:hyphenate={settings.hyphenate}
        bind:textLang={settings.textLang}
      />

      <Separator />

      <BackgroundControls
        bind:bgType={settings.bgType}
        bind:bgSolidColor={settings.bgSolidColor}
        bind:gradientTheme={settings.gradientTheme}
        bind:gradientColorCount={settings.gradientColorCount}
        bind:gradientColors={settings.gradientColors}
        bind:bgImage={settings.bgImage}
        bind:bgImageFit={settings.bgImageFit}
        bind:continuousBackground={settings.continuousBackground}
        onThemeChange={setTheme}
        onColorCountChange={setColorCount}
        onBgImageUpload={handleBgImageUpload}
      />

      <Separator />

      <CornerControls bind:corners={settings.corners} onImageUpload={handleImageUpload} />

      <Separator />

      <!-- Zoom slider: desktop only -->
      <section class="hidden md:block space-y-2">
        <Label class="text-xs font-semibold uppercase text-muted-foreground block">Preview</Label>
        <div class="flex items-center gap-3">
          <Slider bind:value={settings.previewZoom} min={0.15} max={0.6} step={0.05} stepFine={0.01} class="flex-1" />
          <span class="text-muted-foreground w-10 text-right">{Math.round(zoomValue * 100)}%</span>
        </div>
      </section>
    </div>
  </aside>

  <!-- Preview wrapper -->
  <div
    class="flex flex-col flex-1 min-w-0 min-h-0"
    class:hidden={isMobile && mobilePanel !== 'preview'}
  >
    <main class="flex-1 min-w-0 grid place-items-center overflow-auto p-2 md:p-5">
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
                textAlign={settings.textAlign}
                verticalAlign={settings.verticalAlign}
                fontScale={settings.fontScale}
                fontColor={settings.fontColor}
                fontFamily={settings.fontFamily}
                bgType={settings.bgType}
                bgSolidColor={settings.bgSolidColor}
                gradientColors={settings.gradientColors}
                gradientPositions={settings.gradientPositions}
                bgImage={settings.bgImage}
                bgImageFit={settings.bgImageFit}
                corners={settings.corners}
                padding={settings.slidePadding}
                continuousBackground={settings.continuousBackground}
                slideIndex={i}
                totalSlides={slides.length}
                lineHeight={settings.lineHeight}
                hyphenate={settings.hyphenate}
                textLang={settings.textLang}
              />
            </div>
          {/each}
        </div>
      {/if}
    </main>

    <!-- Zoom bar: mobile only, outside scroll container -->
    {#if isMobile}
      <div class="flex items-center gap-2 px-4 py-2 border-t border-border bg-card shrink-0">
        <span class="text-muted-foreground text-xs shrink-0">Zoom</span>
        <Slider bind:value={settings.previewZoom} min={0.15} max={0.6} step={0.05} stepFine={0.01} class="flex-1" />
        <span class="text-muted-foreground text-xs w-8 text-right shrink-0">{Math.round(zoomValue * 100)}%</span>
      </div>
    {/if}
  </div>

  <!-- Editor -->
  <aside
    class="shrink-0 bg-card border-border flex flex-col transition-all duration-200 overflow-hidden
           md:h-full md:max-h-full md:border-l"
    class:hidden={isMobile && mobilePanel !== 'edit'}
    class:w-full={isMobile && mobilePanel === 'edit'}
    class:flex-1={isMobile && mobilePanel === 'edit'}
    class:w-[560px]={!isMobile && !editorCollapsed}
    class:w-0={!isMobile && editorCollapsed}
  >
    {#if isMobile || !editorCollapsed}
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
        <!-- Collapse button: desktop only -->
        <Button
          variant="ghost"
          size="sm"
          class="hidden md:flex h-8 w-8 p-0 shrink-0"
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

  <!-- Show editor button when collapsed (desktop only) -->
  {#if editorCollapsed && !isMobile}
    <Button
      variant="secondary"
      size="sm"
      class="fixed right-4 top-1/2 -translate-y-1/2 z-20"
      onclick={() => editorCollapsed = false}
    >
      ⟨ Editor
    </Button>
  {/if}

  <!-- Mobile bottom nav -->
  <nav
    class="flex md:hidden items-stretch border-t border-border bg-card shrink-0"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  >
    <!-- Preview button -->
    <button
      class="flex-1 flex flex-col items-center justify-center gap-1 min-h-14 text-xs transition-colors"
      class:text-foreground={mobilePanel === 'preview'}
      class:text-muted-foreground={mobilePanel !== 'preview'}
      onclick={() => mobilePanel = 'preview'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <span>Preview</span>
    </button>

    <!-- Edit button -->
    <button
      class="flex-1 flex flex-col items-center justify-center gap-1 min-h-14 text-xs transition-colors"
      class:text-foreground={mobilePanel === 'edit'}
      class:text-muted-foreground={mobilePanel !== 'edit'}
      onclick={() => mobilePanel = 'edit'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
      <span>Edit</span>
    </button>

    <!-- Settings button -->
    <button
      class="flex-1 flex flex-col items-center justify-center gap-1 min-h-14 text-xs transition-colors"
      class:text-foreground={mobilePanel === 'settings'}
      class:text-muted-foreground={mobilePanel !== 'settings'}
      onclick={() => mobilePanel = 'settings'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/>
        <circle cx="12" cy="4" r="2"/>
        <line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/>
        <circle cx="10" cy="12" r="2"/>
        <line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/>
        <circle cx="14" cy="20" r="2"/>
      </svg>
      <span>Settings</span>
    </button>
  </nav>

</div>

<!-- Hidden export slides -->
<div class="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
  {#each slides as html, i}
    <div bind:this={slideElements[i]}>
      <Slide
        {html}
        width={dimension.width * settings.exportScale}
        height={dimension.height * settings.exportScale}
        scale={1}
        textAlign={settings.textAlign}
        verticalAlign={settings.verticalAlign}
        fontScale={settings.fontScale * settings.exportScale}
        fontColor={settings.fontColor}
        fontFamily={settings.fontFamily}
        bgType={settings.bgType}
        bgSolidColor={settings.bgSolidColor}
        gradientColors={settings.gradientColors}
        gradientPositions={settings.gradientPositions}
        bgImage={settings.bgImage}
        bgImageFit={settings.bgImageFit}
        corners={scaledCorners}
        padding={settings.slidePadding * settings.exportScale}
        continuousBackground={settings.continuousBackground}
        slideIndex={i}
        totalSlides={slides.length}
        lineHeight={settings.lineHeight}
        hyphenate={settings.hyphenate}
        textLang={settings.textLang}
      />
    </div>
  {/each}
</div>
