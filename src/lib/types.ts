export interface Dimension {
	width: number;
	height: number;
	label: string;
}

export interface Corner {
	key: string;
	label: string;
	short: string;
}

export interface ExportScale {
	value: number;
	label: string;
	desc: string;
}

export interface CornerConfig {
	enabled: boolean;
	type: 'text' | 'image';
	text: string;
	image: string | null;
	size: number;
	fontFamily: string;
}

/**
 * A bitmap plus the intrinsic size we need for cover/aspect math. Always a data URL, never a
 * `blob:` URL — html-to-image's inliner is a no-op for data URLs but has to fetch blob URLs,
 * which races and silently blanks the image if the URL was revoked.
 */
export interface ImageSource {
	dataUrl: string;
	naturalWidth: number;
	naturalHeight: number;
}

/**
 * Images live on ONE CONTINUOUS STRIP spanning the whole carousel, not on individual slides —
 * a carousel is read as a panorama, so nothing should be forced to stop at a slide boundary.
 *
 * Horizontal units are **slide widths from the left of the strip**: slide `i` occupies
 * `[i, i+1]`, so `x = 1.5` is the centre of the second slide. Using slide widths rather than a
 * fraction of the whole strip means positions stay put when slides are added or removed.
 *
 * Vertical units are a plain fraction of slide height, `[0, 1]`.
 */
export interface StripRect {
	/** Left edge, in slide widths from the strip's left edge. */
	x: number;
	/** Top edge, as a fraction of slide height. */
	y: number;
	/** Width in slide widths. */
	w: number;
}

/**
 * A freely-placed image showing its whole bitmap, with a drop shadow. Height is always derived
 * from the natural aspect ratio, never stored — storing it independently would distort the
 * image whenever the slide aspect changes.
 */
export interface NormalImage extends ImageSource, StripRect {
	id: string;
}

/** The bitmap inside a frame, cropped to fill it. */
export interface FrameImage extends ImageSource {
	/** >= 1; 1 is exactly "cover". */
	zoom: number;
	/** Pan as a fraction of the overflow, both in [0,1]; 0.5 is centred. Clamping to that
	 * range is what guarantees a frame can never reveal empty space. */
	ox: number;
	oy: number;
}

/**
 * An InDesign-style image frame: a free rectangle that crops its bitmap to fill.
 *
 * Frames are deliberately NOT a tiling of the slide. They snap to slide edges and to each
 * other with a uniform gap, and edges that meet across that gap move together when dragged,
 * but a frame is free to occupy any part of the strip and leave the rest empty.
 */
export interface FrameRect extends StripRect {
	id: string;
	/** Height as a fraction of slide height. Independent of `w` — a frame is a crop window. */
	h: number;
	/** `null` is an empty frame: still visible in the editor, and a valid drop target. */
	image: FrameImage | null;
}

/** All images for one document. Held in memory only — never persisted. */
export interface DeckImages {
	normal: NormalImage[];
	frames: FrameRect[];
}

export type Selection = { kind: 'normal'; id: string } | { kind: 'frame'; id: string } | null;

export interface Settings {
	selectedDimension: string;
	exportScale: number;
	previewZoom: number[];
	textAlign: 'left' | 'center' | 'right' | 'justify';
	verticalAlign: 'top' | 'center' | 'bottom';
	fontScale: number;
	fontColor: string;
	fontFamily: string;
	slidePadding: number;
	lineHeight: number;
	hyphenate: boolean;
	textLang: string;
	continuousBackground: boolean;
	bgType: 'solid' | 'gradient' | 'image';
	bgSolidColor: string;
	gradientTheme: 'light' | 'dark';
	gradientColorCount: number;
	gradientColors: string[];
	gradientPositions: string[];
	bgImage: string | null;
	bgImageFit: 'cover' | 'repeat';
	corners: Record<string, CornerConfig>;
	textBgEnabled: boolean;
	textBgColor: string;
	textBgPadding: number;
	// Image settings. Document-global, and all px values are in the 1080-wide base space.
	imageShadowSize: number;
	imageShadowSoftness: number;
	frameGap: number;
	frameRadius: number;
	frameBorderWidth: number;
	frameBorderColor: string;
	/** 0-100. Kept separate from the colour so the swatch can be a plain colour picker. */
	frameBorderOpacity: number;
}

/**
 * How a single <Slide> instance should be rasterized.
 *
 * `width`/`height` are the *base* dimensions (1080-wide design space) and every px-valued
 * setting is multiplied by `geometryScale` inside Slide.svelte. The preview renders at base
 * size and shrinks with a CSS transform (`scale`); the export copy renders at
 * `geometryScale === settings.exportScale` with `scale === 1`.
 */
export interface RenderContext {
	width: number;
	height: number;
	scale: number;
	geometryScale: number;
	slideIndex: number;
	totalSlides: number;
}

// Named CarouselDocument to avoid shadowing the DOM `Document` global
export interface CarouselDocument {
	id: string;
	name: string;
	content: string;
	settings: Settings;
	createdAt: number;
}
