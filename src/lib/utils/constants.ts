import type { Dimension, Corner, ExportScale, CornerConfig, Settings } from '$lib/types';

// Dimension presets for Instagram formats
export const DIMENSIONS: Record<string, Dimension> = {
	square: { width: 1080, height: 1080, label: 'Square (1:1)' },
	portrait: { width: 1080, height: 1350, label: 'Portrait (4:5)' },
	landscape: { width: 1080, height: 608, label: 'Landscape (16:9)' },
};

// Corner watermark positions
export const CORNERS: Corner[] = [
	{ key: 'topLeft', label: 'Top Left', short: 'TL' },
	{ key: 'topRight', label: 'Top Right', short: 'TR' },
	{ key: 'bottomLeft', label: 'Bottom Left', short: 'BL' },
	{ key: 'bottomRight', label: 'Bottom Right', short: 'BR' },
];

// Export quality scale options
/** Corner keys grouped by the row they render in, so Slide.svelte can loop instead of
 * repeating four near-identical blocks. */
export const CORNER_ROWS: Record<'top' | 'bottom', string[]> = {
	top: ['topLeft', 'topRight'],
	bottom: ['bottomLeft', 'bottomRight'],
};

export const EXPORT_SCALES: ExportScale[] = [
	{ value: 1, label: 'Standard', desc: '1080px' },
	{ value: 2, label: 'High', desc: '2160px' },
	{ value: 3, label: 'Ultra', desc: '3240px' },
];

// Default markdown content
export const DEFAULT_MARKDOWN = `# Welcome!

This is a **markdown to carousel** demo.

---

## How It Works

- Write markdown on the right
- See slides update in real-time
- Export as PNG images

---

## Tips

Use \`---\` to separate slides.

**Bold** and *italic* work great!

---

# Get Started!

Edit this text to create your own carousel.`;

// Default corner configuration
export const DEFAULT_CORNER: CornerConfig = {
	enabled: false,
	type: 'text',
	text: '',
	image: null,
	size: 24,
	fontFamily: '',
};

// Default settings for each document
export const DEFAULT_SETTINGS: Settings = {
	selectedDimension: 'portrait',
	exportScale: 2,
	previewZoom: [0.35],
	textAlign: 'left',
	verticalAlign: 'top',
	fontScale: 1,
	fontColor: '#000000',
	fontFamily: '',
	slidePadding: 60,
	lineHeight: 1.5,
	hyphenate: false,
	textLang: 'en',
	continuousBackground: true,
	bgType: 'solid',
	bgSolidColor: '#ffffff',
	gradientTheme: 'dark',
	gradientColorCount: 3,
	gradientColors: ['#667eea', '#764ba2', '#f093fb'],
	gradientPositions: ['40% 20%', '80% 0%', '0% 50%'],
	bgImage: null,
	bgImageFit: 'cover',
	corners: Object.fromEntries(CORNERS.map((c) => [c.key, { ...DEFAULT_CORNER }])) as Record<
		string,
		CornerConfig
	>,
	textBgEnabled: false,
	textBgColor: 'rgba(0,0,0,0.5)',
	textBgPadding: 4,
	imageShadowSize: 28,
	imageShadowSoftness: 60,
	frameGap: 12,
	frameRadius: 16,
	frameBorderWidth: 1,
	frameBorderColor: '#000000',
	frameBorderOpacity: 100,
};

/** Smallest a frame may be resized to, in base px. */
export const MIN_FRAME_PX = 40;

/** Snap threshold for normal images, in *screen* px — converted per-axis using the current
 * preview zoom, since a fixed fractional threshold feels wrong across 15%–60% zoom. */
export const SNAP_PX = 8;

/** Upper bound on zooming a bitmap inside its frame. */
export const MAX_IMAGE_ZOOM = 8;

/** Pasted bitmaps are downscaled to this longest edge — the largest export size (1080 * 3),
 * beyond which we would only be burning memory and export time. */
export const MAX_IMAGE_PX = 3240;

// Predefined positions for gradient mesh blobs
export const MESH_POSITIONS: string[] = [
	'40% 20%',
	'80% 0%',
	'0% 50%',
	'80% 50%',
	'0% 100%',
	'80% 100%',
	'0% 0%',
];
