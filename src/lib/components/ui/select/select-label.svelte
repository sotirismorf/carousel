<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		children?: Snippet;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class'> = $props();
</script>

<div
	bind:this={ref}
	data-slot="select-label"
	class={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
	{...restProps}
>
	{@render children?.()}
</div>
