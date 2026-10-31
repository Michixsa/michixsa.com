// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages serves `/path/` from `path/index.html`; matching it here
  // keeps local links, the link checker and production URLs identical.
  trailingSlash: 'always',
  build: { format: 'directory' },
});
