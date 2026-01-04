<script>
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { DIMENSIONS, EXPORT_SCALES } from '../utils/constants.js';

  let { selectedDimension = $bindable(), exportScale = $bindable() } = $props();
</script>

<section class="space-y-2">
  <Label class="text-xs font-semibold uppercase text-muted-foreground block">Format</Label>
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
      {EXPORT_SCALES.find((s) => s.value === exportScale)?.label}
      ({EXPORT_SCALES.find((s) => s.value === exportScale)?.desc})
    </Select.Trigger>
    <Select.Content>
      {#each EXPORT_SCALES as scale}
        <Select.Item value={scale.value}>{scale.label} ({scale.desc})</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</section>
