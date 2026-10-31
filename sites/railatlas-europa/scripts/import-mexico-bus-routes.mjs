// Retain only supplied operator map data; no route or timetable synthesis.
// Usage: node scripts/import-mexico-bus-routes.mjs source-responses.json.gz
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync,gzipSync} from 'node:zlib';
import {parseAhorroNetwork,mergeNetworkStops,NETWORK_MODES} from '../lib/network.mjs';
const file=process.argv[2];if(!file)throw Error('Supply the recorded anonymous operator responses.');
const bytes=fs.readFileSync(file),source=JSON.parse(file.endsWith('.gz')?gunzipSync(bytes):bytes.toString());let extra=null;
for(const c of source.cases||[])extra=mergeNetworkStops(extra,parseAhorroNetwork(c.raw,c.id,c.retrievedAt.slice(0,10)),['bus']);
if(!extra)throw Error('No supplied operator routes.');
const path=new URL('../lib/mexico-network-data.mjs',import.meta.url),text=fs.readFileSync(path,'utf8'),base=JSON.parse(gunzipSync(Buffer.from(JSON.parse(text.slice(text.indexOf('export default ')+15).trim().replace(/;$/,'')),'base64')));
const result=mergeNetworkStops(base,extra,NETWORK_MODES.map(m=>m.id));
const attribution={id:'ahorrobus-oriente',publisher:'Mobility ADO / Ahorrobus / Oriente',url:'https://ahorrobus.com.mx/es/quintana-roo',sourceDate:source.cases[0].retrievedAt.slice(0,10),retrieved:source.cases[0].retrievedAt.slice(0,10),license:null,sha256:createHash('sha256').update(bytes).digest('hex'),routes:source.cases.map(c=>c.id),notes:'Operator-supplied map geometry and named stops. No dated operating times, disruptions or seats. Original operator rights remain applicable; no open-data licence stated. The hash identifies the retained source extract.'};
result.sources=[...(base.sources||[]).filter(s=>s.id!==attribution.id),attribution];
fs.writeFileSync(path,text.slice(0,text.indexOf('export default '))+'export default '+JSON.stringify(gzipSync(JSON.stringify(result),{mtime:0}).toString('base64'))+';\n');
const sourcesPath=new URL('../public/data/mexico-sources.json',import.meta.url),sources=JSON.parse(fs.readFileSync(sourcesPath));fs.writeFileSync(sourcesPath,JSON.stringify([...sources.filter(s=>s.id!==attribution.id),attribution],null,2)+'\n');
console.log(JSON.stringify({routes:extra.layers.bus.lines.length,stops:extra.layers.bus.stops.length,sha256:attribution.sha256}));
