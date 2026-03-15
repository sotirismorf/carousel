<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		...restProps
	}: ComponentProps<typeof TabsPrimitive.Root> = $props();
</script>

<TabsPrimitive.Root
	bind:ref
	bind:value
	data-slot="tabs"
	class={cn('flex flex-col gap-2', className)}
	{...restProps}
/>
