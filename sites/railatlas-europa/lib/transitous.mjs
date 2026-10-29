import {fetchJSON,sameStation} from './journey.mjs';
import {distanceKm,normalize} from './rail.mjs';
import {decodePolyline,transportProduct,plainText,mergeNotices} from './transit.mjs';
import {REGIONS,withinRegion} from './regions.mjs';

export const TRANSITOUS_SOURCE='Transitous / MOTIS (GTFS)';
export const TRANSITOUS_ATTRIBUTIONS=[{label:'Transitous-Datenquellen',url:'https://transitous.org/sources/'},{label:'OpenStreetMap',url:'https://www.openstreetmap.org/copyright'}];
const modes={rail:['HIGHSPEED_RAIL','LONG_DISTANCE','NIGHT_RAIL','REGIONAL_RAIL'],suburban:['SUBURBAN'],subway:['SUBWAY'],tram:['TRAM'],bus:['BUS','COACH']};
const localMode=new Map(Object.entries(modes).flatMap(([mode,values])=>values.map(value=>[value,mode])));
export function transitousModes(raw){return [...new Set((Array.isArray(raw?.modes)?raw.modes:[]).map(m=>localMode.get(m)).filter(Boolean))];}
export function parseTransitousStation(raw){
 if(typeof raw?.stopId!=='string'||!raw.stopId.length||raw.stopId.length>500||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>=200||![raw.lat,raw.lon].every(Number.isFinite)||Math.abs(raw.lat)>90||Math.abs(raw.lon)>180)return null;
 return {id:'transitous:'+raw.stopId,transitousId:raw.stopId,name:raw.name,lat:raw.lat,lon:raw.lon,dbId:'',country:'',main:false,networkModes:transitousModes(raw).map(m=>m==='rail'?'train':m),...(typeof raw.tz==='string'?{timeZone:raw.tz}:{}),lookupSource:TRANSITOUS_SOURCE,timetableStatus:'unverified'};
}
const searchCache=new Map();let nextSearchRequestAt=0;
export async function findTransitousStations(query,signal,region='mexico',near){
 signal?.throwIfAborted();const key=region+':'+normalize(query)+':'+(near?.join(',')||''),saved=searchCache.get(key);if(saved&&saved.until>Date.now())return saved.stations;
 if(Date.now()<nextSearchRequestAt)throw Object.assign(Error('Die zusätzliche Haltestellensuche pausiert nach einem Anbieterfehler.'),{code:'UPSTREAM_UNAVAILABLE'});
 const url=new URL('https://api.transitous.org/api/v1/geocode');url.search=new URLSearchParams({text:query,type:'STOP',place:(near||REGIONS[region].centre).join(','),numResults:'10',language:'de'});
 let raw;try{raw=await fetchJSON(url,{headers:{'User-Agent':'RailAtlas-Europa/31 (+https://github.com/dunkelst/railatlas-europe)'}},signal,16000,1024*1024);}catch(error){signal?.throwIfAborted();if(!error.responseTooLarge)nextSearchRequestAt=Date.now()+Math.max(30000,error.retryAfterMs||0);throw error;}
 if(!Array.isArray(raw))throw Object.assign(Error('Keine lesbare Haltestellensuche.'),{code:'SOURCE_RESPONSE_INVALID'});
 const stations=raw.filter(s=>s.type==='STOP'&&withinRegion(s.lat,s.lon,region)).map(s=>parseTransitousStation({...s,stopId:s.id})).filter(Boolean);
 if(searchCache.size>=200)searchCache.delete(searchCache.keys().next().value);searchCache.set(key,{stations,until:Date.now()+900000});return stations;
}
const catalogEndpoint=s=>/^\d+$/.test(s?.id||'')&&!s.dbId&&!s.locationType;
export function matchTransitousCatalogStation(station,locations){
 if(!catalogEndpoint(station))return null;
 const matches=(Array.isArray(locations)?locations:[]).filter(raw=>raw.type==='STOP'&&(!station.country||!raw.country||station.country===raw.country)).map(raw=>parseTransitousStation({...raw,stopId:raw.id})).filter(s=>s&&normalize(s.name)===normalize(station.name)&&distanceKm(station,s)<=.8).sort((a,b)=>distanceKm(station,a)-distanceKm(station,b));
 if(!matches.length||matches.some(s=>distanceKm(matches[0],s)>.25))return null;
 return matches[0];
}
const endpointCache=new Map();
async function resolveCatalogEndpoint(station,signal){
 if(!catalogEndpoint(station))return station;
 const key=JSON.stringify([station.id,station.name,station.lat,station.lon,station.country]),saved=endpointCache.get(key);
 if(saved&&saved.until>Date.now())return saved.station||station;
 if(Date.now()<nextJourneyRequestAt)return station;
 const url=new URL('https://api.transitous.org/api/v1/geocode');url.search=new URLSearchParams({text:station.name,type:'STOP',place:station.lat+','+station.lon,numResults:'10',language:'de'});
 let raw;
 try{raw=await fetchJSON(url,{headers:{'User-Agent':'RailAtlas-Europa/27 (+https://github.com/dunkelst/railatlas-europe)'}},signal,16000,1024*1024);if(!Array.isArray(raw))throw Error('Keine lesbare Haltezuordnung.');}
 catch(error){signal?.throwIfAborted();if(error.status===429)throw error;endpointCache.set(key,{station:null,until:Date.now()+Math.max(30000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0)});return station;}
 const resolved=matchTransitousCatalogStation(station,raw);
 if(endpointCache.size>=128)endpointCache.delete(endpointCache.keys().next().value);endpointCache.set(key,{station:resolved,until:Date.now()+15*60000});return resolved||station;
}
let nextRequestAt=0;
let nextRouteRequestAt=0;
export async function fetchTransitousRoutes(bounds,signal){
 signal?.throwIfAborted();
 if(Date.now()<nextRouteRequestAt)throw Error('Die ergänzende Linienkarte pausiert nach einem Anbieterfehler.');
 const [s,w,n,e]=bounds,url=new URL('https://api.transitous.org/api/experimental/map/routes');
 url.search=new URLSearchParams({min:s+','+w,max:n+','+e,zoom:'14',language:'de'});
 try{
  const data=await fetchJSON(url,{headers:{'User-Agent':'RailAtlas-Europa/29 (+https://github.com/dunkelst/railatlas-europe)'}},signal,16000,8*1024*1024);
  if(!Array.isArray(data.routes)||!Array.isArray(data.polylines))throw Object.assign(Error('Die ergänzende Linienkarte liefert keine lesbaren Verläufe.'),{code:'SOURCE_RESPONSE_INVALID'});
  return data;
 }catch(error){signal?.throwIfAborted();if(!error.responseTooLarge)nextRouteRequestAt=Date.now()+Math.max(30000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0);throw error;}
}
// Bounds and map modes are validated by the shared network handler.
export async function fetchTransitousStops(bounds,selected,signal){
 signal?.throwIfAborted();
 if(Date.now()<nextRequestAt)throw Error('Transitous pausiert nach einem Anbieterfehler.');
 const native=[...new Set(selected.flatMap(m=>modes[m]||[]))];if(!native.length)throw Error('Ungültige Verkehrsmittelauswahl.');
 const [s,w,n,e]=bounds,url=new URL('https://api.transitous.org/api/v6/map/stops');
 url.search=new URLSearchParams({min:s+','+w,max:n+','+e,grouped:'true',modes:native.join(',')});
 try{
  const data=await fetchJSON(url,{headers:{'User-Agent':'RailAtlas-Europa/24 (+https://github.com/dunkelst/railatlas-europe)'}},signal,16000,4*1024*1024);
  if(!Array.isArray(data))throw Object.assign(Error('Transitous liefert keine lesbare Haltestellenliste.'),{code:'SOURCE_RESPONSE_INVALID'});
  return data;
 }catch(error){
  signal?.throwIfAborted();if(!error.responseTooLarge)nextRequestAt=Date.now()+Math.max(30000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0);throw error;
 }
}

const classes={HIGHSPEED_RAIL:1,LONG_DISTANCE:2,NIGHT_RAIL:2,REGIONAL_RAIL:16,SUBURBAN:32,SUBWAY:256,TRAM:512,BUS:64,COACH:64,FERRY:128};
const iso=value=>typeof value==='string'&&/(Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;
function place(raw){
 const stop=parseTransitousStation(raw);if(stop)return stop;
 if(raw?.vertexType!=='NORMAL'||typeof raw.name!=='string'||![raw.lat,raw.lon].every(Number.isFinite)||Math.abs(raw.lat)>90||Math.abs(raw.lon)>180)throw Error('Ungültiger Fahrplanpunkt');
 return {id:'coord:'+raw.lat+':'+raw.lon,name:raw.name,lat:raw.lat,lon:raw.lon,dbId:'',country:'',main:false,locationType:'coordinate'};
}
const samePlace=(a,b)=>[a,b].some(s=>s?.locationType==='coordinate')?distanceKm(a,b)<=.03:sameStation(a,b);
function alerts(raw,start,end,scope){
 return (raw||[]).flatMap((a,i)=>{
  const periods=(a.impactPeriod||[]).map(p=>({from:iso(p.start),until:iso(p.end)}));
  if(periods.length&&!periods.some(p=>(!p.from||Date.parse(p.from)<=Date.parse(end))&&(!p.until||Date.parse(p.until)>Date.parse(start))))return [];
  const title=plainText(a.headerText),text=plainText(a.descriptionText),effect=String(a.effect||'');if(!title&&!text&&!effect)return [];
  return [{id:'transitous:'+effect+':'+title+':'+text+':'+i,title:title||'Betriebshinweis',text,code:effect,kind:effect==='NO_SERVICE'?'cancellation':effect==='SIGNIFICANT_DELAYS'?'delay':'notice',severity:a.severityLevel==='INFO'&&effect!=='NO_SERVICE'?'info':'warning',validFrom:periods.length===1?periods[0].from:null,validUntil:periods.length===1?periods[0].until:null,periods:periods.length>1?periods:[],validity:periods.length?'dated':'unspecified',scope,source:TRANSITOUS_SOURCE,routingUncertain:/nicht.{0,30}berücksichtigt/i.test(text)}];
 });
}
export function parseTransitousJourneys(data,from,to,requested){
 const journeys=[],excluded=[],walkingErrors=[],endpointAlternatives=[],rejected={};
 const reject=reason=>{rejected[reason]=(rejected[reason]||0)+1;};
 const suggest=(side,asked,actual)=>{const distance=distanceKm(asked,actual);if(!actual.transitousId||actual.id===asked.id||distance>.8)return;const old=endpointAlternatives.find(a=>a.side===side&&a.station.id===actual.id);if(old){old.journeys++;return;}endpointAlternatives.push({side,station:actual,distanceMeters:Math.round(distance*1000),journeys:1});};
 for(const trip of data.itineraries||[])try{
  const legs=(trip.legs||[]).map(raw=>{
   const a=place(raw.from),b=place(raw.to),departure=iso(raw.startTime),arrival=iso(raw.endTime),walking=raw.mode==='WALK',product=transportProduct({cls:classes[raw.mode]||0},walking);
   if(!departure||!arrival||product.mode==='unknown'||raw.loopedCalendarSince)throw Object.assign(Error('Unbestätigte Fahrplandaten'),{code:raw.loopedCalendarSince?'STALE_CALENDAR':'INVALID_DATA'});
   const notes=alerts([...(raw.alerts||[]),...(raw.from.alerts||[]),...(raw.to.alerts||[])],departure,arrival,a.name+' → '+b.name);
   const points=decodePolyline(raw.legGeometry?.points,raw.legGeometry?.precision);
   const gap=(p,s)=>p?distanceKm({lat:p[0],lon:p[1]},s)*1000:Infinity;
   const fromGap=gap(points[0],a),toGap=gap(points.at(-1),b);
   // Native rail platforms can be located inside a station building, while
   // OSM routing ends at an entrance. Only these station endpoints allow a
   // partial source path; selected coordinates and ordinary bus stops stay strict.
   const stationAccess=(stop,metres)=>stop.vertexType==='TRANSIT'&&typeof stop.stopId==='string'&&(stop.modes||[]).some(m=>['HIGHSPEED_RAIL','LONG_DISTANCE','NIGHT_RAIL','REGIONAL_RAIL','SUBURBAN','SUBWAY'].includes(m))&&metres<=Math.min(250,raw.distance);
   // Preserve supplied paths without claiming original GTFS provenance. Vehicle
   // paths are marked unverified and drawn dashed; never invent station chords.
   const routed=points.length>1&&!(points.length===2&&distanceKm(a,b)>.15),limit=walking?30:250,complete=routed&&fromGap<=limit&&toGap<=limit;
   const partial=walking&&routed&&!complete&&(fromGap<=30||stationAccess(raw.from,fromGap))&&(toGap<=30||stationAccess(raw.to,toGap));
   const geometry={status:complete?'complete':partial?'partial':'missing',segments:complete||partial?[points]:[],source:TRANSITOUS_SOURCE,...(!walking?{reason:'unverified'}:partial?{reason:'station-access',gapMeters:Math.round(Math.max(fromGap,toGap))}:{})};
   if(walking&&(!routed||!Number.isFinite(raw.distance)||raw.distance<0||arrival===departure&&raw.distance>10||!complete&&!partial)){
    const metres=Math.max(fromGap,toGap),name=fromGap>=toGap?(raw.from.vertexType==='NORMAL'?from.name:a.name):(raw.to.vertexType==='NORMAL'?to.name:b.name);
    throw Object.assign(Error(Number.isFinite(metres)&&metres>30?'Der gelieferte Fußweg bei „'+name+'“ erreicht den gewählten Punkt nicht ('+Math.round(metres)+' m Abweichung). Bitte einen bestätigten Halt oder einen passenden Kartenzugang wählen.':'Für den Fußweg bei „'+name+'“ fehlt ein nutzbarer Quellverlauf. Bitte einen bestätigten Halt oder einen anderen Zugang wählen.'),{code:'WALKING_PATH_UNCONFIRMED'});
   }
   const stopovers=(raw.intermediateStops||[]).map(s=>({station:place(s),arrival:iso(s.arrival),departure:iso(s.departure),plannedArrival:iso(s.scheduledArrival),plannedDeparture:iso(s.scheduledDeparture),platform:s.track,cancelled:!!s.cancelled,notices:alerts(s.alerts,departure,arrival,s.name)}));
   return {from:a,to:b,departure,arrival,plannedDeparture:iso(raw.scheduledStartTime),plannedArrival:iso(raw.scheduledEndTime),...product,line:walking?'Fußweg':raw.routeShortName||raw.displayName||raw.tripShortName||raw.mode,operator:raw.agencyName||'',direction:raw.headsign||'',tripId:raw.tripId||null,platform:walking?undefined:raw.from.track,arrivalPlatform:walking?undefined:raw.to.track,plannedPlatform:raw.from.scheduledTrack,plannedArrivalPlatform:raw.to.scheduledTrack,walking,distanceMeters:walking?raw.distance:null,throughService:!!raw.interlineWithPreviousLeg,realtime:raw.realTime===true,cancelled:!!(raw.cancelled||raw.from.cancelled||raw.to.cancelled||raw.from.pickupType==='NOT_ALLOWED'||raw.to.dropoffType==='NOT_ALLOWED'),stops:stopovers.map(s=>s.station),stopovers,notices:notes,notes:walking?[]:[geometry.segments.length?'Gelieferter Anbieterverlauf: farbig gestrichelt dargestellt, Original-GTFS-Herkunft nicht bestätigt.':'Für diesen Fahrabschnitt fehlt ein nutzbarer gelieferter Verlauf; die Kartenlücke bleibt offen.'],geometry};
  });
  const notices=mergeNotices([alerts(trip.alerts,trip.startTime,trip.endTime,from.name+' → '+to.name),...legs.flatMap(l=>[l.notices,...l.stopovers.map(s=>s.notices)])]);
  if(legs.some(l=>l.cancelled)||notices.some(n=>n.code==='NO_SERVICE'||n.routingUncertain)){excluded.push(...notices.map(n=>({...n,scope:'Verworfener Verbindungsvorschlag: '+n.scope})));reject('CANCELLED');continue;}
  if(!legs.length||!legs.some(l=>!l.walking)){reject('NO_TRANSIT');continue;}
  if(legs.some((l,i)=>Date.parse(l.arrival)<Date.parse(l.departure)||i&&Date.parse(l.departure)<Date.parse(legs[i-1].arrival))){reject('TIME_CONFLICT');continue;}
  if(legs.some((l,i)=>i&&!samePlace(legs[i-1].to,l.from))){reject('DISCONNECTED');continue;}
  if(Date.parse(legs[0].departure)<Date.parse(requested)){reject('TOO_EARLY');continue;}
  if(!samePlace(from,legs[0].from)||!samePlace(to,legs.at(-1).to)){
   reject('ENDPOINT_MISMATCH');
   if(!samePlace(from,legs[0].from))suggest('from',from,legs[0].from);
   if(!samePlace(to,legs.at(-1).to))suggest('to',to,legs.at(-1).to);
   continue;
  }
  if(legs[0].from.locationType==='coordinate')legs[0].from={...legs[0].from,name:from.name};
  if(legs.at(-1).to.locationType==='coordinate')legs.at(-1).to={...legs.at(-1).to,name:to.name};
  journeys.push({departure:legs[0].departure,arrival:legs.at(-1).arrival,legs,notices,transfers:Math.max(0,legs.filter(l=>!l.walking&&!l.throughService).length-1),source:TRANSITOUS_SOURCE,sourceWarning:'Transitous-Fahrplanauskunft; Datenabdeckung und Echtzeitdaten sind partiell. Gelieferte Fahrzeugverläufe werden farbig gestrichelt gezeigt; ihre Original-GTFS-Herkunft ist nicht bestätigt. Fehlende Geometrie bleibt offen.',disruptionCoverage:'partial',disruptionCheck:'trip-only',routingStatus:'provider-checked',attributions:TRANSITOUS_ATTRIBUTIONS,fetchedAt:new Date().toISOString()});
 }catch(error){if(error.code==='WALKING_PATH_UNCONFIRMED')walkingErrors.push(error.message);reject(['WALKING_PATH_UNCONFIRMED','STALE_CALENDAR'].includes(error.code)?error.code:'INVALID_DATA');/* A malformed alternative cannot conceal valid connections. */}
 journeys.sort((a,b)=>Date.parse(a.arrival)-Date.parse(b.arrival)||Date.parse(a.departure)-Date.parse(b.departure));
 for(const journey of journeys)journey.notices=mergeNotices([journey.notices,excluded]);
 return {journeys,notices:excluded,walkingErrors:[...new Set(walkingErrors)],endpointAlternatives,diagnostics:{provider:TRANSITOUS_SOURCE,received:(data.itineraries||[]).length,accepted:journeys.length,rejected}};
}
let nextJourneyRequestAt=0;const journeyCache=new Map();
export async function getTransitousJourneys(from,to,departure,signal){
 signal?.throwIfAborted();
 let origin,destination;
 try{[origin,destination]=await Promise.all([resolveCatalogEndpoint(from,signal),resolveCatalogEndpoint(to,signal)]);}catch(error){signal?.throwIfAborted();nextJourneyRequestAt=Date.now()+Math.max(30000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0);throw error;}
 const endpoint=s=>typeof s.transitousId==='string'&&s.id==='transitous:'+s.transitousId?s.transitousId:s.lat+','+s.lon;
 const key=JSON.stringify([endpoint(origin),endpoint(destination),departure]),cached=journeyCache.get(key);
 // Keep source responses, then revalidate endpoints for every caller.
 let data=cached&&cached.until>Date.now()?cached.data:null;
 if(!data){
  if(Date.now()<nextJourneyRequestAt)throw Object.assign(Error('Transitous pausiert nach einem Anbieterfehler.'),{code:'UPSTREAM_UNAVAILABLE'});
  const url=new URL('https://api.transitous.org/api/v6/plan');
  url.search=new URLSearchParams({fromPlace:endpoint(origin),toPlace:endpoint(destination),time:departure,directModes:'',numItineraries:'3',maxItineraries:'3',searchWindow:'900',useRoutedTransfers:'true',detailedTransfers:'true',maxPreTransitTime:'900',maxPostTransitTime:'900'});
  try{
   data=await fetchJSON(url,{headers:{'User-Agent':'RailAtlas-Europa/25 (+https://github.com/dunkelst/railatlas-europe)'}},signal,22000,4*1024*1024);
   if(!Array.isArray(data.itineraries))throw Object.assign(Error('Transitous hat keine auswertbare Verbindungsliste geliefert.'),{code:'SOURCE_RESPONSE_INVALID'});
   if(journeyCache.size>=64)journeyCache.delete(journeyCache.keys().next().value);journeyCache.set(key,{data,until:Date.now()+30000});
  }catch(error){signal?.throwIfAborted();if(!error.responseTooLarge)nextJourneyRequestAt=Date.now()+Math.max(30000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0);throw error;}
 }
 const parsed=parseTransitousJourneys(data,origin,destination,departure);
 if(!parsed.journeys.length){
  const rejected=parsed.diagnostics.received>0;
  const message=parsed.walkingErrors[0]||(parsed.endpointAlternatives.length?'Transitous liefert Reisen mit einem abweichenden Start- oder Zielhalt. Bitte den vorgeschlagenen Haltepunkt prüfen und gezielt übernehmen.':rejected?'Transitous hat '+parsed.diagnostics.received+' Vorschläge geliefert; keiner bestätigt eine durchgehend nutzbare Reise zwischen den gewählten Punkten.':'Transitous liefert für diese Orte und Abfahrtszeit keine Fahrplanverbindung. Die Datenabdeckung kann unvollständig sein.');
  throw Object.assign(Error(message),{code:parsed.walkingErrors.length?'WALKING_PATH_UNCONFIRMED':rejected?'JOURNEY_REJECTED':'NO_JOURNEY',notices:parsed.notices,diagnostics:parsed.diagnostics,endpointAlternatives:parsed.endpointAlternatives});
 }
 for(const journey of parsed.journeys)journey.endpointMappings=[[from,origin,'beginnt'],[to,destination,'endet']].filter(([asked,resolved])=>asked!==resolved).map(([asked,resolved,action])=>'Der Kataloghalt „'+asked.name+'“ wurde dem Haltepunkt „'+resolved.name+'“ zugeordnet ('+Math.round(distanceKm(asked,resolved)*1000)+' m vom Katalogpunkt). Die Reise '+action+' am zugeordneten Halt; bitte den Zugang prüfen.');
 return parsed.journeys.slice(0,3);
}
