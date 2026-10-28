// Explicit manual snapshot: one small viewport per state and selected localities.
import {writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {handleApi} from '../lib/api.mjs';
import {MEXICO_PLACES} from '../lib/regions.mjs';
import {NETWORK_MODES} from '../lib/network.mjs';
import {inspectNetwork,inspectStations} from './audit-europe.mjs';
const [phase,origin,output,...ids]=process.argv.slice(2);
if(!['network','stations'].includes(phase)||!origin||!output)throw Error('Usage: node scripts/audit-mexico.mjs network|stations local|https://api-origin /absolute/output-directory [place IDs]');
await mkdir(output,{recursive:true});const startedAt=new Date().toISOString(),results=[];
for(const place of MEXICO_PLACES.filter(p=>!ids.length||ids.includes(p.id))){
 const [lat,lon]=place.centre,bounds=[lat-.012,lon-.018,lat+.012,lon+.018].map(v=>Number(v.toFixed(5))),params=phase==='network'?{bbox:bounds.join(','),modes:NETWORK_MODES.map(m=>m.id).join(','),detail:'all'}:{q:place.label,region:'mexico',source:'auto',near:place.centre.join(',')},url=new URL('/api/'+phase+'?'+new URLSearchParams(params),origin==='local'?'https://railatlas.local':origin),request=new Request(url,{headers:{Origin:'https://dunkelst.github.io'},signal:AbortSignal.timeout(90000)}),start=Date.now();
 let result={id:place.id,place:place.label,bounds,timeZone:place.timeZone};
 try{const response=origin==='local'?await handleApi(request):await fetch(request),text=await response.text(),data=JSON.parse(text);await writeFile(output+'/'+place.id+'.json.gz',gzipSync(text));Object.assign(result,{status:response.status,cors:response.headers.get('access-control-allow-origin'),error:data.error||null});if(response.ok)Object.assign(result,phase==='network'?inspectNetwork(data,bounds):{count:data.stations.length,errors:inspectStations(data.stations,place.label)},phase==='network'?{warning:data.warning||'',source:data.source}:{});}catch(error){result.error=error.message;}
 result.elapsedMs=Date.now()-start;results.push(result);await writeFile(output+'/results.json',JSON.stringify({phase,origin,startedAt,finishedAt:new Date().toISOString(),results},null,2)+'\n');console.log(JSON.stringify(result));await new Promise(resolve=>setTimeout(resolve,1000));
}
