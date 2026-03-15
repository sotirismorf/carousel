import { MESH_POSITIONS } from './constants';
import type { Settings } from '$lib/types';

export function getBackgroundColor(
	bgType: Settings['bgType'],
	bgSolidColor: string,
	gradientColors: string[]
): string {
	if (bgType === 'solid') return bgSolidColor;
	if (bgType === 'gradient') return gradientColors[0] || '#667eea';
	return 'transparent';
}

export function getBackgroundImage(
	bgType: Settings['bgType'],
	gradientColors: string[],
	bgImage: string | null,
	gradientPositions?: string[]
): string {
	if (bgType === 'gradient') {
		const positions = gradientPositions || MESH_POSITIONS;
		return gradientColors
			.map((color, i) => {
				const pos = positions[i % positions.length];
				return `radial-gradient(at ${pos}, ${color} 0px, transparent 50%)`;
			})
			.join(',');
	}
	if (bgType === 'image' && bgImage) return `url(${bgImage})`;
	return 'none';
}

export function generateRandomPositions(count: number): string[] {
	return Array.from({ length: count }, () => {
		const x = Math.floor(Math.random() * 100);
		const y = Math.floor(Math.random() * 100);
		return `${x}% ${y}%`;
	});
}

export function getBackgroundSize(
	bgType: Settings['bgType'],
	continuousBackground: boolean,
	bgImageFit: Settings['bgImageFit'],
	totalSlides: number
): string {
	if (bgType === 'image') {
		if (continuousBackground) return 'auto 100%';
		return bgImageFit === 'cover' ? 'cover' : 'auto';
	}
	// Gradient
	return continuousBackground ? `${totalSlides * 100}% 100%` : '100% 100%';
}

export function getBackgroundPosition(
	bgType: Settings['bgType'],
	continuousBackground: boolean,
	slideIndex: number,
	width: number,
	totalSlides: number
): string {
	if (bgType === 'image') {
		if (continuousBackground) {
			const offsetPx = slideIndex * width;
			return `-${offsetPx}px 0`;
		}
		return 'center';
	}
	// Gradient
	return continuousBackground ? `${(slideIndex / (totalSlides - 1 || 1)) * 100}% 0` : '0 0';
}

export function getBackgroundRepeat(
	bgType: Settings['bgType'],
	continuousBackground: boolean,
	bgImageFit: Settings['bgImageFit']
): string {
	if (bgType === 'image') {
		if (continuousBackground) return 'repeat-x';
		return bgImageFit === 'repeat' ? 'repeat' : 'no-repeat';
	}
	return 'no-repeat';
}
