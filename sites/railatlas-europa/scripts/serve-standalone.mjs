import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleApi} from '../lib/api.mjs';

const root = fileURLToPath(new URL('../dist-standalone/', import.meta.url));
const mime = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2'};
export function createStandaloneServer({staticRoot = root, api = handleApi, publicOrigin = process.env.PUBLIC_ORIGIN || ''} = {}) {
  return http.createServer(async (req, res) => {
    const controller = new AbortController();
    res.on('close', () => {if (!res.writableEnded) controller.abort();});
    try {
      const url = new URL(req.url, publicOrigin || 'http://' + (req.headers.host || 'localhost'));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (url.pathname.startsWith('/api/')) {
        const chunks = []; let size = 0;
        for await (const chunk of req) {size += chunk.length; if (size > 20000) {res.writeHead(413, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}); res.end(JSON.stringify({error: 'Die Anfrage ist zu groß.'})); return;} chunks.push(chunk);}
        const request = new Request(url, {method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? {body: Buffer.concat(chunks)} : {}), signal: controller.signal});
        const response = await api(request);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer())); return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) {res.writeHead(405, {Allow: 'GET, HEAD'}); res.end(); return;}
      const pathname = decodeURIComponent(url.pathname);
      const target = path.resolve(staticRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!target.startsWith(path.resolve(staticRoot) + path.sep) || pathname.includes('\0')) {res.writeHead(403); res.end(); return;}
      let info; try {info = await stat(target);} catch {res.writeHead(404); res.end('Datei nicht gefunden. Zuerst npm run build:standalone ausführen.'); return;}
      if (!info.isFile()) {res.writeHead(404); res.end(); return;}
      res.writeHead(200, {'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': path.extname(target) === '.html' ? 'no-store' : 'public, max-age=3600'});
      if (req.method === 'HEAD') res.end(); else createReadStream(target).on('error', () => res.destroy()).pipe(res);
    } catch {if (!res.headersSent) res.writeHead(500, {'Content-Type': 'application/json'}); res.end(JSON.stringify({error: 'Die Anfrage konnte nicht verarbeitet werden.'}));}
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000), host = process.env.HOST || '127.0.0.1';
  const server = createStandaloneServer();
  server.listen(port, host, () => console.log(`RailAtlas Europa: http://${host}:${port} · eigenständige Auskunft`));
}
