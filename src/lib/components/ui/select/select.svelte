<script lang="ts" generics="T">
	import { Select as SelectPrimitive } from 'bits-ui';

	let {
		open = $bindable(false),
		value = $bindable<T>(),
		type = 'single',
		...restProps
	}: {
		open?: boolean;
		value?: T;
		type?: 'single' | 'multiple';
		[key: string]: unknown;
	} = $props();
</script>

<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
<SelectPrimitive.Root bind:open bind:value={value as never} {type} {...restProps as any} />
