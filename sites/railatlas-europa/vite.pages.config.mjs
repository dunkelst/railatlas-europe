import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const base = '/railatlas-europe/';
const apiOrigin = 'https://railatlas-europa.cocoaamber33.chatgpt.site';

export default defineConfig({
  root: path.join(root, 'github-pages'),
  base,
  publicDir: path.join(root, 'public'),
  resolve: {alias: {'@': root}},
  css: {postcss: root},
  build: {outDir: path.join(root, 'dist-pages'), emptyOutDir: true},
  plugins: [
    react(),
    {
      name: 'railatlas-pages-runtime',
      transformIndexHtml(html) {
        return html.replace('__RAILATLAS_CONFIG_JSON__', JSON.stringify({basePath: base, apiOrigin}));
      },
      generateBundle() {
        this.emitFile({type: 'asset', fileName: '.nojekyll', source: ''});
        this.emitFile({type: 'asset', fileName: 'service-worker.js', source: `self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('railatlas-europe-'))await caches.delete(key);await self.registration.unregister();})()));`});
      },
    },
  ],
});
