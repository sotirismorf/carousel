<script lang="ts">
	import { tick } from 'svelte';
	import Slide from '$lib/Slide.svelte';
	import { parseAndSplitMarkdown } from '$lib/utils/markdown';
	import { exportSlidesToZip } from '$lib/utils/export';
	import { generateGradientColors } from '$lib/utils/color';
	import { generateRandomPositions } from '$lib/utils/background';
	import { DIMENSIONS } from '$lib/utils/constants';
	import { createDocumentsStore } from '$lib/stores/documents.svelte';
	import { createSlideImagesStore } from '$lib/stores/slideImages.svelte';
	import {
		fileToImageSource,
		imageFilesFromClipboard,
		imageFilesFromDataTransfer,
	} from '$lib/utils/clipboardImages';
	import { normalImageHeight, zoomFrameImage } from '$lib/utils/imageFit';
	import type { DeckImages, Selection, Settings } from '$lib/types';

	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';

	import FormatControls from '$lib/components/FormatControls.svelte';
	import TextControls from '$lib/components/TextControls.svelte';
	import BackgroundControls from '$lib/components/BackgroundControls.svelte';
	import CornerControls from '$lib/components/CornerControls.svelte';
	import ImageControls from '$lib/components/ImageControls.svelte';
	import ImageEditorOverlay from '$lib/components/ImageEditorOverlay.svelte';
	import ImageGhosts from '$lib/components/ImageGhosts.svelte';

	/** Shared placeholder for documents with no images yet, so we never allocate per render. */
	const EMPTY_DECK: DeckImages = { normal: [], frames: [] };

	// Documents store for persistence
	const docs = createDocumentsStore();
	// Per-slide images. In-memory only — see the store for why.
	const imageStore = createSlideImagesStore();

	// State - UI (not per-document)
	let isExporting = $state(false);
	let editorCollapsed = $state(false);
	let editingTabId = $state<string | null>(null);
	let editingTabName = $state('');

	// Mobile state
	let mobilePanel = $state<'preview' | 'edit' | 'settings'>('preview');
	let isMobile = $state(
		typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
	);
	$effect(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		const handler = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	// Export refs. The full-resolution slides are only mounted while an export is in flight —
	// keeping them mounted re-renders every slide at up to 3240px on any reactive change.
	let slideElements = $state<HTMLElement[]>([]);
	let exportPending = $state(false);
	let exportProgress = $state({ done: 0, total: 0 });

	const exportLabel = $derived(
		!isExporting
			? null
			: exportProgress.total > 0
				? `Exporting ${exportProgress.done}/${exportProgress.total}…`
				: 'Exporting…'
	);

	// Settings are a reactive lens into the active document — mutations flow straight to the store
	const settings = $derived(docs.activeSettings!);

	// Derived markdown text from active document
	const markdownText = $derived(docs.getActiveDocument()?.content || '');

	// Derived values
	const dimension = $derived(DIMENSIONS[settings.selectedDimension]);
	const slides = $derived(parseAndSplitMarkdown(markdownText));
	const zoomValue = $derived(settings.previewZoom[0]);

	const documentId = $derived(docs.activeId);
	const selection = $derived(imageStore.selection);

	/** Images live on the whole strip, so one deck serves every slide. */
	const deckImages = $derived(imageStore.get(documentId) ?? EMPTY_DECK);

	/** Frame gap expressed in strip units, for placing a new frame inside a slide. */
	const gapUnits = $derived({
		x: settings.frameGap / dimension.width,
		y: settings.frameGap / dimension.height,
	});

	/** The slide a pasted image should land on: whatever is under the pointer, else the first. */
	function pasteTarget(): number | null {
		if (slides.length === 0) return null;
		return imageStore.hoveredSlide ?? 0;
	}

	/** Place a new free image centred on a slide, at half the slide width. */
	function placementOn(
		slideIndex: number,
		source: { naturalWidth: number; naturalHeight: number }
	) {
		const w = 0.5;
		const h = normalImageHeight({ w, ...source }, dimension.width, dimension.height);
		return { x: slideIndex + (1 - w) / 2, y: (1 - h) / 2, w };
	}

	async function addImages(
		slideIndex: number,
		files: File[],
		target?: { frameId?: string; asFrame?: boolean }
	): Promise<void> {
		for (const file of files) {
			try {
				const source = await fileToImageSource(file);
				if (target?.frameId || target?.asFrame) {
					imageStore.addFrame(documentId, source, {
						slideIndex,
						gapX: gapUnits.x,
						gapY: gapUnits.y,
						frameId: target.frameId,
					});
					// Only the first file can claim an explicit frame.
					target = undefined;
				} else {
					imageStore.addNormal(documentId, source, placementOn(slideIndex, source));
				}
			} catch (err) {
				console.error('Could not read image:', err);
			}
		}
	}

	function handlePaste(event: ClipboardEvent): void {
		const files = imageFilesFromClipboard(event);
		// Only claim the event when it actually carries an image, so pasting text into the
		// markdown editor keeps working normally.
		if (files.length === 0) return;
		const target = pasteTarget();
		if (target === null) return;
		event.preventDefault();
		void addImages(target, files);
	}

	function handleDrop(slideIndex: number, event: DragEvent): void {
		const files = imageFilesFromDataTransfer(event.dataTransfer);
		if (files.length === 0) return;
		event.preventDefault();
		void addImages(slideIndex, files);
	}

	function handleDragOver(event: DragEvent): void {
		if (!event.dataTransfer?.types.includes('Files')) return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
	}

	/** True while the user is typing, so image shortcuts never steal keys from the editor. */
	function isTypingTarget(): boolean {
		const el = document.activeElement;
		if (!el) return false;
		return (
			el.tagName === 'INPUT' ||
			el.tagName === 'TEXTAREA' ||
			(el as HTMLElement).isContentEditable === true
		);
	}

	/** Step through every image in the deck — frames first, then free images. */
	function cycleSelection(step: number): void {
		const items: Selection[] = [
			...deckImages.frames.map((f) => ({ kind: 'frame', id: f.id }) as const),
			...deckImages.normal.map((n) => ({ kind: 'normal', id: n.id }) as const),
		];
		if (items.length === 0) return;
		const current = items.findIndex(
			(item) => item?.kind === selection?.kind && item?.id === selection?.id
		);
		imageStore.selection = items[(((current + step) % items.length) + items.length) % items.length];
	}

	function handleFrameKey(event: KeyboardEvent, id: string): void {
		const frame = deckImages.frames.find((f) => f.id === id);
		if (!frame) return;

		if (event.key === 'Delete' || event.key === 'Backspace') {
			// First press empties the frame; a second removes it.
			imageStore.deleteFrame(documentId, id);
			event.preventDefault();
			return;
		}
		if (event.key === 'f' || event.key === 'F') {
			imageStore.frameToNormal(documentId, id);
			event.preventDefault();
			return;
		}
		if (!frame.image) return;

		if (event.key === '0') {
			imageStore.updateFrameImage(documentId, id, { zoom: 1, ox: 0.5, oy: 0.5 });
			event.preventDefault();
			return;
		}
		if (event.key === '+' || event.key === '=' || event.key === '-') {
			const next = zoomFrameImage(
				frame.image,
				frame.w * dimension.width,
				frame.h * dimension.height,
				event.key === '-' ? 1 / 1.1 : 1.1
			);
			imageStore.updateFrameImage(documentId, id, {
				zoom: next.zoom,
				ox: next.ox,
				oy: next.oy,
			});
			event.preventDefault();
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (isTypingTarget()) return;

		// Undo/redo applies to image edits and works whether or not something is selected.
		if ((event.ctrlKey || event.metaKey) && (event.key === 'z' || event.key === 'Z')) {
			if (event.shiftKey) imageStore.redo();
			else imageStore.undo();
			event.preventDefault();
			return;
		}

		if (event.key === 'Tab') {
			cycleSelection(event.shiftKey ? -1 : 1);
			event.preventDefault();
			return;
		}

		const sel = imageStore.selection;
		if (!sel) return;

		if (event.key === 'Escape') {
			imageStore.selection = null;
			event.preventDefault();
			return;
		}

		if (sel.kind === 'frame') {
			handleFrameKey(event, sel.id);
			return;
		}

		const image = deckImages.normal.find((n) => n.id === sel.id);
		if (!image) return;

		if (event.key === 'Delete' || event.key === 'Backspace') {
			imageStore.removeNormal(documentId, sel.id);
			event.preventDefault();
			return;
		}
		if (event.key === 'f' || event.key === 'F') {
			imageStore.normalToFrame(
				documentId,
				sel.id,
				normalImageHeight(image, dimension.width, dimension.height)
			);
			event.preventDefault();
			return;
		}
		if (event.key === '[' || event.key === ']') {
			imageStore.reorderNormal(documentId, sel.id, event.key === ']' ? 1 : -1);
			event.preventDefault();
			return;
		}

		const nudges: Record<string, [number, number]> = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1],
		};
		const nudge = nudges[event.key];
		if (nudge) {
			const amount = event.shiftKey ? 10 : 1;
			imageStore.updateNormal(documentId, sel.id, {
				x: image.x + (nudge[0] * amount) / dimension.width,
				y: image.y + (nudge[1] * amount) / dimension.height,
			});
			event.preventDefault();
		}
	}

	// Event handlers
	async function handleExport(): Promise<void> {
		if (slides.length === 0 || isExporting) return;
		isExporting = true;
		exportProgress = { done: 0, total: slides.length };
		// Drop refs from a previous export before remounting, so a shrunken deck can't leave
		// stale nodes behind to be rasterized.
		slideElements = [];
		exportPending = true;
		try {
			await tick();
			await exportSlidesToZip(
				slideElements,
				dimension.width * settings.exportScale,
				dimension.height * settings.exportScale,
				'slides',
				(done, total) => {
					exportProgress = { done, total };
				}
			);
		} catch (err) {
			console.error('Export failed:', err);
			alert('Export failed. Please try again.');
		} finally {
			exportPending = false;
			isExporting = false;
		}
	}

	function randomizeGradient(): void {
		settings.gradientColors = generateGradientColors(
			settings.gradientColorCount,
			settings.gradientTheme
		);
		settings.gradientPositions = generateRandomPositions(settings.gradientColorCount);
		settings.fontColor = settings.gradientTheme === 'light' ? '#000000' : '#ffffff';
	}

	function setTheme(theme: Settings['gradientTheme']): void {
		settings.gradientTheme = theme;
		randomizeGradient();
	}

	function setColorCount(count: number): void {
		settings.gradientColorCount = count;
		randomizeGradient();
	}

	function handleImageUpload(
		key: string,
		event: Event & { currentTarget: HTMLInputElement }
	): void {
		const file = event.currentTarget.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e: ProgressEvent<FileReader>) => {
			settings.corners[key].image = e.target!.result as string;
			settings.corners[key].type = 'image';
		};
		reader.readAsDataURL(file);
	}

	function handleBgImageUpload(event: Event & { currentTarget: HTMLInputElement }): void {
		const file = event.currentTarget.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e: ProgressEvent<FileReader>) => {
			settings.bgImage = e.target!.result as string;
			settings.bgType = 'image';
		};
		reader.readAsDataURL(file);
	}
</script>

<svelte:window onpaste={handlePaste} onkeydown={handleKeydown} />

<div
	class="dark flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-background text-foreground text-sm"
>
	<!-- Mobile header -->
	<header
		class="flex md:hidden items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0"
	>
		<h1
			class="text-base font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"
		>
			Carousel
		</h1>
		<Button onclick={handleExport} disabled={isExporting || slides.length === 0} size="sm">
			{exportLabel ?? 'Export'}
		</Button>
	</header>

	<!-- Sidebar (Settings panel) -->
	<aside
		class="bg-card border-border flex flex-col shrink-0 overflow-hidden
           w-full flex-1 md:flex-none md:w-64 md:min-w-64 md:border-r"
		class:hidden={isMobile && mobilePanel !== 'settings'}
	>
		<!-- Desktop-only header -->
		<header class="hidden md:block p-4 border-b border-border">
			<h1
				class="text-lg font-bold mb-3 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"
			>
				Carousel
			</h1>
			<Button class="w-full" onclick={handleExport} disabled={isExporting || slides.length === 0}>
				{exportLabel ?? 'Download ZIP'}
			</Button>
		</header>

		<div class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5">
			<FormatControls
				bind:selectedDimension={settings.selectedDimension}
				bind:exportScale={settings.exportScale}
			/>

			<Separator />

			<TextControls
				bind:textAlign={settings.textAlign}
				bind:verticalAlign={settings.verticalAlign}
				bind:fontScale={settings.fontScale}
				bind:fontColor={settings.fontColor}
				bind:fontFamily={settings.fontFamily}
				bind:slidePadding={settings.slidePadding}
				bind:lineHeight={settings.lineHeight}
				bind:hyphenate={settings.hyphenate}
				bind:textLang={settings.textLang}
				bind:textBgEnabled={settings.textBgEnabled}
				bind:textBgColor={settings.textBgColor}
				bind:textBgPadding={settings.textBgPadding}
			/>

			<Separator />

			<BackgroundControls
				bind:bgType={settings.bgType}
				bind:bgSolidColor={settings.bgSolidColor}
				bind:gradientTheme={settings.gradientTheme}
				bind:gradientColorCount={settings.gradientColorCount}
				bind:gradientColors={settings.gradientColors}
				bind:bgImage={settings.bgImage}
				bind:bgImageFit={settings.bgImageFit}
				bind:continuousBackground={settings.continuousBackground}
				onThemeChange={setTheme}
				onColorCountChange={setColorCount}
				onBgImageUpload={handleBgImageUpload}
			/>

			<Separator />

			<CornerControls bind:corners={settings.corners} onImageUpload={handleImageUpload} />

			<Separator />

			<ImageControls
				bind:imageShadowSize={settings.imageShadowSize}
				bind:imageShadowSoftness={settings.imageShadowSoftness}
				bind:frameGap={settings.frameGap}
				bind:frameRadius={settings.frameRadius}
				bind:frameBorderWidth={settings.frameBorderWidth}
				bind:frameBorderColor={settings.frameBorderColor}
				bind:frameBorderOpacity={settings.frameBorderOpacity}
			/>

			<Separator />

			<!-- Zoom slider: desktop only -->
			<section class="hidden md:block space-y-2">
				<Label class="text-xs font-semibold uppercase text-muted-foreground block">Preview</Label>
				<div class="flex items-center gap-3">
					<Slider
						bind:value={settings.previewZoom}
						min={0.15}
						max={0.6}
						step={0.05}
						stepFine={0.01}
						class="flex-1"
					/>
					<span class="text-muted-foreground w-10 text-right">{Math.round(zoomValue * 100)}%</span>
				</div>
			</section>
		</div>
	</aside>

	<!-- Preview wrapper -->
	<div
		class="flex flex-col flex-1 min-w-0 min-h-0"
		class:hidden={isMobile && mobilePanel !== 'preview'}
	>
		<main class="flex-1 min-w-0 grid place-items-center overflow-auto p-2 md:p-5">
			{#if slides.length === 0}
				<p class="text-muted-foreground">Write markdown to see slides</p>
			{:else}
				<!-- One continuous strip. Images are positioned across the whole strip and each
				     slide is just a window onto it, so nothing has to stop at a slide boundary. -->
				<div class="strip flex items-start w-max">
					<!-- Faded copies behind the opaque slides: only the parts hanging off the strip
					     show through, so you can see what an export will crop away. -->
					<ImageGhosts
						images={deckImages}
						slideCount={slides.length}
						slideWidth={dimension.width * zoomValue}
						slideHeight={dimension.height * zoomValue}
					/>

					{#each slides as html, i (i)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="slide-window shrink-0 relative overflow-hidden"
							style="width:{dimension.width * zoomValue}px;height:{dimension.height * zoomValue}px;"
							onpointerdown={() => (imageStore.selection = null)}
							onpointerenter={() => (imageStore.hoveredSlide = i)}
							onpointerleave={() => {
								if (imageStore.hoveredSlide === i) imageStore.hoveredSlide = null;
							}}
							ondragover={handleDragOver}
							ondrop={(e) => handleDrop(i, e)}
						>
							<Slide
								{html}
								{settings}
								images={deckImages}
								showPlaceholders
								render={{
									width: dimension.width,
									height: dimension.height,
									scale: zoomValue,
									geometryScale: 1,
									slideIndex: i,
									totalSlides: slides.length,
								}}
							/>
							{#if i > 0}
								<!-- Cut line between slides. Alternating black/white dashes stay legible on
								     dark, light and colourful backgrounds alike. -->
								<div class="cut-line"></div>
							{/if}
						</div>
					{/each}

					<!-- One overlay for the whole strip, so an image spanning two slides stays a
					     single object to drag. -->
					<ImageEditorOverlay
						images={deckImages}
						{settings}
						store={imageStore}
						{documentId}
						slideCount={slides.length}
						slideWidth={dimension.width}
						slideHeight={dimension.height}
						zoom={zoomValue}
						onDropOnFrame={(frameId, files) => {
							void addImages(imageStore.hoveredSlide ?? 0, files, { frameId });
						}}
					/>
				</div>
			{/if}
		</main>

		<!-- Zoom bar: mobile only, outside scroll container -->
		{#if isMobile}
			<div class="flex items-center gap-2 px-4 py-2 border-t border-border bg-card shrink-0">
				<span class="text-muted-foreground text-xs shrink-0">Zoom</span>
				<Slider
					bind:value={settings.previewZoom}
					min={0.15}
					max={0.6}
					step={0.05}
					stepFine={0.01}
					class="flex-1"
				/>
				<span class="text-muted-foreground text-xs w-8 text-right shrink-0"
					>{Math.round(zoomValue * 100)}%</span
				>
			</div>
		{/if}
	</div>

	<!-- Editor -->
	<aside
		class="shrink-0 bg-card border-border flex flex-col transition-all duration-200 overflow-hidden
           md:h-full md:max-h-full md:border-l"
		class:hidden={isMobile && mobilePanel !== 'edit'}
		class:w-full={isMobile && mobilePanel === 'edit'}
		class:flex-1={isMobile && mobilePanel === 'edit'}
		class:w-[560px]={!isMobile && !editorCollapsed}
		class:w-0={!isMobile && editorCollapsed}
	>
		{#if isMobile || !editorCollapsed}
			<!-- Header with tabs and controls -->
			<div class="flex items-center border-b border-border bg-muted/30 shrink-0 min-h-fit">
				<div class="flex-1 flex items-center overflow-x-auto">
					{#each docs.documents as doc (doc.id)}
						<div
							class="group relative flex items-center gap-1 px-3 py-2 text-xs border-r border-border hover:bg-muted/50 transition-colors shrink-0 cursor-pointer"
							class:bg-card={doc.id === docs.activeId}
							class:text-foreground={doc.id === docs.activeId}
							class:text-muted-foreground={doc.id !== docs.activeId}
							role="tab"
							tabindex="0"
							onclick={() => docs.setActiveId(doc.id)}
							ondblclick={() => {
								editingTabId = doc.id;
								editingTabName = doc.name;
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') docs.setActiveId(doc.id);
							}}
						>
							{#if editingTabId === doc.id}
								<input
									type="text"
									bind:value={editingTabName}
									class="w-20 bg-transparent border-none outline-none text-xs"
									onblur={() => {
										docs.renameDocument(doc.id, editingTabName);
										editingTabId = null;
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											docs.renameDocument(doc.id, editingTabName);
											editingTabId = null;
										}
										if (e.key === 'Escape') {
											editingTabId = null;
										}
									}}
									onclick={(e) => e.stopPropagation()}
								/>
							{:else}
								<span class="max-w-24 truncate">{doc.name}</span>
							{/if}
							{#if docs.documents.length > 1}
								<button
									class="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-1"
									onclick={(e) => {
										e.stopPropagation();
										imageStore.dropDocument(doc.id);
										docs.removeDocument(doc.id);
									}}
								>
									×
								</button>
							{/if}
						</div>
					{/each}
				</div>
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0 shrink-0"
					onclick={() => docs.addDocument()}
					title="New document"
				>
					+
				</Button>
				<!-- Collapse button: desktop only -->
				<Button
					variant="ghost"
					size="sm"
					class="hidden md:flex h-8 w-8 p-0 shrink-0"
					onclick={() => (editorCollapsed = true)}
					title="Hide editor"
				>
					⟩
				</Button>
			</div>
			<!-- Editor textarea -->
			<textarea
				value={markdownText}
				oninput={(e) => docs.setActiveContent(e.currentTarget.value)}
				placeholder="# Slide 1&#10;&#10;Content...&#10;&#10;---&#10;&#10;# Slide 2"
				spellcheck="false"
				class="flex-1 min-h-0 w-full p-4 bg-transparent text-foreground border-none font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground overflow-y-auto"
			></textarea>
		{/if}
	</aside>

	<!-- Show editor button when collapsed (desktop only) -->
	{#if editorCollapsed && !isMobile}
		<Button
			variant="secondary"
			size="sm"
			class="fixed right-4 top-1/2 -translate-y-1/2 z-20"
			onclick={() => (editorCollapsed = false)}
		>
			⟨ Editor
		</Button>
	{/if}

	<!-- Mobile bottom nav -->
	<nav
		class="flex md:hidden items-stretch border-t border-border bg-card shrink-0"
		style="padding-bottom: env(safe-area-inset-bottom, 0px)"
	>
		<!-- Preview button -->
		<button
			class="flex-1 flex flex-col items-center justify-center gap-1 min-h-14 text-xs transition-colors"
			class:text-foreground={mobilePanel === 'preview'}
			class:text-muted-foreground={mobilePanel !== 'preview'}
			onclick={() => (mobilePanel = 'preview')}
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="3" y="3" width="7" height="7" rx="1" /><rect
					x="14"
					y="3"
					width="7"
					height="7"
					rx="1"
				/>
				<rect x="3" y="14" width="7" height="7" rx="1" /><rect
					x="14"
					y="14"
					width="7"
					height="7"
					rx="1"
				/>
			</svg>
			<span>Preview</span>
		</button>

		<!-- Edit button -->
		<button
			class="flex-1 flex flex-col items-center justify-center gap-1 min-h-14 text-xs transition-colors"
			class:text-foreground={mobilePanel === 'edit'}
			class:text-muted-foreground={mobilePanel !== 'edit'}
			onclick={() => (mobilePanel = 'edit')}
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
				<path d="m15 5 4 4" />
			</svg>
			<span>Edit</span>
		</button>

		<!-- Settings button -->
		<button
			class="flex-1 flex flex-col items-center justify-center gap-1 min-h-14 text-xs transition-colors"
			class:text-foreground={mobilePanel === 'settings'}
			class:text-muted-foreground={mobilePanel !== 'settings'}
			onclick={() => (mobilePanel = 'settings')}
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="21" y1="4" x2="14" y2="4" /><line x1="10" y1="4" x2="3" y2="4" />
				<circle cx="12" cy="4" r="2" />
				<line x1="21" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="3" y2="12" />
				<circle cx="10" cy="12" r="2" />
				<line x1="21" y1="20" x2="16" y2="20" /><line x1="12" y1="20" x2="3" y2="20" />
				<circle cx="14" cy="20" r="2" />
			</svg>
			<span>Settings</span>
		</button>
	</nav>
</div>

<!-- Hidden export slides: only mounted during an export (see handleExport) -->
{#if exportPending}
	<div class="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
		{#each slides as html, i (i)}
			<div bind:this={slideElements[i]}>
				<Slide
					{html}
					{settings}
					images={deckImages}
					render={{
						width: dimension.width,
						height: dimension.height,
						scale: 1,
						geometryScale: settings.exportScale,
						slideIndex: i,
						totalSlides: slides.length,
					}}
				/>
			</div>
		{/each}
	</div>
{/if}

<style>
	.strip {
		position: relative;
	}

	/* The slides paint over the ghost layer. */
	.slide-window {
		z-index: 1;
	}

	/*
	 * Cut line between two slides. It marks where Instagram will split the carousel, so it has
	 * to stay readable over whatever the slide happens to be — alternating black and white
	 * dashes are visible against dark, light and saturated backgrounds alike, which a single
	 * colour never is. Preview only: it lives in the wrapper, not inside <Slide>, so it can
	 * never reach an exported PNG.
	 */
	.cut-line {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 1px;
		z-index: 15;
		pointer-events: none;
		background-image: repeating-linear-gradient(to bottom, #000 0 6px, #fff 6px 12px);
	}
</style>
