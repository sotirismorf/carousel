<script>
  import Slide from './lib/Slide.svelte';
  import { parseAndSplitMarkdown } from './lib/utils/markdown.js';
  import { exportSlidesToZip } from './lib/utils/export.js';

  import { Button } from '$lib/components/ui/button';
  import { Switch } from '$lib/components/ui/switch';
  import * as Select from '$lib/components/ui/select';
  import { Slider } from '$lib/components/ui/slider';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';

  // Constants
  const DIMENSIONS = {
    square: { width: 1080, height: 1080, label: 'Square (1:1)' },
    portrait: { width: 1080, height: 1350, label: 'Portrait (4:5)' },
    landscape: { width: 1080, height: 608, label: 'Landscape (16:9)' },
  };


  const CORNERS = [
    { key: 'topLeft', label: 'Top Left', short: 'TL' },
    { key: 'topRight', label: 'Top Right', short: 'TR' },
    { key: 'bottomLeft', label: 'Bottom Left', short: 'BL' },
    { key: 'bottomRight', label: 'Bottom Right', short: 'BR' },
  ];

  const EXPORT_SCALES = [
    { value: 1, label: 'Standard', desc: '1080px' },
    { value: 2, label: 'High', desc: '2160px' },
    { value: 3, label: 'Ultra', desc: '3240px' },
  ];

  // State
  let selectedDimension = $state('square');
  let exportScale = $state(2);  // Default to High (2x)
  let isExporting = $state(false);
  let editorCollapsed = $state(false);
  let markdownText = $state(`# Welcome!

This is a **markdown to carousel** demo.

---

## How It Works

- Write markdown on the right
- See slides update in real-time
- Export as PNG images

---

## Tips

Use \`---\` to separate slides.

**Bold** and *italic* work great!

---

# Get Started!

Edit this text to create your own carousel.`);

  // Style options
  let textAlign = $state('center');
  let verticalAlign = $state('center');
  let fontScale = $state(1);
  let fontColor = $state('#ffffff');
  let fontFamily = $state('');
  let gradientTheme = $state('dark');  // 'light' | 'dark'
  let gradientColorCount = $state(3);
  let gradientColors = $state(['#667eea', '#764ba2', '#f093fb']);
  let slidePadding = $state(60);
  let previewZoom = $state([0.35]);
  let continuousBackground = $state(false);

  // Corner watermarks
  let corners = $state({
    topLeft: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    topRight: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    bottomLeft: { enabled: false, type: 'text', text: '', image: null, size: 24 },
    bottomRight: { enabled: false, type: 'text', text: '', image: null, size: 24 },
  });

  // Export refs
  let slideElements = $state([]);

  // Derived
  let dimension = $derived(DIMENSIONS[selectedDimension]);
  let slides = $derived(parseAndSplitMarkdown(markdownText));
  let zoomValue = $derived(previewZoom[0]);
  let scaledCorners = $derived(Object.fromEntries(
    Object.entries(corners).map(([key, val]) => [
      key,
      { ...val, size: val.size * exportScale }
    ])
  ));

  // Handlers
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

  function randomThemeColor(theme) {
    const hue = Math.floor(Math.random() * 360);
    if (theme === 'light') {
      // Light: high lightness (70-90%), medium saturation (60-100%)
      const sat = 60 + Math.floor(Math.random() * 40);
      const light = 70 + Math.floor(Math.random() * 20);
      return hslToHex(hue, sat, light);
    } else {
      // Dark: low-medium lightness (30-60%), high saturation (70-100%)
      const sat = 70 + Math.floor(Math.random() * 30);
      const light = 30 + Math.floor(Math.random() * 30);
      return hslToHex(hue, sat, light);
    }
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function randomizeGradient() {
    gradientColors = Array.from({ length: gradientColorCount }, () =>
      randomThemeColor(gradientTheme)
    );
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
</script>

<div class="flex h-screen bg-zinc-900 text-zinc-200 text-sm">
  <!-- Sidebar -->
  <aside class="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0">
    <header class="p-4 border-b border-zinc-200 dark:border-zinc-800">
      <h1 class="text-lg font-bold mb-3 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
        Carousel
      </h1>
      <Button class="w-full" onclick={handleExport} disabled={isExporting || slides.length === 0}>
        {isExporting ? 'Exporting...' : 'Download ZIP'}
      </Button>
    </header>

    <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5">
      <!-- Format -->
      <section class="space-y-2">
        <Label class="text-xs font-semibold uppercase text-zinc-500 block">Format</Label>
        <Select.Root type="single" bind:value={selectedDimension}>
          <Select.Trigger class="w-full">
            {DIMENSIONS[selectedDimension]?.label || 'Select format'}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(DIMENSIONS) as [key, d]}
              <Select.Item value={key}>{d.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Select.Root type="single" bind:value={exportScale}>
          <Select.Trigger class="w-full">
            {EXPORT_SCALES.find(s => s.value === exportScale)?.label} ({EXPORT_SCALES.find(s => s.value === exportScale)?.desc})
          </Select.Trigger>
          <Select.Content>
            {#each EXPORT_SCALES as scale}
              <Select.Item value={scale.value}>{scale.label} ({scale.desc})</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </section>

      <Separator />

      <!-- Text -->
      <section class="space-y-2">
        <Label class="text-xs font-semibold uppercase text-zinc-500 block">Text</Label>

        <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
          <Label class="text-zinc-600 dark:text-zinc-400">Align</Label>
          <div class="flex">
            {#each ['left', 'center', 'right', 'justify'] as a}
              <Button
                variant={textAlign === a ? 'default' : 'outline'}
                size="sm"
                class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
                onclick={() => textAlign = a}
              >
                {a[0].toUpperCase()}
              </Button>
            {/each}
          </div>

          <Label class="text-zinc-600 dark:text-zinc-400">Vertical</Label>
          <div class="flex">
            {#each [['top', 'T'], ['center', 'C'], ['bottom', 'B']] as [v, l]}
              <Button
                variant={verticalAlign === v ? 'default' : 'outline'}
                size="sm"
                class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
                onclick={() => verticalAlign = v}
              >
                {l}
              </Button>
            {/each}
          </div>

          <Label class="text-zinc-600 dark:text-zinc-400">Size</Label>
          <div class="flex items-center gap-2">
            <Slider
              value={[fontScale * 100]}
              onValueChange={(v) => fontScale = v[0] / 100}
              min={50}
              max={200}
              step={5}
              class="flex-1"
            />
            <span class="text-zinc-500 w-10 text-right">{Math.round(fontScale * 100)}%</span>
          </div>

          <Label class="text-zinc-600 dark:text-zinc-400">Color</Label>
          <input type="color" bind:value={fontColor} class="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer" />

          <Label class="text-zinc-600 dark:text-zinc-400">Font</Label>
          <Input bind:value={fontFamily} placeholder="Arial, Roboto..." class="min-w-0" />

          <Label class="text-zinc-600 dark:text-zinc-400">Padding</Label>
          <div class="flex items-center gap-2">
            <Slider
              value={[slidePadding]}
              onValueChange={(v) => slidePadding = v[0]}
              min={0}
              max={200}
              step={10}
              class="flex-1"
            />
            <span class="text-zinc-500 w-10 text-right">{slidePadding}px</span>
          </div>
        </div>
      </section>

      <Separator />

      <!-- Gradient -->
      <section class="space-y-2">
        <Label class="text-xs font-semibold uppercase text-zinc-500 block">Gradient</Label>

        <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
          <Label class="text-zinc-600 dark:text-zinc-400">Theme</Label>
          <div class="flex">
            <Button
              variant={gradientTheme === 'light' ? 'default' : 'outline'}
              size="sm"
              class="flex-1 rounded-r-none"
              onclick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              variant={gradientTheme === 'dark' ? 'default' : 'outline'}
              size="sm"
              class="flex-1 rounded-l-none -ml-px"
              onclick={() => setTheme('dark')}
            >
              Dark
            </Button>
          </div>

          <Label class="text-zinc-600 dark:text-zinc-400">Colors</Label>
          <div class="flex">
            {#each [2, 3, 4, 5] as count}
              <Button
                variant={gradientColorCount === count ? 'default' : 'outline'}
                size="sm"
                class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
                onclick={() => setColorCount(count)}
              >
                {count}
              </Button>
            {/each}
          </div>

          {#each gradientColors as color, i}
            <Label class="text-zinc-600 dark:text-zinc-400">{i + 1}</Label>
            <input type="color" bind:value={gradientColors[i]} class="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer" />
          {/each}

          <Label class="text-zinc-600 dark:text-zinc-400">Seamless</Label>
          <Switch bind:checked={continuousBackground} />
        </div>
      </section>

      <Separator />

      <!-- Corners -->
      <section class="space-y-2">
        <Label class="text-xs font-semibold uppercase text-zinc-500 block">Corners</Label>

        <div class="flex">
          {#each CORNERS as c}
            <Button
              variant={corners[c.key].enabled ? 'default' : 'outline'}
              size="sm"
              class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
              onclick={() => corners[c.key].enabled = !corners[c.key].enabled}
            >
              {c.short}
            </Button>
          {/each}
        </div>

        {#each CORNERS as c}
          {#if corners[c.key].enabled}
            <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 space-y-2">
              <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{c.label}</span>

              <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                <Label class="text-zinc-600 dark:text-zinc-400 text-xs">Type</Label>
                <div class="flex">
                  <Button
                    variant={corners[c.key].type === 'text' ? 'default' : 'outline'}
                    size="sm"
                    class="flex-1 rounded-r-none text-xs h-7"
                    onclick={() => corners[c.key].type = 'text'}
                  >
                    Text
                  </Button>
                  <Button
                    variant={corners[c.key].type === 'image' ? 'default' : 'outline'}
                    size="sm"
                    class="flex-1 rounded-l-none -ml-px text-xs h-7"
                    onclick={() => corners[c.key].type = 'image'}
                  >
                    Logo
                  </Button>
                </div>

                <Label class="text-zinc-600 dark:text-zinc-400 text-xs">Size</Label>
                <div class="flex items-center gap-2">
                  <Slider
                    value={[corners[c.key].size]}
                    onValueChange={(v) => corners[c.key].size = v[0]}
                    min={10}
                    max={100}
                    step={2}
                    class="flex-1"
                  />
                  <span class="text-zinc-500 text-xs w-8 text-right">{corners[c.key].size}px</span>
                </div>
              </div>

              {#if corners[c.key].type === 'text'}
                <Input bind:value={corners[c.key].text} placeholder="*my brand*" class="w-full h-7 text-xs" />
              {:else if corners[c.key].image}
                <div class="flex items-center gap-2">
                  <img src={corners[c.key].image} alt="" class="h-7" />
                  <Button variant="destructive" size="sm" class="h-7 w-7 p-0" onclick={() => corners[c.key].image = null}>×</Button>
                </div>
              {:else}
                <label class="block w-full">
                  <input type="file" accept=".svg,.png" onchange={(e) => handleImageUpload(c.key, e)} class="hidden" />
                  <Button variant="secondary" size="sm" class="w-full h-7 text-xs pointer-events-none">Upload Logo</Button>
                </label>
              {/if}
            </div>
          {/if}
        {/each}
      </section>

      <Separator />

      <!-- Zoom -->
      <section class="space-y-2">
        <Label class="text-xs font-semibold uppercase text-zinc-500 block">Preview</Label>
        <div class="flex items-center gap-3">
          <Slider bind:value={previewZoom} min={0.15} max={0.6} step={0.01} class="flex-1" />
          <span class="text-zinc-500 w-10 text-right">{Math.round(zoomValue * 100)}%</span>
        </div>
      </section>
    </div>
  </aside>

  <!-- Preview -->
  <main class="flex-1 overflow-auto p-5 flex items-start justify-start">
    {#if slides.length === 0}
      <p class="text-zinc-500">Write markdown to see slides</p>
    {:else}
      <div class="flex items-start">
        {#each slides as html, i}
          {#if i > 0 && !continuousBackground}
            <div class="w-0 self-stretch border-l-2 border-dashed border-white/30"></div>
          {/if}
          <div class="shrink-0" style="width:{dimension.width * zoomValue}px;height:{dimension.height * zoomValue}px;">
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
              {gradientColors}
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
  <aside class="shrink-0 bg-zinc-950 border-l border-zinc-800 flex relative transition-all duration-200" class:w-[560px]={!editorCollapsed} class:w-8={editorCollapsed}>
    <Button
      variant="default"
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
        class="flex-1 w-full p-4 bg-transparent text-zinc-300 border-none font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder:text-zinc-600"
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
        {gradientColors}
        corners={scaledCorners}
        padding={slidePadding * exportScale}
        {continuousBackground}
        slideIndex={i}
        totalSlides={slides.length}
      />
    </div>
  {/each}
</div>
