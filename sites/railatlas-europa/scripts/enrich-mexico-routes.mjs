// Restore source metadata discarded by older builds, without changing geometry.
// Usage: node scripts/enrich-mexico-routes.mjs original-relations.json.gz
import fs from 'node:fs';
import {gunzipSync,gzipSync} from 'node:zlib';
import {networkRouteInfo,networkMode} from '../lib/network.mjs';
const file=process.argv[2];if(!file)throw Error('Supply the original OSM relations JSON or gzip.');
const bytes=fs.readFileSync(file),source=JSON.parse(file.endsWith('.gz')?gunzipSync(bytes):bytes.toString()),routes=new Map(),stops=new Map();
for(const relation of source.elements||[]){
 if(relation.type!=='relation'||!networkMode(relation.tags))continue;
 const route=networkRouteInfo(relation);routes.set(route.id,route);
 for(const member of relation.members||[]){if(!/^(stop|platform)(_|$)/.test(member.role||''))continue;const id=member.type+'/'+member.ref;if(!stops.has(id))stops.set(id,[]);stops.get(id).push({...route,boardingAllowed:!/(^|_)exit_only$/.test(member.role||''),alightingAllowed:!/(^|_)entry_only$/.test(member.role||'')});}
}
const root=new URL('../',import.meta.url),paths=[new URL('lib/mexico-network-data.mjs',root),...fs.readdirSync(new URL('lib/mexico-osm-tiles/',root)).filter(p=>p.endsWith('.mjs')).map(p=>new URL('lib/mexico-osm-tiles/'+p,root))];let changed=0;
for(const path of paths){
 const code=fs.readFileSync(path,'utf8'),encoded=JSON.parse(code.slice(code.indexOf('export default ')+15).trim().replace(/;$/,'')),data=JSON.parse(gunzipSync(Buffer.from(encoded,'base64')));let touched=false;
 for(const [mode,layer] of Object.entries(data.layers)){
  for(const line of layer.lines){const route=routes.get(line.id);if(!route)continue;
   if(route.ref!==line.ref||route.name!==line.name||Date.parse(route.metadataSourceDate)>Date.parse(line.sourceDate||source.snapshotDate||'2026-10-28'))throw Error('Metadata no longer matches retained source geometry: '+line.id);
   Object.assign(line,route);touched=true;
  }
  for(const stop of layer.stops){const all=stops.get(stop.id);if(!all)continue;const byRoute=new Map();for(const route of all.filter(r=>r.mode===mode)){const previous=byRoute.get(route.id);byRoute.set(route.id,{...route,boardingAllowed:Boolean(previous?.boardingAllowed)||route.boardingAllowed,alightingAllowed:Boolean(previous?.alightingAllowed)||route.alightingAllowed});}const serving=[...byRoute.values()];if(serving.length){stop.servingRoutes=serving;stop.lines=[...new Set(serving.map(r=>r.ref).filter(Boolean))];}else stop.lines=stop.lines.filter(ref=>!all.some(r=>r.ref===ref));touched=true;}
 }
 if(touched){const packed=gzipSync(JSON.stringify(data),{mtime:0}).toString('base64');fs.writeFileSync(path,code.slice(0,code.indexOf('export default '))+'export default '+JSON.stringify(packed)+';\n');changed++;}
}
console.log(JSON.stringify({relations:routes.size,files:changed}));
