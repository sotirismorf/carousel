/**
 * Generate a random theme-appropriate color in HSL format
 * @param {'light' | 'dark'} theme - Color theme
 * @returns {string} Hex color string
 */
export function randomThemeColor(theme) {
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

/**
 * Convert HSL color to hex format
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color string
 */
export function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generate an array of random gradient colors
 * @param {number} count - Number of colors to generate
 * @param {'light' | 'dark'} theme - Color theme
 * @returns {string[]} Array of hex color strings
 */
export function generateGradientColors(count, theme) {
  return Array.from({ length: count }, () => randomThemeColor(theme));
}
