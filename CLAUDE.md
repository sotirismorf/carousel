# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Always run `npm run dev` in the background at the start of each session to keep the dev server running.

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

Svelte + Vite web app that converts markdown files into Instagram carousel images.

### Flow
1. User uploads `.md` file (drag & drop or file picker)
2. Markdown is split by `---` horizontal rules into slides
3. Each slide is rendered at user-selected dimensions (1080x1080, 1080x1350, or 1080x608)
4. Export converts slides to PNG using `html-to-image` and bundles them with `jszip`

### Key Files
- `src/App.svelte` - Main app with file input, dimension selector, export button
- `src/lib/Carousel.svelte` - Preview carousel with navigation and hidden full-size slides for export
- `src/lib/Slide.svelte` - Single slide renderer with markdown styling
- `src/lib/utils/markdown.js` - Split markdown by `---` and parse with `marked`
- `src/lib/utils/export.js` - Convert slide DOM nodes to PNG zip

### Dependencies
- `marked` - Markdown parsing
- `html-to-image` - DOM to PNG conversion
- `jszip` - ZIP file creation
- `file-saver` - Trigger browser download
