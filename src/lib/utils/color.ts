export function randomThemeColor(theme: 'light' | 'dark'): string {
	const hue = Math.floor(Math.random() * 360);
	if (theme === 'light') {
		// Light: high lightness (70-90%), medium saturation (60-100%)
		const sat = 60 + Math.floor(Math.random() * 40);
		const light = 70 + Math.floor(Math.random() * 20);
		return hslToHex(hue, sat, light);
	} else {
		// Dark: low-medium lightness (30-60%), high saturation (70-100%)
		const sat = 70 + Math.floor(Math.random() * 30);
		const light = 30 + Math.floor(Math.random() * 30);
		return hslToHex(hue, sat, light);
	}
}

export function hslToHex(h: number, s: number, l: number): string {
	s /= 100;
	l /= 100;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number): string => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateGradientColors(count: number, theme: 'light' | 'dark'): string[] {
	return Array.from({ length: count }, () => randomThemeColor(theme));
}

/**
 * Compose a hex colour and a 0-100 opacity into a CSS colour.
 *
 * The border colour is stored as plain hex so the settings panel can use the same native
 * colour picker as every other colour in the app; opacity rides alongside it as a slider,
 * since a hairline border usually wants to be semi-transparent.
 */
export function borderColorCss(hex: string, opacity: number): string {
	const alpha = Math.min(Math.max(opacity, 0), 100) / 100;
	if (alpha >= 1) return hex;

	const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!match) return hex;
	const value = parseInt(match[1], 16);
	const r = (value >> 16) & 255;
	const g = (value >> 8) & 255;
	const b = value & 255;
	return `rgba(${r},${g},${b},${alpha})`;
}
