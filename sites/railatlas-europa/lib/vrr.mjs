import {berlinInput, distanceKm, localBerlinISO, normalize} from './rail.mjs';
import {fetchJSON, sameStation} from './journey.mjs';
import {mergeNotices, plainText} from './transit.mjs';

export const VRR_SOURCE = 'VRR / EFA OpenService';
export const EFA_SOURCE = 'Region Hannover / EFA Deutschland';
const VRR_PROVIDER = {id:'vrr',idField:'vrrId',label:VRR_SOURCE,base:'https://openservice.vrr.de/openservice/',warning:'VRR-Testzugang. Der Anbieter kann diesen Server für Tests verwenden; Ergebnisse und Verfügbarkeit sind nicht garantiert.'};
export const EFA_PROVIDER = {id:'efa',idField:'efaId',label:EFA_SOURCE,base:'https://www.efa.de/efa/',warning:''};
export const validVrrId = id => typeof id === 'string' && /^(?:de:\d+:\d+(?::[\w-]+)*|\d{5,12})$/.test(id);
async function request(method, params, signal, provider=VRR_PROVIDER) {
 const url = new URL(method, provider.base);
 url.search = new URLSearchParams({outputFormat:'rapidJSON',coordOutputFormat:'WGS84[dd.ddddd]',language:'de',...params}).toString();
 const data = await fetchJSON(url, {}, signal, 22000);
 const error = data.systemMessages?.find(m => m.type === 'error');
 if (error) throw Error(provider.label+': '+plainText(error.text));
 return data;
}
export function parseVrrStation(raw, provider=VRR_PROVIDER) {
 const stop = raw.type === 'platform' && raw.parent?.type === 'stop' ? raw.parent : raw;
 const coord = stop.coord || raw.coord || [];
 const city = stop.parent?.name || '';
 const name = stop.name || '';
 return {id:provider.id+':'+stop.id,[provider.idField]:String(stop.id||''),aliases:[stop.disassembledName,stop.properties?.mainLocality].filter(Boolean).join(' '),dbId:'',name:city && !normalize(name).startsWith(normalize(city)) ? city+', '+name : name,country:'DE',lat:coord[0],lon:coord[1],main:false};
}
export function parseVrrStations(data, provider=VRR_PROVIDER) {
 return (data.locations||[]).filter(s=>s.type==='stop').sort((a,b)=>(b.matchQuality||0)-(a.matchQuality||0)).map(s=>parseVrrStation(s,provider))
  .filter(s=>validVrrId(s[provider.idField])&&[s.lat,s.lon].every(Number.isFinite));
}
const stationCache=new Map();
export async function findVrrStations(query, signal, provider=VRR_PROVIDER) {
 signal?.throwIfAborted();
 const key=provider.id+':'+normalize(query),cached=stationCache.get(key);
 if(cached&&cached.until>Date.now())return cached.stations;
 const stations=parseVrrStations(await request('XML_STOPFINDER_REQUEST',{type_sf:'any',name_sf:query,anyObjFilter_sf:'2',locationServerActive:'1',anyMaxSizeHitList:'15',deleteAssignedStops_sf:'1'},signal,provider),provider);
 signal?.throwIfAborted();
 if(stationCache.size>=200)stationCache.delete(stationCache.keys().next().value);
 stationCache.set(key,{stations,until:Date.now()+15*60000});return stations;
}
export function sameVrrStation(a,b,provider=VRR_PROVIDER) {
 if([a,b].some(s=>typeof s?.id==='string'&&s.id.startsWith('osm:')))return sameStation(a,b);
 if(a[provider.idField] && b[provider.idField]) return a[provider.idField]===b[provider.idField];
 const key=s=>normalize(s.name).replace(/\b(hauptbahnhof|hbf|bahnhof|station)\b/g,'').replace(/[^a-z0-9]/g,'');
 return sameStation(a,b)||key(a)===key(b)&&[a.lat,a.lon,b.lat,b.lon].every(Number.isFinite)&&distanceKm(a,b)<.8;
}
async function resolveStation(station, signal, provider=VRR_PROVIDER) {
 if(validVrrId(station[provider.idField]))return station;
 const matches=await findVrrStations(station.name,signal,provider);
 if(typeof station.id==='string'&&station.id.startsWith('osm:'))matches.sort((a,b)=>distanceKm(station,a)-distanceKm(station,b));
 const match=matches.find(s=>sameVrrStation(station,s,provider));
 if(!match){const error=Error('Bitte „'+station.name+'“ aus den Online-Vorschlägen von '+provider.label+' auswählen. Der gewählte Halt ist dort nicht eindeutig zugeordnet.');error.code='STATION_NOT_FOUND';throw error;}
 return match;
}
const iso = value => typeof value === 'string' && /(Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
function incidentPeriod(info) {
 const stamp=info.timestamps||{};
 const range=String(info.properties?.incidentDateTime||'').match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})\s*-\s*(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})/);
 return {from:iso(stamp.validityFrom)||iso(stamp.validity?.from)||(range?localBerlinISO(`${range[3]}-${range[2]}-${range[1]}T${range[4]}`):null),until:iso(stamp.validityTo)||iso(stamp.validity?.to)||(range?localBerlinISO(`${range[7]}-${range[6]}-${range[5]}T${range[8]}`):null)};
}
export function parseVrrNotices(infos, start, end, scope, provider=VRR_PROVIDER) {
 const output=[];
 for(const info of infos||[]) {
  const validity=incidentPeriod(info);
  if(validity.from && Date.parse(validity.from)>Date.parse(end) || validity.until && Date.parse(validity.until)<Date.parse(start))continue;
  for(const [i,link] of (info.infoLinks?.length?info.infoLinks:[info]).entries()) {
   const title=plainText(link.title||link.subtitle||link.urlText||'Betriebshinweis');
   const text=plainText([link.content,link.additionalText].filter(Boolean).join('\n'));
   if(!title&&!text)continue;
   const all=normalize(title+' '+text),type=String(info.type||'');
   const kind=/blocking/i.test(type)||/sperr|verkehr.{0,40}unterbrochen/.test(all)?'closure':/ausfall|ausfalle|fallt aus|entfall|halten.{0,60}nicht/.test(all)?'cancellation':/verspat/.test(all)?'delay':'notice';
   output.push({id:provider.id+':'+String(info.id||title)+':'+i,title,text,kind,code:type,severity:'warning',validFrom:validity.from,validUntil:validity.until,periods:[],validity:validity.from||validity.until?'dated':'unspecified',scope,source:provider.label,routingUncertain:/nicht.{0,20}berucksichtigt/.test(normalize(plainText(link.additionalText||'')))});
  }
 }
 return mergeNotices([output]);
}
export function vrrProduct(transport) {
 const cls=Number(transport.product?.class),name=String(transport.name||transport.product?.name||'');
 if(/ersatz|\bSEV\b/i.test(name))return {mode:'replacement-bus',modeLabel:'Ersatzbus / SEV'};
 if(cls===97)return {mode:'stay-on-board',modeLabel:'Im Fahrzeug bleiben'};
 if(cls===100 || /fuß|fuss|walk|footpath/i.test(name))return {mode:'walk',modeLabel:'Fußweg'};
 if(cls===1)return {mode:'suburban',modeLabel:'S-Bahn'};
 if(cls===2)return {mode:'subway',modeLabel:'U-Bahn'};
 if(cls===3||cls===4)return {mode:'tram',modeLabel:'Straßenbahn'};
 if([5,6,7,10].includes(cls))return {mode:'bus',modeLabel:'Bus'};
 if(cls===9)return {mode:'ferry',modeLabel:'Fähre'};
 if(cls===0||[13,14,15,16,17].includes(cls))return {mode:'train',modeLabel:'Zug'};
 return {mode:'unknown',modeLabel:transport.product?.name||'Öffentlicher Verkehr'};
}
function geometry(raw, from, to, provider=VRR_PROVIDER) {
 const coords=raw.coords;
 if(!Array.isArray(coords)||coords.length<2||coords.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>90||Math.abs(p[1])>180)||coords.length===2&&distanceKm(from,to)>.15)return {status:'missing',segments:[],source:provider.label};
 const close=(point,station)=>distanceKm({lat:point[0],lon:point[1]},station)<.5;
 return {status:close(coords[0],from)&&close(coords.at(-1),to)?'complete':'partial',segments:[coords],source:provider.label};
}
function lineName(transport, fallback) {
 const line=transport.number||transport.disassembledName||transport.name||fallback;
 return /^\d+[A-Za-z]?$/.test(line)&&transport.properties?.trainType?transport.properties.trainType+' '+line:line;
}
function disabled(raw) {
 return raw.cancelled===true||raw.isCancelled===true||raw.tripImpossible===true||raw.isRealtimeInformative===true||raw.isRealTimeOnlyInformative===true||['TRIP_CANCELLED','DEVIATION','REALTIME_ONLY_INFORMATIVE'].includes(raw.realtimeStatus)||raw.properties?.isCancelled===true;
}
function stopover(raw,start,end,provider=VRR_PROVIDER) {
 const station=parseVrrStation(raw,provider);
 return {station,departure:iso(raw.departureTimeEstimated||raw.departureTimePlanned),arrival:iso(raw.arrivalTimeEstimated||raw.arrivalTimePlanned),plannedDeparture:iso(raw.departureTimePlanned),plannedArrival:iso(raw.arrivalTimePlanned),platform:raw.properties?.platformName||raw.properties?.platform,cancelled:disabled(raw),notices:parseVrrNotices(raw.infos,start,end,station.name,provider)};
}
// No geometry or timetable fallback is generated here. Only complete source journeys survive.
export function parseVrrJourneys(data, from, to, requested, provider=VRR_PROVIDER) {
 const journeys=[],excludedNotices=[];
 for(const trip of data.journeys||[])try {
  if(disabled(trip))continue;
  const sourceLegs=(trip.legs||[]).map(raw=>{
   const origin=raw.origin||{},destination=raw.destination||{},start=parseVrrStation(origin,provider),end=parseVrrStation(destination,provider);
   const departure=iso(origin.departureTimeEstimated||origin.departureTimePlanned),arrival=iso(destination.arrivalTimeEstimated||destination.arrivalTimePlanned);
   if(!departure||!arrival||![start.lat,start.lon,end.lat,end.lon].every(Number.isFinite))throw Error('Unvollständige Teilstrecke');
   const transport=raw.transportation||{},product=vrrProduct(transport),walking=product.mode==='walk';
   const notices=parseVrrNotices([...(raw.infos||[]),...(origin.infos||[]),...(destination.infos||[])],departure,arrival,start.name+' → '+end.name,provider);
   const stopovers=(raw.stopSequence||[]).map(s=>stopover(s,departure,arrival,provider));
   return {from:start,to:end,departure,arrival,plannedDeparture:iso(origin.departureTimePlanned),plannedArrival:iso(destination.arrivalTimePlanned),line:lineName(transport,product.modeLabel),...product,operator:transport.operator?.name||'',direction:transport.destination?.name||'',tripId:transport.properties?.tripCode!=null?String(transport.properties.tripCode):null,platform:origin.properties?.platformName||origin.properties?.platform,arrivalPlatform:destination.properties?.platformName||destination.properties?.platform,plannedPlatform:origin.properties?.plannedPlatformName,plannedArrivalPlatform:destination.properties?.plannedPlatformName,walking,cancelled:disabled(raw)||disabled(origin)||disabled(destination),realtime:raw.isRealtimeControlled===true,stops:stopovers.slice(1,-1).map(s=>s.station),stopovers,notices,notes:(raw.hints||[]).map(h=>plainText(h.content||h.text)).filter(Boolean),geometry:geometry(raw,start,end,provider)};
  });
  const legs=[];
  for(const [i,leg] of sourceLegs.entries()){
   if(leg.mode==='stay-on-board'){
    if(!i||i===sourceLegs.length-1||sourceLegs[i-1].walking||sourceLegs[i+1].walking||leg.cancelled||!sameVrrStation(leg.from,leg.to,provider)||!sameVrrStation(sourceLegs[i-1].to,leg.from,provider)||!sameVrrStation(leg.to,sourceLegs[i+1].from,provider)||Date.parse(leg.departure)<Date.parse(sourceLegs[i-1].arrival)||Date.parse(leg.arrival)>Date.parse(sourceLegs[i+1].departure))throw Error('Unvollständige Durchbindung');
    continue;
   }
   const instruction=sourceLegs[i-1];
   if(instruction?.mode==='stay-on-board'){leg.throughService=true;leg.notes.unshift('Im Fahrzeug bleiben; kein Umstieg beim Linienwechsel.');leg.notices=mergeNotices([leg.notices,instruction.notices]);}
   legs.push(leg);
  }
  if(!legs.length||legs.some((l,i)=>l.cancelled||Date.parse(l.arrival)<Date.parse(l.departure)||i&&(Date.parse(l.departure)<Date.parse(legs[i-1].arrival)||!sameVrrStation(legs[i-1].to,l.from,provider))))continue;
  if(Date.parse(legs[0].departure)<Date.parse(requested)||!sameVrrStation(from,legs[0].from,provider)||!sameVrrStation(to,legs.at(-1).to,provider))continue;
  const departure=legs[0].departure,arrival=legs.at(-1).arrival;
  const notices=mergeNotices([parseVrrNotices(trip.infos,departure,arrival,from.name+' → '+to.name,provider),...legs.map(l=>l.notices),...legs.flatMap(l=>l.stopovers.map(s=>s.notices))]);
  // EFA can explicitly say that a disruption was NOT considered by its router.
  // Such a connection cannot be presented as usable, even if it has valid times.
  if(notices.some(n=>n.routingUncertain||/Blocking$/i.test(n.code))){excludedNotices.push(...notices.map(n=>({...n,scope:'Verworfener Verbindungsvorschlag ('+legs.map(l=>l.line).join(' / ')+'): '+n.scope})));continue;}
  journeys.push({departure,arrival,legs,notices,disruptionCoverage:'partial',disruptionCheck:'trip-only',routingStatus:'provider-checked',transfers:Math.max(0,legs.filter(l=>!l.walking&&!l.throughService).length-1),source:provider.label,sourceWarning:provider.warning,fetchedAt:new Date().toISOString()});
 }catch{/* Reject malformed source journeys. */}
 journeys.sort((a,b)=>Date.parse(a.arrival)-Date.parse(b.arrival)||Date.parse(a.departure)-Date.parse(b.departure));
 if(journeys.length)journeys[0].notices=mergeNotices([journeys[0].notices,excludedNotices]);
 return journeys;
}
export async function getVrrJourney(from,to,departure,signal,provider=VRR_PROVIDER,all=false) {
 const [origin,destination]=await Promise.all([resolveStation(from,signal,provider),resolveStation(to,signal,provider)]),local=berlinInput(departure);
 const data=await request('XML_TRIP_REQUEST2',{type_origin:'any',name_origin:origin[provider.idField],type_destination:'any',name_destination:destination[provider.idField],itdDate:local.slice(0,10).replaceAll('-',''),itdTime:local.slice(11,16).replace(':',''),itdTripDateTimeDepArr:'dep',calcOneDirection:'1',useRealtime:'1',realDesc:'2',calcNumberOfTrips:'5',ptOptionsActive:'1',itOptionsActive:'1',lineRestriction:'400',locationServerActive:'1',useProxFootSearch:'0'},signal,provider);
 const journeys=parseVrrJourneys(data,origin,destination,departure,provider);
 if(journeys.length){for(const journey of journeys)journey.endpointMappings=[[from,origin],[to,destination]].filter(([asked])=>!validVrrId(asked[provider.idField])).map(([asked,resolved])=>`„${asked.name}“ wurde anhand von Name und Lage dem Halt „${resolved.name}“ zugeordnet.`);return all?journeys.slice(0,3):journeys[0];}
 const error=Error('Keine bestätigte '+provider.label+'-Verbindung gefunden. Ausfälle, unplausible Anschlüsse und Fahrten mit ausdrücklich nicht berücksichtigten Störungen werden verworfen. Bitte einen anderen Zeitpunkt oder eine andere Auskunft wählen.');
 error.code='NO_JOURNEY';
 const until=new Date(Date.parse(departure)+24*3600000).toISOString();
 error.notices=mergeNotices((data.journeys||[]).flatMap(t=>[parseVrrNotices(t.infos,departure,until,origin.name+' → '+destination.name,provider),...(t.legs||[]).map(l=>parseVrrNotices(l.infos,departure,until,origin.name+' → '+destination.name,provider))]));
 throw error;
}

// The two EFA instances share their parser, validation and geometry handling.
export const findEfaStations=(query,signal)=>findVrrStations(query,signal,EFA_PROVIDER);
export const getEfaJourney=(from,to,departure,signal)=>getVrrJourney(from,to,departure,signal,EFA_PROVIDER);

export const getEfaJourneys=(from,to,departure,signal)=>getVrrJourney(from,to,departure,signal,EFA_PROVIDER,true);
