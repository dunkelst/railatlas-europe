// Manual bounded diagnostic; the public app shares its line parser.
// Public source and attribution requirements: https://transitous.org/api/
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {validateBounds,parseTransitousRoutes} from '../lib/network.mjs';

const origin='https://api.transitous.org';
export const attribution=['https://transitous.org/sources/','https://www.openstreetmap.org/copyright'];
export function prototypeStops(data,bounds){
 if(!Array.isArray(data))throw Error('Invalid MOTIS stops response');
 return data.filter(s=>typeof s.stopId==='string'&&s.name&&s.modes?.includes('BUS')&&[s.lat,s.lon].every(Number.isFinite)&&s.lat>=bounds[0]&&s.lon>=bounds[1]&&s.lat<=bounds[2]&&s.lon<=bounds[3]).map(s=>({id:s.stopId,name:s.name,lat:s.lat,lon:s.lon,modes:s.modes}));
}
export function prototypeRoutes(data,bounds){
 return parseTransitousRoutes(data,bounds,['bus']).layers.bus.lines;
}
async function request(endpoint,params,signal){
 const url=new URL(endpoint,origin);url.search=new URLSearchParams(params);
 const response=await fetch(url,{signal,headers:{Accept:'application/json','User-Agent':'RailAtlas-Europa/23 prototype (+https://github.com/dunkelst/railatlas-europe)'}});
 if(!response.ok)throw Error('Transitous HTTP '+response.status);
 const reader=response.body.getReader(),parts=[];let bytes=0;
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>8*1024*1024){await reader.cancel();throw Error('Prototype response exceeds 8 MB');}parts.push(value);}
 const buffer=new Uint8Array(bytes);let offset=0;for(const part of parts){buffer.set(part,offset);offset+=part.length;}
 return JSON.parse(new TextDecoder().decode(buffer));
}
export async function probeTransitous(bounds,{routes=false,signal=AbortSignal.timeout(25000)}={}){
 validateBounds(bounds);
 const [s,w,n,e]=bounds,box={min:s+','+w,max:n+','+e},raw=await request('/api/v6/map/stops',{...box,modes:'BUS',grouped:'true'},signal);
 const report={prototype:true,source:'Transitous / MOTIS',bounds,attribution,stops:prototypeStops(raw,bounds),lines:[]};
 if(routes)report.lines=prototypeRoutes(await request('/api/experimental/map/routes',{...box,zoom:'18'},signal),bounds);
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const bounds=(process.argv[2]||'').split(',').map(Number),output=process.argv[3];
 if(!output)throw Error('Usage: node scripts/probe-transitous.mjs south,west,north,east output.json [--routes]');
 const report=await probeTransitous(bounds,{routes:process.argv.includes('--routes')});
 await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({prototype:true,stops:report.stops.length,lines:report.lines.length,calculatedLines:report.lines.filter(l=>l.calculated).length,attribution,output}));
}
