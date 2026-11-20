import { defineConfig } from 'astro/config';

// The site can live at a domain root or under a sub-path (GitHub Pages).
// Set SITE_URL and BASE_PATH in the deploy environment; local defaults are root.
const site = process.env.SITE_URL ?? 'https://vitali-lab.github.io';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  compressHTML: true,
  devToolbar: { enabled: false },
  build: {
    format: 'directory',
  },
});
