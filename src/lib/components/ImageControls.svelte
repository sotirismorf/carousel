<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';

	let {
		imageShadowSize = $bindable(),
		imageShadowSoftness = $bindable(),
		frameGap = $bindable(),
		frameRadius = $bindable(),
		frameBorderWidth = $bindable(),
		frameBorderColor = $bindable(),
		frameBorderOpacity = $bindable(),
	}: {
		imageShadowSize: number;
		imageShadowSoftness: number;
		frameGap: number;
		frameRadius: number;
		frameBorderWidth: number;
		frameBorderColor: string;
		frameBorderOpacity: number;
	} = $props();
</script>

<section class="space-y-2">
	<Label class="text-xs font-semibold uppercase text-muted-foreground block">Images</Label>

	<p class="text-muted-foreground text-xs leading-relaxed">
		Paste with <kbd class="font-mono">Ctrl+V</kbd> or drop a file onto a slide. Images are kept for this
		session only — they aren't saved with the document.
	</p>

	<div class="bg-muted rounded-lg p-3 space-y-2">
		<span class="text-xs font-semibold text-primary">Shadow</span>

		<div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
			<Label class="text-muted-foreground text-xs">Size</Label>
			<div class="flex items-center gap-2">
				<Slider
					value={[imageShadowSize]}
					onValueChange={(v) => (imageShadowSize = v[0])}
					min={0}
					max={120}
					step={4}
					stepFine={1}
					class="flex-1"
				/>
				<span class="text-muted-foreground text-xs w-8 text-right">{imageShadowSize}</span>
			</div>

			<Label class="text-muted-foreground text-xs">Soft</Label>
			<div class="flex items-center gap-2">
				<Slider
					value={[imageShadowSoftness]}
					onValueChange={(v) => (imageShadowSoftness = v[0])}
					min={0}
					max={100}
					step={5}
					stepFine={1}
					class="flex-1"
				/>
				<span class="text-muted-foreground text-xs w-8 text-right">{imageShadowSoftness}</span>
			</div>
		</div>
	</div>

	<div class="bg-muted rounded-lg p-3 space-y-2">
		<span class="text-xs font-semibold text-primary">Frames</span>

		<div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
			<Label class="text-muted-foreground text-xs">Gap</Label>
			<div class="flex items-center gap-2">
				<Slider
					value={[frameGap]}
					onValueChange={(v) => (frameGap = v[0])}
					min={0}
					max={80}
					step={2}
					stepFine={1}
					class="flex-1"
				/>
				<span class="text-muted-foreground text-xs w-8 text-right">{frameGap}</span>
			</div>

			<Label class="text-muted-foreground text-xs">Radius</Label>
			<div class="flex items-center gap-2">
				<Slider
					value={[frameRadius]}
					onValueChange={(v) => (frameRadius = v[0])}
					min={0}
					max={80}
					step={2}
					stepFine={1}
					class="flex-1"
				/>
				<span class="text-muted-foreground text-xs w-8 text-right">{frameRadius}</span>
			</div>

			<Label class="text-muted-foreground text-xs">Border</Label>
			<div class="flex items-center gap-2">
				<Slider
					value={[frameBorderWidth]}
					onValueChange={(v) => (frameBorderWidth = v[0])}
					min={0}
					max={8}
					step={1}
					stepFine={1}
					class="flex-1"
				/>
				<span class="text-muted-foreground text-xs w-8 text-right">{frameBorderWidth}</span>
			</div>

			<Label class="text-muted-foreground text-xs">Color</Label>
			<div class="flex items-center gap-2">
				<input
					type="color"
					bind:value={frameBorderColor}
					class="w-8 h-8 rounded border border-input cursor-pointer shrink-0"
				/>
				<Slider
					value={[frameBorderOpacity]}
					onValueChange={(v) => (frameBorderOpacity = v[0])}
					min={0}
					max={100}
					step={5}
					stepFine={1}
					class="flex-1"
				/>
				<span class="text-muted-foreground text-xs w-8 text-right">{frameBorderOpacity}%</span>
			</div>
		</div>
	</div>
</section>
