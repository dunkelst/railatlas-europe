import {localBerlinISO,berlinInput,distanceKm,normalize} from './rail.mjs';
import {hafasTime,routeGeometry,transportProduct,noticeReferences,parseNotices,mergeNotices} from './transit.mjs';
export {hafasTime} from './transit.mjs';
const countryCodes={80:'DE',81:'AT',82:'LU',83:'IT',84:'NL',85:'CH',86:'DK',87:'FR',88:'BE',70:'GB',71:'ES',94:'PT',51:'PL',54:'CZ',55:'HU',56:'SK'};
function timestamp(s){if(!s)return null;if(/(Z|[+-]\d\d:\d\d)$/.test(s))return new Date(s).toISOString();return localBerlinISO(s.slice(0,19));}
function attr(lid,key){return new RegExp('(?:^|@)'+key+'=([^@]+)').exec(lid||'')?.[1];}
export function parseStation(raw,fallbacks=[]){const o=raw?.ort||raw?.station||raw||{},lid=o.lid||o.id||'',id=String(o.extId||attr(lid,'L')||'');const old=fallbacks.find(s=>s.dbId===id||s.name===o.name);const lat=Number(o.lat??o.latitude??o.coordinate?.x??(o.crd?.y!==undefined?o.crd.y/1e6:undefined)??(attr(lid,'Y')?Number(attr(lid,'Y'))/1e6:old?.lat)),lon=Number(o.lon??o.longitude??o.coordinate?.y??(o.crd?.x!==undefined?o.crd.x/1e6:undefined)??(attr(lid,'X')?Number(attr(lid,'X'))/1e6:old?.lon));return {id:id||o.name||'unknown',dbId:id,name:o.name||attr(lid,'O')||old?.name||'Halt',country:o.country||old?.country||countryCodes[id.slice(0,2)]||'',lat:Number.isFinite(lat)?lat:null,lon:Number.isFinite(lon)?lon:null,main:false};}
function notes(o){return [...(o.risNotizen||[]),...(o.himMeldungen||[]),...(o.priorisierteMeldungen||[])].map(n=>n.text||n.value||n.ueberschrift||n.titel||n.kurzText||'').filter(t=>typeof t==='string'&&t.length).map(t=>t.replace(/<[^>]*>/g,'').slice(0,1500)).slice(0,8);}
export function sameStation(a,b){
 // OSM stops often omit the city prefix supplied by the timetable provider.
 // Restrict this rule to map selections and a small station complex (250 m).
 if([a,b].some(s=>typeof s?.id==='string'&&s.id.startsWith('osm:'))){
  if(![a.lat,a.lon,b.lat,b.lon].every(Number.isFinite)||distanceKm(a,b)>.25)return false;
  const marker=/(?:\((?:U|S)\s*\d*\)|\s+(?:U|S))\s*$/i;
  const name=s=>normalize(s.name.replace(marker,'')).replace(/[^a-z0-9]+/g,' ').trim();
  const first=name(a),second=name(b),shorter=first.length<=second.length?first:second,longer=first.length>second.length?first:second;
  // Do not confuse an explicitly marked metro stop with a neighbouring bus/tram.
  for(const [map,provider] of [[a,b],[b,a]])if(typeof map.id==='string'&&map.id.startsWith('osm:')&&['bus','tram'].includes(map.networkMode)&&marker.test(provider.name))return false;
  return (!!first&&first===second)||(shorter.length>=5&&longer.endsWith(' '+shorter));
 }
 if(a.dbId&&a.dbId===b.dbId)return true;
 // Large stations have separate IDs for platforms, levels and S-Bahn stops.
 // Accept these only with matching names and verified physical proximity.
 const base=s=>normalize(s.replace(/\([^)]*\)/g,'').replace(/\bHauptbahnhof\b/gi,'Hbf'));
 if(base(a.name)===base(b.name)&&[a.lat,a.lon,b.lat,b.lon].every(Number.isFinite)&&distanceKm(a,b)<0.8)return true;
 // Some catalogue entries carry a local, six-digit key rather than an EVA ID.
 // Match station-name variants only inside the same small station complex.
 const stationKey=s=>normalize(s.name).replace(/\b(hauptbahnhof|hbf|bahnhof|am)\b/g,'').replace(/[^a-z0-9]/g,'');
 return (!/^\d{7,9}$/.test(a.dbId||'')||!/^\d{7,9}$/.test(b.dbId||''))&&stationKey(a).length>3&&stationKey(a)===stationKey(b)&&[a.lat,a.lon,b.lat,b.lon].every(Number.isFinite)&&distanceKm(a,b)<.3;
}
export function parseJourneys(data,from,to,requested){
 const parsed=[];
 for(const item of data.verbindungen||[]){try{const j=item.verbindung||item,all=[from,to];for(const m of (j.ctxRecon||'').matchAll(/A=1@[^$§¶]+/g))all.push(parseStation({id:m[0]}));const legs=[];
  for(const raw of j.verbindungsAbschnitte||[]){const stops=(raw.halte||raw.stops||[]).map(s=>parseStation(s,all));const first=(raw.halte||[])[0]||raw.startHalt||{},last=(raw.halte||[]).at(-1)||raw.zielHalt||{};const v=raw.verkehrsmittel||{};const walking=['WALK','FUSSWEG','TRANSFER'].includes(v.typ||raw.typ);const dep=raw.abfahrt||first.abfahrt||{},arr=raw.ankunft||last.ankunft||{};
   const departure=timestamp(raw.ezAbfahrtsZeitpunkt||dep.echtzeit||raw.abfahrtsZeitpunkt||dep.sollzeit||first.abgangsDatum),arrival=timestamp(raw.ezAnkunftsZeitpunkt||arr.echtzeit||raw.ankunftsZeitpunkt||arr.sollzeit||last.ankunftsDatum);if(!departure||!arrival)throw new Error('Fehlende Fahrplanzeit');
   const cancelled=!!(raw.originCancelled||raw.destinationCancelled||raw.cancelled||raw.canceled||first.cancelled||last.cancelled||dep.ausfall||arr.ausfall);
   legs.push({from:stops[0]||parseStation(raw.startHalt||{extId:raw.abfahrtsOrtExtId,name:raw.abfahrtsOrt},all),to:stops.at(-1)||parseStation(raw.zielHalt||{extId:raw.ankunftsOrtExtId,name:raw.ankunftsOrt},all),departure,arrival,plannedDeparture:timestamp(dep.sollzeit||raw.abfahrtsZeitpunkt),plannedArrival:timestamp(arr.sollzeit||raw.ankunftsZeitpunkt),line:walking?'Fußweg':v.mittelText||v.langText||v.name||'Zug',platform:first.ezGleis||first.gleis,arrivalPlatform:last.ezGleis||last.gleis,walking,cancelled,stops:stops.slice(1,-1),notes:notes(raw)});
  }
  if(!legs.length||legs.some((l,i)=>l.cancelled||Date.parse(l.arrival)<Date.parse(l.departure)||i&&Date.parse(l.departure)<Date.parse(legs[i-1].arrival)))continue;
  if(Date.parse(legs[0].departure)<Date.parse(requested)-1000)continue;
  if((j.risNotizen||[]).some(n=>String(n.key||'').includes('brokentrip')))continue;
  // Never silently return a nearby, different endpoint as the requested station.
  const start=legs[0].from,end=legs.at(-1).to;
  if(!sameStation(from,start)||!sameStation(to,end))continue;
  const transfers=Math.max(0,legs.filter(l=>!l.walking).length-1);
  parsed.push({departure:legs[0].departure,arrival:legs.at(-1).arrival,legs,transfers,source:'Deutsche Bahn',fetchedAt:new Date().toISOString()});
 }catch{/* A malformed alternative must not conceal valid connections. */}}
 return parsed.sort((a,b)=>Date.parse(a.arrival)-Date.parse(b.arrival)||Date.parse(a.departure)-Date.parse(b.departure));
}
const stationsCache=new Map();
export async function fetchJSON(url,init={},signal,timeout=16000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});try{if(signal?.aborted)controller.abort();const r=await fetch(url,{...init,signal:controller.signal,headers:{Accept:'application/json','User-Agent':'RailAtlas-Europa/1.0',...(init.headers||{})}});if(!r.ok)throw new Error('Fahrplandienst HTTP '+r.status);return await r.json();}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}}
// ÖBB's public HAFAS protocol profile is documented by hafas-client (ISC).
const hafasProfile={lang:'de',client:{type:'IPH',id:'OEBB',v:'6030600',name:'oebbPROD-ADHOC'},ver:'1.45',auth:{type:'AID',aid:'OWDL4fE4ixNiPBBm'}};
async function hafas(method,req,signal){const body=await fetchJSON('https://fahrplan.oebb.at/bin/mgate.exe',{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'RailAtlas-Europa/1.0 (+https://github.com/dunkelst/railatlas-europe)'},body:JSON.stringify({...hafasProfile,svcReqL:[{cfg:{polyEnc:'GPA'},meth:method,req}]})},signal,22000);const service=body.svcResL?.[0];if(body.err!=='OK'||service?.err!=='OK')throw new Error(service?.errTxt||body.errTxt||'Keine passende Fahrplanauskunft verfügbar.');return service.res;}
async function hafasMany(requests,signal){const body=await fetchJSON('https://fahrplan.oebb.at/bin/mgate.exe',{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'RailAtlas-Europa/1.0 (+https://github.com/dunkelst/railatlas-europe)'},body:JSON.stringify({...hafasProfile,svcReqL:requests.map(({method,req})=>({cfg:{polyEnc:'GPA'},meth:method,req}))})},signal,22000);if(body.err!=='OK')throw new Error(body.errTxt||'Der Störungsdienst ist nicht erreichbar.');return (body.svcResL||[]).map(service=>service?.err==='OK'?service.res:null);}
export async function findOnlineStations(query,signal){const key=normalize(query);if(stationsCache.has(key))return stationsCache.get(key);const data=await hafas('LocMatch',{input:{field:'S',loc:{type:'S',name:query+'?'},maxLoc:12}},signal);const locs=data.common?.locL||data.match?.locL||[];const result=locs.filter(s=>s.type==='S').map(s=>({...parseStation(s),lid:s.lid}));if(stationsCache.size>200)stationsCache.clear();stationsCache.set(key,result);return result;}
export async function resolveLid(station,signal){
 if(/^\d{7,9}$/.test(station.dbId||''))return `A=1@O=${station.name.replace(/[@$]/g,' ')}@X=${Math.round(station.lon*1e6)}@Y=${Math.round(station.lat*1e6)}@L=${station.dbId}@`;
 const data=await hafas('LocGeoPos',{ring:{cCrd:{x:Math.round(station.lon*1e6),y:Math.round(station.lat*1e6)},minDist:0,maxDist:800},getStops:true,getPOIs:false,maxLoc:20},signal);
 const matches=(data.locL||[]).filter(s=>s.type==='S').map(s=>({...parseStation(s),lid:s.lid})).filter(s=>sameStation(station,s));
 if(typeof station.id==='string'&&station.id.startsWith('osm:'))matches.sort((a,b)=>distanceKm(station,a)-distanceKm(station,b));
 const match=matches[0];
 if(!match){const error=new Error(`„${station.name}“ ist im Katalog erfasst, aber in dieser Fahrplanauskunft nicht eindeutig zugeordnet. Bitte einen Halt aus den Online-Vorschlägen oder die andere Auskunft wählen.`);error.code='STATION_NOT_FOUND';throw error;}
 return match.lid;
}
function platform(s,prefix,planned=false){const p=planned?(s[prefix+'PltfS']?.txt||s[prefix+'PlatfS']):(s[prefix+'PltfR']?.txt||s[prefix+'PlatfR']||s[prefix+'PltfS']?.txt||s[prefix+'PlatfS']);return typeof p==='string'?p:undefined;}
function endpointDisabled(raw,common,kind){return noticeReferences([raw]).some(ref=>ref.type==='REM'&&['text.realtime.stop.entry.exit.disabled',`text.realtime.stop.${kind}.disabled`].includes(common.remL?.[ref.remX]?.code));}
export function parseHafasJourneys(data,from,to,requested){
 const common=data.common||{},locations=(common.locL||[]).map(s=>parseStation(s)),products=common.prodL||[],output=[];
 for(const trip of data.outConL||[]){try{
  if(trip.isNotRdbl||trip.cancelled||trip.secL?.some(l=>l.type==='DEVI'||l.jny?.isRchbl===false))continue;
  const legs=(trip.secL||[]).map(raw=>{
   const d=raw.dep,a=raw.arr,j=raw.jny||{},walking=['WALK','TRSF','CHKI'].includes(raw.type);
   if(!walking&&raw.type!=='JNY')throw Error('Unbekannte Teilstrecke');
   const product=products[j.prodX]||{},departure=hafasTime(trip.date,d.dTimeR||d.dTimeS,d.dTZOffset),arrival=hafasTime(trip.date,a.aTimeR||a.aTimeS,a.aTZOffset),start=locations[d.locX],end=locations[a.locX];
   if(!start||!end||!departure||!arrival)throw Error('Unvollständige Teilstrecke');
   const scope=start.name+' → '+end.name,stopL=j.stopL||[];
   const refs=noticeReferences([raw,j,raw.gis,d,a,...stopL,{...common.locL?.[d.locX],locX:d.locX},{...common.locL?.[a.locX],locX:a.locX},...stopL.map(s=>({...common.locL?.[s.locX],locX:s.locX}))]);
   const notices=parseNotices(refs,common,locations,departure,arrival,scope);
   const stopovers=stopL.filter(s=>!s.passBy&&!(s.dInS===false&&s.aOutS===false)).map(s=>({station:locations[s.locX],departure:hafasTime(trip.date,s.dTimeR||s.dTimeS,s.dTZOffset),arrival:hafasTime(trip.date,s.aTimeR||s.aTimeS,s.aTZOffset),plannedDeparture:hafasTime(trip.date,s.dTimeS,s.dTZOffset),plannedArrival:hafasTime(trip.date,s.aTimeS,s.aTZOffset),platform:platform(s,'d')||platform(s,'a'),cancelled:!!(s.dCncl||s.aCncl),notices:parseNotices(noticeReferences([s,{...common.locL?.[s.locX],locX:s.locX}]),common,locations,departure,arrival,locations[s.locX]?.name||scope)})).filter(s=>s.station);
   const cancelled=!!(d.dCncl||a.aCncl||d.dInS===false||a.aOutS===false||stopL[0]?.dInS===false||stopL.at(-1)?.aOutS===false||j.cancelled||endpointDisabled(d,common,'entry')||endpointDisabled(a,common,'exit')||endpointDisabled(stopL[0],common,'entry')||endpointDisabled(stopL.at(-1),common,'exit'));
   const mode=transportProduct(product,walking,notices.map(n=>n.text));
   return {from:start,to:end,departure,arrival,plannedDeparture:hafasTime(trip.date,d.dTimeS,d.dTZOffset),plannedArrival:hafasTime(trip.date,a.aTimeS,a.aTZOffset),line:walking?(sameStation(start,end)?'Umstieg im Bahnhof':'Fußweg'):product.name||product.nameS||product.prodCtx?.name?.trim()||mode.modeLabel,...mode,operator:common.opL?.[product.oprX]?.name||'',direction:j.dirTxt||'',tripId:j.jid||null,platform:platform(d,'d'),arrivalPlatform:platform(a,'a'),plannedPlatform:platform(d,'d',true),plannedArrivalPlatform:platform(a,'a',true),walking,cancelled,realtime:!!(d.dTimeR||a.aTimeR),stops:stopovers.slice(1,-1).map(s=>s.station),stopovers,notices,notes:notices.filter(n=>n.severity==='info').map(n=>n.text),geometry:routeGeometry(raw,common,start,end)};
  });
  if(!legs.length||legs.some((l,i)=>l.cancelled||Date.parse(l.arrival)<Date.parse(l.departure)||i&&(Date.parse(l.departure)<Date.parse(legs[i-1].arrival)||!sameStation(legs[i-1].to,l.from))))continue;
  if(Date.parse(legs[0].departure)<Date.parse(requested)-1000||!sameStation(from,legs[0].from)||!sameStation(to,legs.at(-1).to))continue;
  const departure=legs[0].departure,arrival=legs.at(-1).arrival;
  const notices=mergeNotices([parseNotices(noticeReferences([trip,trip.dep,trip.arr]),common,locations,departure,arrival,from.name+' → '+to.name),...legs.map(l=>l.notices)]);
  output.push({departure,arrival,legs,notices,disruptionCoverage:'partial',routingStatus:'provider-checked',transfers:Math.max(0,legs.filter(l=>!l.walking).length-1),source:'ÖBB / Scotty',fetchedAt:new Date().toISOString()});
 }catch{/* Reject incomplete source connections without fabricating missing legs. */}}
 return output.sort((a,b)=>Date.parse(a.arrival)-Date.parse(b.arrival)||Date.parse(a.departure)-Date.parse(b.departure));
}
function uniqueStations(stations){const result=[];for(const station of stations.filter(Boolean))if(!result.some(existing=>sameStation(existing,station)))result.push(station);return result;}
export function parseHimSearchNotices(results,path,start,end){
 const stations=uniqueStations(path),notices=[];
 for(const data of results.filter(Boolean)){
  const common=data.common||{},locations=(common.locL||[]).map(s=>parseStation(s));
  for(const [index,item] of (data.msgL||[]).entries()){
   const first=locations[item.fLocX],last=locations[item.tLocX];
   // A station search can also return notices for unrelated through services.
   // Keep a notice only when both affected endpoints occur in the returned route.
   if(!first||!last||!stations.some(s=>sameStation(s,first))||!stations.some(s=>sameStation(s,last)))continue;
   notices.push(...parseNotices([{type:'HIM',himX:index,fLocX:item.fLocX,tLocX:item.tLocX}],{...common,himL:data.msgL},locations,start,end,first.name+(sameStation(first,last)?'':' → '+last.name)));
  }
 }
 return mergeNotices([notices]).filter(n=>n.severity==='warning');
}
async function endpointNotices(from,to,journey,start,end,signal){
 try{
  const localStart=berlinInput(start),localEnd=berlinInput(end),lids=await Promise.all([resolveLid(from,signal),resolveLid(to,signal)]);
  const requests=lids.map(lid=>({method:'HimSearch',req:{dateB:localStart.slice(0,10).replaceAll('-',''),timeB:localStart.slice(11,19).replaceAll(':',''),dateE:localEnd.slice(0,10).replaceAll('-',''),timeE:localEnd.slice(11,19).replaceAll(':',''),maxNum:100,himFltrL:[{type:'PROD',mode:'INC',value:'7167'}],stLoc:{type:'S',lid}}}));
  const data=await hafasMany(requests,signal);
  const path=journey?uniqueStations([from,to,...journey.legs.flatMap(l=>[l.from,...l.stopovers.map(s=>s.station),l.to])]):[from,to];
  return {notices:parseHimSearchNotices(data,path,start,end),checked:true};
 }catch(e){console.warn('[RailAtlas] Störungsabfrage',e?.message);return {notices:[],checked:false};}
}
export async function getJourney(from,to,departure,signal,all=false){const [start,end]=await Promise.all([resolveLid(from,signal),resolveLid(to,signal)]),local=berlinInput(departure);let data;try{data=await hafas('TripSearch',{depLocL:[{type:'S',lid:start}],arrLocL:[{type:'S',lid:end}],outDate:local.slice(0,10).replaceAll('-',''),outTime:local.slice(11,19).replaceAll(':',''),outFrwd:true,getPT:true,getIV:false,getPasslist:true,getPolyline:true,ushrp:false,numF:3,jnyFltrL:[{type:'PROD',mode:'INC',value:'7167'}]},signal);}catch(e){console.warn('[RailAtlas] Fahrplanabfrage',e?.message);throw new Error('Der Fahrplandienst ist gerade nicht erreichbar. Bitte die Suche erneut starten.',{cause:e});}
 const results=parseHafasJourneys(data,from,to,departure);if(!results.length){
  const common=data.common||{},locations=(common.locL||[]).map(s=>parseStation(s));
  const refs=(data.outConL||[]).flatMap(t=>noticeReferences([t,t.dep,t.arr,...(t.secL||[]).flatMap(l=>[l,l.dep,l.arr,l.jny,l.gis,...(l.jny?.stopL||[])])]));
  const error=new Error(`Keine nutzbare Verbindung für ${from.name} → ${to.name} gefunden. Ausgefallene oder nicht erreichbare Fahrten werden nicht übernommen. Bitte eine andere Abfahrt oder Haltestelle versuchen. Die Fahrplanabdeckung ist je Land unterschiedlich.`);
  error.code='NO_JOURNEY';
  const until=new Date(Date.parse(departure)+24*3600000).toISOString(),extra=await endpointNotices(from,to,null,departure,until,signal);
  error.notices=mergeNotices([parseNotices(refs,common,locations,departure,until,from.name+' → '+to.name).filter(n=>n.severity==='warning'),extra.notices]);throw error;
 }
 const journeys=all?results.slice(0,3):results.slice(0,1);await Promise.all(journeys.map(async journey=>{const extra=await endpointNotices(from,to,journey,journey.departure,journey.arrival,signal);
 journey.endpointMappings=[[from,journey.legs[0].from],[to,journey.legs.at(-1).to]].filter(([asked])=>!/^\d{7,9}$/.test(asked.dbId||'')).map(([asked,resolved])=>`„${asked.name}“ wurde anhand von Name und Lage dem Bahnhof „${resolved.name}“ zugeordnet.`);
 journey.notices=mergeNotices([journey.notices,extra.notices]);journey.disruptionCheck=extra.checked?'trip-and-station-alerts':'trip-only';}));return all?journeys:journeys[0];}
export const getJourneys=(from,to,departure,signal)=>getJourney(from,to,departure,signal,true);
