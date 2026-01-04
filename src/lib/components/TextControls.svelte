<script>
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Slider } from '$lib/components/ui/slider';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import * as Select from '$lib/components/ui/select';

  let {
    textAlign = $bindable(),
    verticalAlign = $bindable(),
    fontScale = $bindable(),
    fontColor = $bindable(),
    fontFamily = $bindable(),
    slidePadding = $bindable(),
    lineHeight = $bindable(),
    hyphenate = $bindable(),
    textLang = $bindable(),
  } = $props();

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'el', label: 'Greek' },
    { value: 'de', label: 'German' },
    { value: 'fr', label: 'French' },
    { value: 'es', label: 'Spanish' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'nl', label: 'Dutch' },
    { value: 'pl', label: 'Polish' },
    { value: 'ru', label: 'Russian' },
    { value: 'uk', label: 'Ukrainian' },
    { value: 'cs', label: 'Czech' },
    { value: 'sv', label: 'Swedish' },
    { value: 'da', label: 'Danish' },
    { value: 'fi', label: 'Finnish' },
    { value: 'nb', label: 'Norwegian' },
  ];

  // Font availability check
  let fontAvailable = $state(null);
  let checkTimeout = null; // NOT reactive to avoid infinite loop

  function checkFontAvailability(fontName) {
    if (!fontName || !fontName.trim()) {
      fontAvailable = null;
      return;
    }
    // Use canvas to check if font is available
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const testString = 'abcdefghijklmnopqrstuvwxyz0123456789';
    ctx.font = '72px monospace';
    const defaultWidth = ctx.measureText(testString).width;
    ctx.font = `72px "${fontName.trim()}", monospace`;
    const testWidth = ctx.measureText(testString).width;
    fontAvailable = testWidth !== defaultWidth;
  }

  // Only react to fontFamily changes
  $effect(() => {
    const currentFont = fontFamily; // capture the value
    if (checkTimeout) clearTimeout(checkTimeout);
    checkTimeout = setTimeout(() => checkFontAvailability(currentFont), 300);
  });
</script>

<section class="space-y-2">
  <Label class="text-xs font-semibold uppercase text-muted-foreground block">Text</Label>

  <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
    <Label class="text-muted-foreground">Align</Label>
    <div class="flex">
      {#each ['left', 'center', 'right', 'justify'] as a}
        <Button
          variant={textAlign === a ? 'default' : 'outline'}
          size="sm"
          class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
          onclick={() => (textAlign = a)}
        >
          {a[0].toUpperCase()}
        </Button>
      {/each}
    </div>

    <Label class="text-muted-foreground">Vertical</Label>
    <div class="flex">
      {#each [
        ['top', 'T'],
        ['center', 'C'],
        ['bottom', 'B'],
      ] as [v, l]}
        <Button
          variant={verticalAlign === v ? 'default' : 'outline'}
          size="sm"
          class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
          onclick={() => (verticalAlign = v)}
        >
          {l}
        </Button>
      {/each}
    </div>

    <Label class="text-muted-foreground">Size</Label>
    <div class="flex items-center gap-2">
      <Slider
        value={[fontScale * 100]}
        onValueChange={(v) => (fontScale = v[0] / 100)}
        min={50}
        max={200}
        step={5}
        stepFine={1}
        class="flex-1"
      />
      <span class="text-muted-foreground w-10 text-right">{Math.round(fontScale * 100)}%</span>
    </div>

    <Label class="text-muted-foreground">Line H.</Label>
    <div class="flex items-center gap-2">
      <Slider
        value={[lineHeight * 100]}
        onValueChange={(v) => (lineHeight = v[0] / 100)}
        min={100}
        max={300}
        step={10}
        stepFine={5}
        class="flex-1"
      />
      <span class="text-muted-foreground w-10 text-right">{lineHeight.toFixed(1)}</span>
    </div>

    <Label class="text-muted-foreground">Color</Label>
    <input
      type="color"
      bind:value={fontColor}
      class="w-8 h-8 rounded border border-input cursor-pointer"
    />

    <Label class="text-muted-foreground">Font</Label>
    <div class="flex items-center gap-2">
      <Input bind:value={fontFamily} placeholder="Arial, Roboto..." class="min-w-0 flex-1" />
      {#if fontAvailable === true}
        <span class="text-green-500 text-xs" title="Font available">✓</span>
      {:else if fontAvailable === false}
        <span class="text-destructive text-xs" title="Font not found">✗</span>
      {/if}
    </div>

    <Label class="text-muted-foreground">Padding</Label>
    <div class="flex items-center gap-2">
      <Slider
        value={[slidePadding]}
        onValueChange={(v) => (slidePadding = v[0])}
        min={0}
        max={200}
        step={5}
        stepFine={1}
        class="flex-1"
      />
      <span class="text-muted-foreground w-10 text-right">{slidePadding}px</span>
    </div>

    <Label class="text-muted-foreground">Hyphenate</Label>
    <div class="flex items-center gap-2">
      <Switch bind:checked={hyphenate} />
      {#if hyphenate}
        <Select.Root type="single" bind:value={textLang}>
          <Select.Trigger class="h-7 text-xs flex-1">
            {languages.find(l => l.value === textLang)?.label || 'Select language'}
          </Select.Trigger>
          <Select.Content>
            {#each languages as lang}
              <Select.Item value={lang.value}>{lang.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      {/if}
    </div>
  </div>
</section>
