<script>
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Switch } from '$lib/components/ui/switch';

  let {
    bgType = $bindable(),
    bgSolidColor = $bindable(),
    gradientTheme = $bindable(),
    gradientColorCount = $bindable(),
    gradientColors = $bindable(),
    bgImage = $bindable(),
    bgImageFit = $bindable(),
    continuousBackground = $bindable(),
    onThemeChange,
    onColorCountChange,
    onBgImageUpload,
  } = $props();
</script>

<section class="space-y-2">
  <Label class="text-xs font-semibold uppercase text-muted-foreground block">Background</Label>

  <div class="flex">
    {#each [
      ['solid', 'Solid'],
      ['gradient', 'Gradient'],
      ['image', 'Image'],
    ] as [type, label]}
      <Button
        variant={bgType === type ? 'default' : 'outline'}
        size="sm"
        class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
        onclick={() => (bgType = type)}
      >
        {label}
      </Button>
    {/each}
  </div>

  <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
    {#if bgType === 'solid'}
      <Label class="text-muted-foreground">Color</Label>
      <input
        type="color"
        bind:value={bgSolidColor}
        class="w-8 h-8 rounded border border-input cursor-pointer"
      />
    {:else if bgType === 'gradient'}
      <Label class="text-muted-foreground">Theme</Label>
      <div class="flex">
        <Button
          variant={gradientTheme === 'light' ? 'default' : 'outline'}
          size="sm"
          class="flex-1 rounded-r-none"
          onclick={() => onThemeChange('light')}
        >
          Light
        </Button>
        <Button
          variant={gradientTheme === 'dark' ? 'default' : 'outline'}
          size="sm"
          class="flex-1 rounded-l-none -ml-px"
          onclick={() => onThemeChange('dark')}
        >
          Dark
        </Button>
      </div>

      <Label class="text-muted-foreground">Colors</Label>
      <div class="flex">
        {#each [1, 2, 3, 4, 5] as count}
          <Button
            variant={gradientColorCount === count ? 'default' : 'outline'}
            size="sm"
            class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
            onclick={() => onColorCountChange(count)}
          >
            {count}
          </Button>
        {/each}
      </div>

      {#each gradientColors as color, i}
        <Label class="text-muted-foreground">{i + 1}</Label>
        <input
          type="color"
          bind:value={gradientColors[i]}
          class="w-8 h-8 rounded border border-input cursor-pointer"
        />
      {/each}
    {:else if bgType === 'image'}
      <Label class="text-muted-foreground">Fit</Label>
      <div class="flex">
        <Button
          variant={bgImageFit === 'cover' ? 'default' : 'outline'}
          size="sm"
          class="flex-1 rounded-r-none"
          onclick={() => (bgImageFit = 'cover')}
        >
          Cover
        </Button>
        <Button
          variant={bgImageFit === 'repeat' ? 'default' : 'outline'}
          size="sm"
          class="flex-1 rounded-l-none -ml-px"
          onclick={() => (bgImageFit = 'repeat')}
        >
          Repeat
        </Button>
      </div>
    {/if}

    <Label class="text-muted-foreground">Seamless</Label>
    <Switch bind:checked={continuousBackground} />
  </div>

  {#if bgType === 'image'}
    {#if bgImage}
      <div class="flex items-center gap-2">
        <div class="w-12 h-12 rounded border border-border overflow-hidden">
          <img src={bgImage} alt="" class="w-full h-full object-cover" />
        </div>
        <Button variant="destructive" size="sm" onclick={() => (bgImage = null)}>Remove</Button>
      </div>
    {:else}
      <label class="block w-full">
        <input type="file" accept=".png,.jpg,.jpeg,.svg" onchange={onBgImageUpload} class="hidden" />
        <Button variant="secondary" size="sm" class="w-full pointer-events-none">Upload Image</Button>
      </label>
    {/if}
  {/if}
</section>
