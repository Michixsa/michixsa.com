// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://michixsa.com',
  // Cloudflare Pages serves `/path/` from `path/index.html`; matching it here
  // keeps local links, the link checker and production URLs identical.
  trailingSlash: 'always',
  // The stylesheet is only a few KB; inlining it removes the one
  // render-blocking request, which dominates first paint on slow CI runners.
  build: { format: 'directory', inlineStylesheets: 'always' },
});
