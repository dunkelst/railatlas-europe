import {berlinInput, distanceKm, localBerlinISO, normalize} from './rail.mjs';
import {fetchJSON, sameStation} from './journey.mjs';
import {mergeNotices, plainText} from './transit.mjs';

export const VRR_SOURCE = 'VRR / EFA OpenService';
const base = 'https://openservice.vrr.de/openservice/';
export const validVrrId = id => typeof id === 'string' && /^(?:de:\d+:\d+(?::[\w-]+)*|\d{5,12})$/.test(id);
async function request(method, params, signal) {
 const url = new URL(method, base);
 url.search = new URLSearchParams({outputFormat:'rapidJSON',coordOutputFormat:'WGS84[dd.ddddd]',language:'de',...params}).toString();
 const data = await fetchJSON(url, {}, signal, 22000);
 const error = data.systemMessages?.find(m => m.type === 'error');
 if (error) throw Error('VRR-Auskunft: '+plainText(error.text));
 return data;
}
export function parseVrrStation(raw) {
 const stop = raw.type === 'platform' && raw.parent?.type === 'stop' ? raw.parent : raw;
 const coord = stop.coord || raw.coord || [];
 const city = stop.parent?.name || '';
 const name = stop.name || '';
 return {id:'vrr:'+stop.id,vrrId:String(stop.id||''),dbId:'',name:city && !normalize(name).startsWith(normalize(city)) ? city+', '+name : name,country:'DE',lat:coord[0],lon:coord[1],main:false};
}
export function parseVrrStations(data) {
 return (data.locations||[]).filter(s=>s.type==='stop').sort((a,b)=>(b.matchQuality||0)-(a.matchQuality||0)).map(parseVrrStation)
  .filter(s=>validVrrId(s.vrrId)&&[s.lat,s.lon].every(Number.isFinite));
}
export async function findVrrStations(query, signal) {
 return parseVrrStations(await request('XML_STOPFINDER_REQUEST',{type_sf:'any',name_sf:query,anyObjFilter_sf:'2',locationServerActive:'1',anyMaxSizeHitList:'15',deleteAssignedStops_sf:'1'},signal));
}
export function sameVrrStation(a,b) {
 if(a.vrrId && b.vrrId) return a.vrrId===b.vrrId;
 const key=s=>normalize(s.name).replace(/\b(hauptbahnhof|hbf|bahnhof|station)\b/g,'').replace(/[^a-z0-9]/g,'');
 return sameStation(a,b)||key(a)===key(b)&&[a.lat,a.lon,b.lat,b.lon].every(Number.isFinite)&&distanceKm(a,b)<.8;
}
async function resolveStation(station, signal) {
 if(validVrrId(station.vrrId))return station;
 const matches=await findVrrStations(station.name,signal);
 const match=matches.find(s=>sameVrrStation(station,s));
 if(!match)throw Error('Bitte „'+station.name+'“ aus den Online-Vorschlägen der VRR-Auskunft auswählen. Der gewählte Halt ist dort nicht eindeutig zugeordnet.');
 return match;
}
const iso = value => typeof value === 'string' && /(Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
function incidentPeriod(info) {
 const stamp=info.timestamps||{};
 const range=String(info.properties?.incidentDateTime||'').match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})\s*-\s*(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})/);
 return {from:iso(stamp.validityFrom)||iso(stamp.validity?.from)||(range?localBerlinISO(`${range[3]}-${range[2]}-${range[1]}T${range[4]}`):null),until:iso(stamp.validityTo)||iso(stamp.validity?.to)||(range?localBerlinISO(`${range[7]}-${range[6]}-${range[5]}T${range[8]}`):null)};
}
export function parseVrrNotices(infos, start, end, scope) {
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
   output.push({id:'vrr:'+String(info.id||title)+':'+i,title,text,kind,code:type,severity:'warning',validFrom:validity.from,validUntil:validity.until,periods:[],validity:validity.from||validity.until?'dated':'unspecified',scope,source:VRR_SOURCE,routingUncertain:/nicht.{0,20}berucksichtigt/.test(normalize(plainText(link.additionalText||'')))});
  }
 }
 return mergeNotices([output]);
}
export function vrrProduct(transport) {
 const cls=Number(transport.product?.class),name=String(transport.name||transport.product?.name||'');
 if(/ersatz|\bSEV\b/i.test(name))return {mode:'replacement-bus',modeLabel:'Ersatzbus / SEV'};
 if(cls===100 || /fuß|fuss|walk|footpath/i.test(name))return {mode:'walk',modeLabel:'Fußweg'};
 if(cls===1)return {mode:'suburban',modeLabel:'S-Bahn'};
 if(cls===2)return {mode:'subway',modeLabel:'U-Bahn'};
 if(cls===3||cls===4)return {mode:'tram',modeLabel:'Straßenbahn'};
 if([5,6,7,10].includes(cls))return {mode:'bus',modeLabel:'Bus'};
 if(cls===9)return {mode:'ferry',modeLabel:'Fähre'};
 if(cls===0||[13,14,15,16,17].includes(cls))return {mode:'train',modeLabel:'Zug'};
 return {mode:'unknown',modeLabel:transport.product?.name||'Öffentlicher Verkehr'};
}
function geometry(raw, from, to) {
 const coords=raw.coords;
 if(!Array.isArray(coords)||coords.length<2||coords.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>90||Math.abs(p[1])>180)||coords.length===2&&distanceKm(from,to)>.15)return {status:'missing',segments:[],source:VRR_SOURCE};
 const close=(point,station)=>distanceKm({lat:point[0],lon:point[1]},station)<.5;
 return {status:close(coords[0],from)&&close(coords.at(-1),to)?'complete':'partial',segments:[coords],source:VRR_SOURCE};
}
function disabled(raw) {
 return raw.cancelled===true||raw.isCancelled===true||raw.tripImpossible===true||raw.isRealtimeInformative===true||raw.isRealTimeOnlyInformative===true||['TRIP_CANCELLED','DEVIATION','REALTIME_ONLY_INFORMATIVE'].includes(raw.realtimeStatus)||raw.properties?.isCancelled===true;
}
function stopover(raw,start,end) {
 const station=parseVrrStation(raw);
 return {station,departure:iso(raw.departureTimeEstimated||raw.departureTimePlanned),arrival:iso(raw.arrivalTimeEstimated||raw.arrivalTimePlanned),plannedDeparture:iso(raw.departureTimePlanned),plannedArrival:iso(raw.arrivalTimePlanned),platform:raw.properties?.platformName,cancelled:disabled(raw),notices:parseVrrNotices(raw.infos,start,end,station.name)};
}
// No geometry or timetable fallback is generated here. Only complete source journeys survive.
export function parseVrrJourneys(data, from, to, requested) {
 const journeys=[],excludedNotices=[];
 for(const trip of data.journeys||[])try {
  if(disabled(trip))continue;
  const legs=(trip.legs||[]).map(raw=>{
   const origin=raw.origin||{},destination=raw.destination||{},start=parseVrrStation(origin),end=parseVrrStation(destination);
   const departure=iso(origin.departureTimeEstimated||origin.departureTimePlanned),arrival=iso(destination.arrivalTimeEstimated||destination.arrivalTimePlanned);
   if(!departure||!arrival||![start.lat,start.lon,end.lat,end.lon].every(Number.isFinite))throw Error('Unvollständige Teilstrecke');
   const transport=raw.transportation||{},product=vrrProduct(transport),walking=product.mode==='walk';
   const notices=parseVrrNotices([...(raw.infos||[]),...(origin.infos||[]),...(destination.infos||[])],departure,arrival,start.name+' → '+end.name);
   const stopovers=(raw.stopSequence||[]).map(s=>stopover(s,departure,arrival));
   return {from:start,to:end,departure,arrival,plannedDeparture:iso(origin.departureTimePlanned),plannedArrival:iso(destination.arrivalTimePlanned),line:transport.number||transport.disassembledName||transport.name||product.modeLabel,...product,operator:transport.operator?.name||'',direction:transport.destination?.name||'',tripId:transport.properties?.tripCode!=null?String(transport.properties.tripCode):null,platform:origin.properties?.platformName,arrivalPlatform:destination.properties?.platformName,plannedPlatform:origin.properties?.plannedPlatformName,plannedArrivalPlatform:destination.properties?.plannedPlatformName,walking,cancelled:disabled(raw)||disabled(origin)||disabled(destination),realtime:raw.isRealtimeControlled===true,stops:stopovers.slice(1,-1).map(s=>s.station),stopovers,notices,notes:(raw.hints||[]).map(h=>plainText(h.content||h.text)).filter(Boolean),geometry:geometry(raw,start,end)};
  });
  if(!legs.length||legs.some((l,i)=>l.cancelled||Date.parse(l.arrival)<Date.parse(l.departure)||i&&(Date.parse(l.departure)<Date.parse(legs[i-1].arrival)||!sameVrrStation(legs[i-1].to,l.from))))continue;
  if(Date.parse(legs[0].departure)<Date.parse(requested)||!sameVrrStation(from,legs[0].from)||!sameVrrStation(to,legs.at(-1).to))continue;
  const departure=legs[0].departure,arrival=legs.at(-1).arrival;
  const notices=mergeNotices([parseVrrNotices(trip.infos,departure,arrival,from.name+' → '+to.name),...legs.map(l=>l.notices),...legs.flatMap(l=>l.stopovers.map(s=>s.notices))]);
  // EFA can explicitly say that a disruption was NOT considered by its router.
  // Such a connection cannot be presented as usable, even if it has valid times.
  if(notices.some(n=>n.routingUncertain||/Blocking$/i.test(n.code))){excludedNotices.push(...notices.map(n=>({...n,scope:'Verworfener Verbindungsvorschlag ('+legs.map(l=>l.line).join(' / ')+'): '+n.scope})));continue;}
  journeys.push({departure,arrival,legs,notices,disruptionCoverage:'partial',disruptionCheck:'trip-only',routingStatus:'provider-checked',transfers:Math.max(0,legs.filter(l=>!l.walking).length-1),source:VRR_SOURCE,sourceWarning:'VRR-Testzugang. Der Anbieter kann diesen Server für Tests verwenden; Ergebnisse und Verfügbarkeit sind nicht garantiert.',fetchedAt:new Date().toISOString()});
 }catch{/* Reject malformed source journeys. */}
 journeys.sort((a,b)=>Date.parse(a.arrival)-Date.parse(b.arrival)||Date.parse(a.departure)-Date.parse(b.departure));
 if(journeys.length)journeys[0].notices=mergeNotices([journeys[0].notices,excludedNotices]);
 return journeys;
}
export async function getVrrJourney(from,to,departure,signal) {
 const [origin,destination]=await Promise.all([resolveStation(from,signal),resolveStation(to,signal)]),local=berlinInput(departure);
 const data=await request('XML_TRIP_REQUEST2',{type_origin:'any',name_origin:origin.vrrId,type_destination:'any',name_destination:destination.vrrId,itdDate:local.slice(0,10).replaceAll('-',''),itdTime:local.slice(11,16).replace(':',''),itdTripDateTimeDepArr:'dep',calcOneDirection:'1',useRealtime:'1',realDesc:'2',calcNumberOfTrips:'5',ptOptionsActive:'1',itOptionsActive:'1',lineRestriction:'400',locationServerActive:'1',useProxFootSearch:'0'},signal);
 const journeys=parseVrrJourneys(data,origin,destination,departure);
 if(journeys.length)return journeys[0];
 const error=Error('Keine bestätigte VRR-Verbindung gefunden. Ausfälle, unplausible Anschlüsse und Fahrten mit ausdrücklich nicht berücksichtigten Störungen werden verworfen. Bitte einen anderen Zeitpunkt oder eine andere Auskunft wählen.');
 const until=new Date(Date.parse(departure)+24*3600000).toISOString();
 error.notices=mergeNotices((data.journeys||[]).flatMap(t=>[parseVrrNotices(t.infos,departure,until,origin.name+' → '+destination.name),...(t.legs||[]).map(l=>parseVrrNotices(l.infos,departure,until,origin.name+' → '+destination.name))]));
 throw error;
}
