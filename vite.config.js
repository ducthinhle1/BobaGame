import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The game ships as ONE self-contained index.html (styles and script inlined),
// so the same build works on Netlify, itch.io, GitHub Pages or as a Claude artifact.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { target: 'es2019', assetsInlineLimit: 100_000_000 },
});
