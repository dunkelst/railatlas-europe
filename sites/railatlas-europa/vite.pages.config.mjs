import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig(({mode}) => {
const standalone = mode === 'standalone';
const base = standalone ? '/' : '/railatlas-europe/';
const apiOrigin = process.env.RAILATLAS_API_ORIGIN || '';
return {
  root: path.join(root, 'github-pages'),
  base,
  publicDir: path.join(root, 'public'),
  resolve: {alias: {'@': root}},
  css: {postcss: root},
  build: {outDir: path.join(root, standalone ? 'dist-standalone' : 'dist-pages'), emptyOutDir: true},
  plugins: [
    react(),
    {
      name: 'railatlas-pages-runtime',
      transformIndexHtml(html) {
        return html.replace('__RAILATLAS_CONFIG_JSON__', JSON.stringify({basePath: base, apiOrigin, requiresApiOrigin: !standalone}));
      },
      generateBundle() {
        this.emitFile({type: 'asset', fileName: '.nojekyll', source: ''});
        this.emitFile({type: 'asset', fileName: 'service-worker.js', source: `self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('railatlas-europe-'))await caches.delete(key);await self.registration.unregister();})()));`});
      },
    },
  ],
};
});
