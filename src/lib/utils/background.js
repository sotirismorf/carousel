import { MESH_POSITIONS } from './constants.js';

/**
 * Compute background color based on type
 * @param {'solid' | 'gradient' | 'image'} bgType
 * @param {string} bgSolidColor
 * @param {string[]} gradientColors
 * @returns {string}
 */
export function getBackgroundColor(bgType, bgSolidColor, gradientColors) {
  if (bgType === 'solid') return bgSolidColor;
  if (bgType === 'gradient') return gradientColors[0] || '#667eea';
  return 'transparent';
}

/**
 * Compute background image value
 * @param {'solid' | 'gradient' | 'image'} bgType
 * @param {string[]} gradientColors
 * @param {string | null} bgImage
 * @param {string[]} [gradientPositions] - Optional custom positions
 * @returns {string}
 */
export function getBackgroundImage(bgType, gradientColors, bgImage, gradientPositions) {
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

/**
 * Generate random gradient positions
 * @param {number} count - Number of positions to generate
 * @returns {string[]}
 */
export function generateRandomPositions(count) {
  return Array.from({ length: count }, () => {
    const x = Math.floor(Math.random() * 100);
    const y = Math.floor(Math.random() * 100);
    return `${x}% ${y}%`;
  });
}

/**
 * Compute background size
 * @param {'solid' | 'gradient' | 'image'} bgType
 * @param {boolean} continuousBackground
 * @param {'cover' | 'repeat'} bgImageFit
 * @param {number} totalSlides
 * @returns {string}
 */
export function getBackgroundSize(bgType, continuousBackground, bgImageFit, totalSlides) {
  if (bgType === 'image') {
    if (continuousBackground) return 'auto 100%';
    return bgImageFit === 'cover' ? 'cover' : 'auto';
  }
  // Gradient
  return continuousBackground ? `${totalSlides * 100}% 100%` : '100% 100%';
}

/**
 * Compute background position
 * @param {'solid' | 'gradient' | 'image'} bgType
 * @param {boolean} continuousBackground
 * @param {number} slideIndex
 * @param {number} width
 * @param {number} totalSlides
 * @returns {string}
 */
export function getBackgroundPosition(bgType, continuousBackground, slideIndex, width, totalSlides) {
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

/**
 * Compute background repeat
 * @param {'solid' | 'gradient' | 'image'} bgType
 * @param {boolean} continuousBackground
 * @param {'cover' | 'repeat'} bgImageFit
 * @returns {string}
 */
export function getBackgroundRepeat(bgType, continuousBackground, bgImageFit) {
  if (bgType === 'image') {
    if (continuousBackground) return 'repeat-x';
    return bgImageFit === 'repeat' ? 'repeat' : 'no-repeat';
  }
  return 'no-repeat';
}
