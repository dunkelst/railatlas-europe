// Explicit, bounded manual acceptance run; never imported by the application.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {normalize,unpack,searchStations,distanceKm} from '../lib/rail.mjs';
import {handleApi} from '../lib/api.mjs';

// One small city-centre viewport per jurisdiction, including catalogue gaps.
// These coordinates define test inputs, never production routes or coverage.
export const cases=[
 ['AD','Andorra la Vella',42.5078,1.5211],['AL','Tirana',41.3275,19.8187],
 ['AM','Yerevan',40.178,44.513],['AT','Wien',48.2082,16.3738],
 ['AZ','Baku',40.3777,49.8508],['BA','Sarajevo',43.8585,18.413],
 ['BE','Bruxelles',50.8466,4.3528],['BG','София',42.6977,23.3219],
 ['BY','Мінск',53.9006,27.559],['CH','Zürich',47.3769,8.5417],
 ['CY','Lefkosia',35.169,33.361],['CZ','Praha',50.081,14.425],
 ['DE','Berlin',52.52,13.405],['DK','København',55.6761,12.5683],
 ['EE','Tallinn',59.437,24.7536],['ES','Madrid',40.4168,-3.7038],
 ['FI','Helsinki',60.1699,24.9384],['FR','Paris',48.8566,2.3522],
 ['GB','London',51.5074,-.1278],['GE','თბილისი',41.7151,44.8271],
 ['GR','Αθήνα',37.9755,23.7348],['HR','Zagreb',45.812,15.977],
 ['HU','Budapest',47.4979,19.0402],['IE','Dublin',53.3498,-6.2603],
 ['IS','Reykjavík',64.1466,-21.9426],['IT','Roma',41.9028,12.4964],
 ['LI','Vaduz',47.141,9.5215],['LT','Vilnius',54.6872,25.2797],
 ['LU','Luxembourg',49.6116,6.1319],['LV','Rīga',56.9496,24.1052],
 ['MC','Monaco',43.7384,7.4246],['MD','Chișinău',47.0105,28.8638],
 ['ME','Podgorica',42.4304,19.2594],['MK','Скопје',41.9981,21.4254],
 ['MT','Valletta',35.8989,14.5146],['NL','Amsterdam',52.3731,4.8922],
 ['NO','Oslo',59.9139,10.7522],['PL','Warszawa',52.2297,21.0122],
 ['PT','Lisboa',38.7223,-9.1393],['RO','București',44.4268,26.1025],
 ['RS','Београд',44.8176,20.4633],['RU','Москва',55.7558,37.6173],
 ['SE','Stockholm',59.3293,18.0686],['SI','Ljubljana',46.0569,14.5058],
 ['SK','Bratislava',48.1486,17.1077],['SM','San Marino',43.9367,12.4464],
 ['TR','İstanbul',41.0082,28.9784],['UA','Київ',50.4501,30.5234],
 ['VA','Vaticano',41.9022,12.4539],['XK','Prishtina',42.6629,21.1655],
].map(([country,query,lat,lon])=>({country,query,lat,lon,bounds:[lat-.012,lon-.018,lat+.012,lon+.018].map(v=>Math.round(v*1e5)/1e5)}));
const modes=['rail','suburban','subway','tram','bus'];
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180;
export function inspectNetwork(data,bounds){
 const errors=[],counts={};
 if(!data||!data.layers)return {errors:['missing layers'],counts};
 for(const mode of modes){
  const layer=data.layers[mode];if(!Array.isArray(layer?.stops)||!Array.isArray(layer?.lines)){errors.push(mode+': malformed layer');continue;}
  counts[mode]={stops:layer.stops.length,paths:layer.lines.length,calculated:layer.lines.filter(l=>l.calculated).length};
  for(const field of ['stops','lines'])if(new Set(layer[field].map(x=>x.id)).size!==layer[field].length)errors.push(mode+': duplicate '+field+' IDs');
  for(const s of layer.stops){
   if(typeof s.name!=='string'||!s.name.trim()||!point([s.lat,s.lon]))errors.push(mode+': invalid stop');
   if(s.lat<bounds[0]||s.lon<bounds[1]||s.lat>bounds[2]||s.lon>bounds[3])errors.push(mode+': stop outside response bounds');
   if(s.station&&(s.station.lat!==s.lat||s.station.lon!==s.lon))errors.push(mode+': stop/station coordinates differ');
   if(s.station?.transitousId&&(s.station.id!=='transitous:'+s.station.transitousId||s.station.dbId))errors.push(mode+': foreign station ID namespace');
  }
  for(const l of layer.lines){
   if(!l.segments?.length||l.segments.some(s=>!Array.isArray(s)||s.length<2||s.some(p=>!point(p))))errors.push(mode+': invalid path');
   if(l.pathSource==='ROUTED'&&!l.calculated)errors.push(mode+': unlabelled calculated path');
  }
 }
 return {errors:[...new Set(errors)],counts};
}
export function inspectStations(stations,query){
 const errors=[];
 for(const s of stations){
  if(typeof s.name!=='string'||!s.name.trim()||!point([s.lat,s.lon]))errors.push('invalid station');
  if(s.country&&!/^[A-Z]{2}$/.test(s.country))errors.push('invalid country');
  if(s.dbId&&!/^\d{6,9}$/.test(s.dbId))errors.push('invalid DB key');
 }
 if(query.trim()&&!normalize(query))errors.push('query loses every letter');
 return [...new Set(errors)];
}
export function inspectJourneys(journeys,requested){
 const errors=[];
 for(const j of journeys){
  if(!j.legs?.length||Date.parse(j.departure)<Date.parse(requested)||!Number.isFinite(Date.parse(j.arrival)))errors.push('invalid journey time');
  for(let i=0;i<(j.legs||[]).length;i++){
   const l=j.legs[i];if(!Number.isFinite(Date.parse(l.departure))||!Number.isFinite(Date.parse(l.arrival))||Date.parse(l.arrival)<Date.parse(l.departure)||i&&Date.parse(l.departure)<Date.parse(j.legs[i-1].arrival))errors.push('invalid leg chronology');
   if(l.cancelled)errors.push('cancelled leg accepted');
   if(!point([l.from?.lat,l.from?.lon])||!point([l.to?.lat,l.to?.lon]))errors.push('invalid endpoint');
   if(!l.mode||l.mode==='unknown'||l.walking!==(l.mode==='walk'))errors.push('inconsistent mode');
   if(!Array.isArray(l.geometry?.segments)||l.geometry.segments.some(s=>s.length<2||s.some(p=>!point(p))))errors.push('invalid geometry');
   if(l.geometry?.status==='missing'&&l.geometry.segments.length)errors.push('missing geometry contains path');
  }
 }
 return [...new Set(errors)];
}
async function run(){
 const [phase,origin,output,...selected]=process.argv.slice(2);
 if(!['network','stations','journeys'].includes(phase)||!origin||!output)throw Error('Usage: node scripts/audit-europe.mjs network|stations|journeys https://api-origin /absolute/output-directory [country codes]');
 const local=origin==='local',base=new URL(local?'http://railatlas.local':origin);if(!['https:','http:'].includes(base.protocol))throw Error('Invalid API origin');
 await mkdir(output,{recursive:true});
 const catalogue=unpack(JSON.parse(await readFile(new URL('../public/data/stations.json',import.meta.url),'utf8')));
 const results=[],requested='2026-10-31T09:00:00.000Z';
 for(const c of cases.filter(c=>!selected.length||selected.includes(c.country))){
  const started=Date.now(),url=new URL('/api/'+(phase==='network'?'network':phase==='stations'?'stations':'journeys'),base),init={headers:{Origin:'https://dunkelst.github.io','User-Agent':'RailAtlas-Europa/29 audit (+https://github.com/dunkelst/railatlas-europe)'},signal:AbortSignal.timeout(100000)};
  let endpoints;
  if(phase==='network')url.search=new URLSearchParams({bbox:c.bounds.join(','),modes:modes.join(','),detail:'all'});
  if(phase==='stations')url.search=new URLSearchParams({q:c.query,source:'auto'});
  if(phase==='journeys'){
   // Two actual catalogue stations 10–100 km apart; record exact chosen inputs.
   const local=catalogue.filter(s=>s.country===c.country&&/^\d{7,9}$/.test(s.dbId||'')).sort((a,b)=>distanceKm(a,c)-distanceKm(b,c));
   const a=local[0],b=a&&local.find(s=>distanceKm(a,s)>10&&distanceKm(a,s)<100);
   if(!a||!b){results.push({country:c.country,query:c.query,skipped:'No two suitable catalogue stations'});continue;}
   endpoints={from:a,to:b,departure:requested,source:'auto'};init.method='POST';init.headers['Content-Type']='application/json';init.body=JSON.stringify(endpoints);
  }
  let result={country:c.country,query:c.query,bounds:c.bounds,catalogueCount:catalogue.filter(s=>s.country===c.country).length,catalogueMatches:searchStations(catalogue,c.query).length,...(endpoints?{request:endpoints}:{})};
  try{
   const response=local?await handleApi(new Request(url,init)):await fetch(url,init),text=await response.text();await writeFile(path.join(output,c.country+'.json.gz'),gzipSync(text));
   const data=JSON.parse(text);result={...result,status:response.status,cors:response.headers.get('access-control-allow-origin'),error:data.error||null};
   if(response.ok){
    if(phase==='network')Object.assign(result,inspectNetwork(data,data.bounds||c.bounds),{source:data.source,warning:data.warning||'',coverage:data.coverage});
    if(phase==='stations')Object.assign(result,{errors:inspectStations(data.stations,c.query),count:data.stations.length,nearby:data.stations.filter(s=>distanceKm(s,c)<35).length,countries:[...new Set(data.stations.map(s=>s.country))],stations:data.stations});
    if(phase==='journeys')Object.assign(result,{errors:inspectJourneys(data.journeys,requested),count:data.journeys.length,sources:[...new Set(data.journeys.map(j=>j.source))],journeys:data.journeys.map(j=>({departure:j.departure,arrival:j.arrival,modes:j.legs.map(l=>l.mode),paths:j.legs.filter(l=>l.geometry.segments.length).length,legs:j.legs.length}))});
   }
  }catch(e){result.error=e.message;}
  result.elapsedMs=Date.now()-started;results.push(result);
  await writeFile(path.join(output,'results.json'),JSON.stringify({phase,origin:local?'local shared API':base.origin,startedAt:globalThis.auditStartedAt,finishedAt:new Date().toISOString(),results},null,2)+'\n');
  console.log(JSON.stringify({country:c.country,status:result.status,count:result.count,counts:result.counts,errors:result.errors,error:result.error,elapsedMs:result.elapsedMs}));
  // Explicit manual run, one case at a time, no retries or provider bypass.
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){globalThis.auditStartedAt=new Date().toISOString();await run();}
