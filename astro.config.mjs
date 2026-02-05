// @ts-check
import { defineConfig } from 'astro/config';

import preload from 'astro-preload';

// https://astro.build/config
export default defineConfig({
  output: 'static',

  vite: {
    envDir: '.',
  },

  integrations: [preload()],
});