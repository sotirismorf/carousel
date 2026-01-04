<script>
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Slider } from '$lib/components/ui/slider';
  import { Input } from '$lib/components/ui/input';
  import { CORNERS } from '../utils/constants.js';

  let { corners = $bindable(), onImageUpload } = $props();
</script>

<section class="space-y-2">
  <Label class="text-xs font-semibold uppercase text-muted-foreground block">Corners</Label>

  <div class="flex">
    {#each CORNERS as c}
      <Button
        variant={corners[c.key].enabled ? 'default' : 'outline'}
        size="sm"
        class="flex-1 rounded-none first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 px-2"
        onclick={() => (corners[c.key].enabled = !corners[c.key].enabled)}
      >
        {c.short}
      </Button>
    {/each}
  </div>

  {#each CORNERS as c}
    {#if corners[c.key].enabled}
      <div class="bg-muted rounded-lg p-3 space-y-2">
        <span class="text-xs font-semibold text-primary">{c.label}</span>

        <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
          <Label class="text-muted-foreground text-xs">Type</Label>
          <div class="flex">
            <Button
              variant={corners[c.key].type === 'text' ? 'default' : 'outline'}
              size="sm"
              class="flex-1 rounded-r-none text-xs h-7"
              onclick={() => (corners[c.key].type = 'text')}
            >
              Text
            </Button>
            <Button
              variant={corners[c.key].type === 'image' ? 'default' : 'outline'}
              size="sm"
              class="flex-1 rounded-l-none -ml-px text-xs h-7"
              onclick={() => (corners[c.key].type = 'image')}
            >
              Logo
            </Button>
          </div>

          <Label class="text-muted-foreground text-xs">Size</Label>
          <div class="flex items-center gap-2">
            <Slider
              value={[corners[c.key].size]}
              onValueChange={(v) => (corners[c.key].size = v[0])}
              min={10}
              max={100}
              step={5}
              stepFine={1}
              class="flex-1"
            />
            <span class="text-muted-foreground text-xs w-8 text-right">{corners[c.key].size}px</span>
          </div>
        </div>

        {#if corners[c.key].type === 'text'}
          <Input
            bind:value={corners[c.key].text}
            placeholder="*my brand*"
            class="w-full h-7 text-xs"
          />
        {:else if corners[c.key].image}
          <div class="flex items-center gap-2">
            <img src={corners[c.key].image} alt="" class="h-7" />
            <Button
              variant="destructive"
              size="sm"
              class="h-7 w-7 p-0"
              onclick={() => (corners[c.key].image = null)}
            >
              ×
            </Button>
          </div>
        {:else}
          <label class="block w-full">
            <input
              type="file"
              accept=".svg,.png"
              onchange={(e) => onImageUpload(c.key, e)}
              class="hidden"
            />
            <Button variant="secondary" size="sm" class="w-full h-7 text-xs pointer-events-none">
              Upload Logo
            </Button>
          </label>
        {/if}
      </div>
    {/if}
  {/each}
</section>
