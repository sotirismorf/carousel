// Dimension presets for Instagram formats
export const DIMENSIONS = {
  square: { width: 1080, height: 1080, label: 'Square (1:1)' },
  portrait: { width: 1080, height: 1350, label: 'Portrait (4:5)' },
  landscape: { width: 1080, height: 608, label: 'Landscape (16:9)' },
};

// Corner watermark positions
export const CORNERS = [
  { key: 'topLeft', label: 'Top Left', short: 'TL' },
  { key: 'topRight', label: 'Top Right', short: 'TR' },
  { key: 'bottomLeft', label: 'Bottom Left', short: 'BL' },
  { key: 'bottomRight', label: 'Bottom Right', short: 'BR' },
];

// Export quality scale options
export const EXPORT_SCALES = [
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
export const DEFAULT_CORNER = {
  enabled: false,
  type: 'text',
  text: '',
  image: null,
  size: 24,
};

// Predefined positions for gradient mesh blobs
export const MESH_POSITIONS = [
  '40% 20%',
  '80% 0%',
  '0% 50%',
  '80% 50%',
  '0% 100%',
  '80% 100%',
  '0% 0%',
];
