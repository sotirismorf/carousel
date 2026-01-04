# CLAUDE.md

## Important

Always run `npm run dev` in the background at the start of each session.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Build for production
```

## Architecture

Svelte 5 + Vite app that converts markdown into Instagram carousel images.

### Key Files
```
src/
├── App.svelte                    # Main app, dark mode root
├── lib/
│   ├── Slide.svelte              # Slide renderer
│   ├── components/
│   │   ├── FormatControls.svelte
│   │   ├── TextControls.svelte
│   │   ├── BackgroundControls.svelte
│   │   └── CornerControls.svelte
│   └── utils/
│       ├── constants.js          # DIMENSIONS, CORNERS, EXPORT_SCALES
│       ├── color.js              # Color generation
│       ├── background.js         # Background computation
│       ├── markdown.js           # Markdown parsing
│       └── export.js             # PNG/ZIP export
```

## Svelte 5 Patterns

This project uses Svelte 5 runes. Always use:

```svelte
<script>
  // Props with $props() - use $bindable() for two-way binding
  let { value = $bindable(), onClick } = $props();

  // State with $state
  let count = $state(0);

  // Derived values with $derived
  const doubled = $derived(count * 2);
</script>
```

**Never use** legacy Svelte 4 syntax (`export let`, `$:` reactive statements).

## shadcn-svelte

### Installed Components
button, input, label, select, separator, switch, slider

### Add Components
```bash
npx shadcn-svelte@latest add [component-name]
```

### Import Pattern
```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import * as Select from '$lib/components/ui/select';
</script>
```

### Theming - CRITICAL

This app uses **dark mode**. The root element has `class="dark"`.

**Always use semantic color classes, never hardcoded colors:**

| Wrong | Correct |
|-------|---------|
| `text-zinc-500` | `text-muted-foreground` |
| `text-zinc-400` | `text-muted-foreground` |
| `border-zinc-700` | `border-border` or `border-input` |
| `bg-zinc-800` | `bg-muted` |
| `bg-zinc-900` | `bg-background` |
| `bg-zinc-950` | `bg-card` |

**Dark mode CSS variables must use semi-transparent borders:**
```css
.dark {
  --border: oklch(1 0 0 / 10%);  /* NOT solid colors */
  --input: oklch(1 0 0 / 15%);
}
```

If components have white outlines or look wrong, check:
1. Root element has `class="dark"`
2. CSS uses correct dark mode variables from shadcn docs
3. Components use semantic classes, not hardcoded zinc colors

## MCP Tools

### Context7 - shadcn-svelte Docs

**Library ID:** `/llmstxt/shadcn-svelte_llms_txt`

```
mcp__plugin_context7_context7__query-docs
  libraryId: /llmstxt/shadcn-svelte_llms_txt
  query: "your question here"
```

**When to query Context7:**
- Adding new shadcn components
- Theming/CSS variable issues
- Component API questions
- Installation/configuration problems

**Example queries:**
- "Button component variants and sizes"
- "Dark mode CSS variables theming"
- "Select component usage with bind:value"
- "How to customize component styles"

### Context7 - Other Libraries

To find library IDs for other packages:
```
mcp__plugin_context7_context7__resolve-library-id
  libraryName: "package-name"
  query: "what you're trying to do"
```

### Svelte MCP Server

For Svelte 5 / SvelteKit documentation:
1. **list-sections** - Discover available doc sections
2. **get-documentation** - Fetch specific sections
3. **svelte-autofixer** - Validate Svelte code before presenting to user

## Svelte expertice

### Focus Areas

- Deep understanding of Svelte's reactivity and component lifecycle
- Proficient in writing modular and reusable components
- Expertise in Svelte Stores for state management
- Optimization of Svelte applications for performance
- Mastery of Svelte transitions and animations
- Knowledge of compiling Svelte for production
- Handling form validation and input binding in Svelte
- Using the Svelte context API effectively
- Testing Svelte components with appropriate tools
- Debugging Svelte applications and handling errors

### Approach

- Embrace Svelte's unidirectional data flow for simplicity
- Use the Svelte REPL for rapid iterations and prototyping
- Maintain a clean component hierarchy for better readability
- Design components with accessibility (a11y) in mind
- Leverage built-in Svelte directives (`if`, `each`, `await`) effectively
- Ensure CSS encapsulation to avoid style conflicts
- Avoid prop drilling by using Svelte Stores
- Optimize bindings and avoid unnecessary re-renders
- Provide clear documentation and inline comments
- Keep up with the latest Svelte updates and best practices

### Quality Checklist

- Verify all key features are implemented in a Svelte-native way
- Ensure components are isolated and reusable
- Validate strong typing conventions (TypeScript) if applicable
- Confirm all animations are smooth and performant
- Adhere to Svelte style guide in naming conventions and syntax
- Test for responsive design across all devices
- Execute a thorough code review focused on Svelte idiosyncrasies
- Implement and test comprehensive component tests
- Conduct performance analysis and refactor inefficient code
- Check for unused imports and dead code

### Output

- High-quality Svelte components with idiomatic code
- Complete and detailed component documentation
- Test suite covering major component logic
- Performance-optimized client-side code
- Clear error messages and graceful error handling
- Responsive design across devices and screen sizes
- Structured and maintainable state management
- Reusable animations and transitions in Svelte native way
- Up-to-date applications with latest Svelte practices
- Seamless integration with Svelte's build tools and compiled outputs
