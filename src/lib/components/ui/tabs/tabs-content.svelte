<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComponentProps<typeof TabsPrimitive.Content> = $props();
</script>

<TabsPrimitive.Content
	bind:ref
	data-slot="tabs-content"
	class={cn('flex-1 outline-none', className)}
	{...restProps}
/>
