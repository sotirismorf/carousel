<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	let { ...restProps }: ComponentProps<typeof SelectPrimitive.Portal> = $props();
</script>

<SelectPrimitive.Portal {...restProps} />
