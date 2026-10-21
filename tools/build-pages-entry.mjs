import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/sites-source-manifest.json'),'utf8'));
const url=new URL(manifest.site_url);
if(url.protocol!=='https:'||!url.hostname.endsWith('.chatgpt.site')||url.username||url.password||url.search||url.hash)throw Error('Expected the private Sites origin.');
const target=url.href;
const out=path.join(root,'.pages-dist');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),`<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="1;url=${target}"><title>RailAtlas Europa · Private App öffnen</title>
<style>:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#101b20;color:#edf3ef}body{max-width:38rem;margin:15vh auto;padding:24px}h1{font-size:2.4rem}a{display:inline-block;background:#b0f18b;color:#14241a;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:700}p{line-height:1.6;color:#b8c9c9}small{display:block;margin-top:24px;color:#91a2a7}</style></head>
<body><main><h1>RailAtlas Europa</h1><p>Die aktuelle Fahrplanauskunft läuft in deiner privaten App. Du wirst dorthin weitergeleitet; die Anmeldung bleibt erforderlich.</p><a href="${target}" rel="noreferrer">Private RailAtlas-App öffnen</a><p>Diese GitHub-Seite führt zur aktuellen App. Sie führt selbst keine Fahrplanabfragen aus.</p><small>Quellstand: Sites-Version ${Number(manifest.site_version)} · ${manifest.site_source_commit.slice(0,12)}</small></main>
<script>if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.filter(r=>r.scope===new URL('./',location.href).href).map(r=>r.unregister()))).catch(()=>{});}location.replace(${JSON.stringify(target)});</script></body></html>`);
// Retire the old Pages service worker for existing installations as well.
fs.writeFileSync(path.join(out,'service-worker.js'),`self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('railatlas-europe-'))await caches.delete(key);await self.registration.unregister();for(const client of await self.clients.matchAll({type:'window'}))if(client.url.startsWith(self.registration.scope))await client.navigate(${JSON.stringify(target)});})()));`);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Pages entry prepared for private Sites version '+manifest.site_version);
