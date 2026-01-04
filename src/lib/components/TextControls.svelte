<script>
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Slider } from '$lib/components/ui/slider';
  import { Input } from '$lib/components/ui/input';

  let {
    textAlign = $bindable(),
    verticalAlign = $bindable(),
    fontScale = $bindable(),
    fontColor = $bindable(),
    fontFamily = $bindable(),
    slidePadding = $bindable(),
  } = $props();
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

    <Label class="text-muted-foreground">Color</Label>
    <input
      type="color"
      bind:value={fontColor}
      class="w-8 h-8 rounded border border-input cursor-pointer"
    />

    <Label class="text-muted-foreground">Font</Label>
    <Input bind:value={fontFamily} placeholder="Arial, Roboto..." class="min-w-0" />

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
  </div>
</section>
