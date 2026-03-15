import type { Config } from '@sveltejs/kit';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config: Config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: 'index.html',
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/carousel' : '',
		},
	},
};

export default config;
