<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import type { ComponentProps } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComponentProps<typeof Separator> = $props();
</script>

<Separator
	bind:ref
	data-slot="select-separator"
	class={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
	{...restProps}
/>
