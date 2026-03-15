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
	selectedDimension: 'square',
	exportScale: 2,
	previewZoom: [0.35],
	textAlign: 'center',
	verticalAlign: 'center',
	fontScale: 1,
	fontColor: '#ffffff',
	fontFamily: '',
	slidePadding: 60,
	lineHeight: 1.5,
	hyphenate: false,
	textLang: 'en',
	continuousBackground: true,
	bgType: 'gradient',
	bgSolidColor: '#667eea',
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
};

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
