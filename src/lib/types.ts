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
}

// Named CarouselDocument to avoid shadowing the DOM `Document` global
export interface CarouselDocument {
	id: string;
	name: string;
	content: string;
	settings: Settings;
	createdAt: number;
}
