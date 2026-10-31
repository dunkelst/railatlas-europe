import {fetchJSON} from './journey.mjs';
import {distanceKm,localZonedISO,zonedInput,normalize,searchStations} from './rail.mjs';
import {MEXICO_PLACES,withinRegion,mexicanLocationTimeZone} from './regions.mjs';
import {findMexicanAirports} from './location-search.mjs';
import stationSeeds from './ado-stations-data.mjs';

export const ADO_SOURCE='ADO / Distribusion';
const origin='https://book.api.distribusion.com/api/connections',partner='343401';
// Public location codes observed in ADO International's own search, 30.10.2026.
// These identify search areas, never fabricated boarding points or journeys.
const cities=[['tulum','MXTUL'],['playa','MXPCM'],['cancun','MXCUN']].map(([id,code])=>({...MEXICO_PLACES.find(p=>p.id===id),code,type:'city'}));
const cun=findMexicanAirports('CUN')[0];
const stationCode=code=>typeof code==='string'&&/^MX[A-Z0-9]{3,17}$/.test(code);
export function adoLocation(s){
 if(!s||s.transitousId||s.trenMayaId||s.networkMode==='rail'||!withinRegion(s.lat,s.lon,'mexico'))return null;
 if(stationCode(s.adoStationCode)&&s.id==='ado:'+s.adoStationCode)return {type:'stations',code:s.adoStationCode,timeZone:mexicanLocationTimeZone({...s,timeZone:undefined})||s.timeZone};
 if(distanceKm(s,cun)<3)return {type:'area',code:'MXCUNCA',timeZone:'America/Cancun'};
 const city=cities.find(p=>distanceKm(s,{lat:p.centre[0],lon:p.centre[1]})<5);
 return city?{type:city.type,code:city.code,timeZone:city.timeZone}:null;
}
function adoUrl(from,to,departure){
 const local=zonedInput(departure,from.timeZone),url=new URL(origin);
 for(const [side,location] of [['departure',from],['arrival',to]]){url.searchParams.set(`search_bounds[0][${side}_location][type]`,location.type);url.searchParams.set(`search_bounds[0][${side}_location][value][]`,location.code);}
 for(const [key,value] of Object.entries({'search_bounds[0][departure_date]':local.slice(0,10),'search_bounds[0][departure_start_time]':local.slice(11,16),'search_bounds[0][is_requested]':'true',pax:'1',locale:'es-MX',currency:'MXN',retailer_partner_number:partner}))url.searchParams.set(key,value);
 return url;
}
const ref=(record,key)=>record?.relationships?.[key]?.data;
function sourceStation(row,get){
 const a=row?.attributes,area=ref(row,'area')?.id;
 if(row?.type!=='stations'||!a||!stationCode(row.id)||typeof a.name!=='string'||!a.name.trim()||a.name.length>=200||![a.latitude,a.longitude].every(Number.isFinite)||!withinRegion(a.latitude,a.longitude,'mexico'))throw Error('invalid station');
 const airport=typeof a.iata_airport_code==='string'?a.iata_airport_code:area==='MXCUNCA'?'CUN':undefined;
 const s={id:'ado:'+row.id,adoStationCode:row.id,name:a.name,lat:a.latitude,lon:a.longitude,dbId:'',country:'MX',main:false,networkMode:'bus',lookupSource:'Distribusion',sourceUrl:'https://international.ado.com.mx/',locality:get(ref(row,'city'))?.attributes?.name||'',...(airport?{relatedAirport:airport}:{}),timetableStatus:'unverified'};
 const displayZone=({'America/Guatemala':'America/Mexico_City','America/Bogota':'America/Cancun'})[a.time_zone]||a.time_zone;
 s.timeZone=mexicanLocationTimeZone({...s,timeZone:displayZone})||displayZone;
 return {station:s,zone:a.time_zone||s.timeZone};
}
export function parseAdoStation(raw){
 const records=new Map((raw.included||[]).map(r=>[r.type+':'+r.id,r]));
 return sourceStation(raw.data,r=>r&&records.get(r.type+':'+r.id)).station;
}
const stationCache=new Map(stationSeeds.map(s=>[s.adoStationCode,{station:s,until:Infinity}])),lookupCache=new Map();let lookupRetryAt=0;
export function cachedAdoStations(query){return searchStations([...stationCache.values()].map(v=>v.station).map(s=>({...s,key:normalize(s.name),search:normalize(s.name+' '+(s.locality||'')+' '+(s.relatedAirport||'')+' '+(s.aliases||'')+' '+(s.lookupSource||''))})),query,6);}
export function adoSuggestionStations(raw){
 if(!Array.isArray(raw?.locations))throw Object.assign(Error('Die ADO-/Distribusion-Ortssuche liefert keine lesbaren Vorschläge.'),{code:'SOURCE_RESPONSE_INVALID'});
 const found=new Map();let visited=0;
 function walk(locations,depth=0){if(depth>5)return;for(const location of locations){if(++visited>300)throw Error('Too many locations');if(location.countryCode==='MX'&&location.type==='station'&&stationCode(location.code)){const previous=found.get(location.code);if(!previous||(previous.score||0)<(location.score||0))found.set(location.code,location);}if(Array.isArray(location.childrenLocations))walk(location.childrenLocations,depth+1);}}
 walk(raw.locations);return [...found.values()].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,6);
}
export async function findAdoStations(query,signal){
 signal?.throwIfAborted();const q=query.trim().replace(/\bADO\b/gi,'').trim();if(q.length<2)return cachedAdoStations(query);
 const key=normalize(q),saved=lookupCache.get(key);if(saved?.until>Date.now())return saved.stations;
 if(Date.now()<lookupRetryAt)throw Error('Die ADO-/Distribusion-Ortssuche pausiert kurz. Bitte gleich erneut suchen.');
 try{
  const url=new URL('https://global-api.distribusion.com/suggestion-service/v3/locations');url.search=new URLSearchParams({q,rpn:partner,locale:'es',limitTopLevel:'6'});
  const rows=adoSuggestionStations(await fetchJSON(url,{},signal,8000,512*1024));
  const results=await Promise.allSettled(rows.map(async row=>{const cached=stationCache.get(row.code);if(cached?.until>Date.now())return {...cached.station};const u=new URL('https://book.api.distribusion.com/api/stations/'+row.code);u.search=new URLSearchParams({retailer_partner_number:partner,locale:'es-MX'});const station=parseAdoStation(await fetchJSON(u,{},signal,8000,128*1024));if(station.adoStationCode!==row.code)throw Error('Wrong station');station.aliases=(row.names||[]).map(n=>n.name).filter(n=>typeof n==='string').join(' ');if(stationCache.size>=200)stationCache.delete(stationCache.keys().next().value);stationCache.set(row.code,{station,until:Date.now()+86400000});return {...station};}));
  signal?.throwIfAborted();const stations=results.filter(r=>r.status==='fulfilled').map(r=>r.value);if(rows.length&&!stations.length)throw Error('Stations unavailable');if(lookupCache.size>=100)lookupCache.delete(lookupCache.keys().next().value);lookupCache.set(key,{stations,until:Date.now()+300000});return stations;
 }catch(error){signal?.throwIfAborted();lookupRetryAt=Date.now()+Math.max(30000,error.retryAfterMs||0);throw Error('Die ADO-/Distribusion-Ortssuche ist gerade nicht erreichbar. Weitere Ortsquellen bleiben verfügbar.');}
}
export function parseAdoJourneys(raw,from,to,requested){
 if(!Array.isArray(raw?.data)||!Array.isArray(raw?.included))throw Object.assign(Error('ADO hat keine auswertbare Verbindungsliste geliefert.'),{code:'SOURCE_RESPONSE_INVALID'});
 const records=new Map(raw.included.map(r=>[r.type+':'+r.id,r])),get=r=>r&&records.get(r.type+':'+r.id),stations=new Map(),journeys=[],endpointAlternatives=[],rejected={};
 const reject=code=>{rejected[code]=(rejected[code]||0)+1;};
 function station(reference){
  if(!reference||reference.type!=='stations')throw Error('missing station');
  if(stations.has(reference.id))return stations.get(reference.id);
  const entry=sourceStation(get(reference),get);stations.set(reference.id,entry);return entry;
 }
 const same=(asked,actual)=>distanceKm(asked,actual)<=.03&&(!asked.adoStationCode||asked.adoStationCode===actual.adoStationCode);
 const suggest=(side,asked,actual)=>{const d=distanceKm(asked,actual),location=adoLocation(asked),row=records.get('stations:'+actual.adoStationCode),sameArea=location?.type==='area'?ref(row,'area')?.id===location.code:location?.type==='city'&&ref(row,'city')?.id===location.code,limit=['city','airport'].includes(asked.placeType)&&sameArea?5:.8;if(d>limit||same(asked,actual))return;const found=endpointAlternatives.find(a=>a.side===side&&a.station.id===actual.id);if(found)found.journeys++;else endpointAlternatives.push({side,station:actual,distanceMeters:Math.round(d*1000),journeys:1});};
 for(const connection of raw.data){
  try{
   const a=connection.attributes;
   if(connection.type!=='connections'||!a||a.leg_type!=='outbound'){reject('INVALID_DATA');continue;}
   if(a.booked_out===true||a.total_seats_left===0||a.cancelled===true){reject('UNAVAILABLE');continue;}
   const segments=ref(connection,'segments');if(!Array.isArray(segments)||!segments.length)throw Error('missing segments');
   const legs=segments.map(get).sort((a,b)=>(a?.attributes?.index??0)-(b?.attributes?.index??0)).map(row=>{
    const v=row?.attributes;if(!v||v.cancelled===true)throw Error('invalid segment');
    const vehicle=get(ref(row,'vehicle')),kind=get(ref(vehicle,'vehicle_type'))?.attributes?.code;
    if(kind!=='BUS'||v.segment_type!=='regular')throw Error('unsupported transport');
    const start=station(ref(row,'departure_station')),end=station(ref(row,'arrival_station')),departure=localZonedISO(v.departure_time,start.zone),arrival=localZonedISO(v.arrival_time,end.zone);
    const operator=get(ref(row,'operating_carrier'))?.attributes?.trade_name||get(ref(row,'marketing_carrier'))?.attributes?.trade_name||'ADO';
    return {from:start.station,to:end.station,departure,arrival,plannedDeparture:departure,plannedArrival:arrival,line:operator+(v.line?' · '+v.line:''),mode:'bus',modeLabel:'Bus',operator,direction:end.station.name,tripId:typeof v.ride_id==='string'?v.ride_id:row.id,walking:false,realtime:false,cancelled:false,throughService:false,stops:[],stopovers:[],notices:[],notes:['Für diesen Fahrabschnitt fehlt ein nutzbarer gelieferter Verlauf; die Kartenlücke bleibt offen.'],geometry:{status:'missing',segments:[],source:ADO_SOURCE,reason:'unverified'}};
   });
   const first=legs[0],last=legs.at(-1),departure=Date.parse(first.departure),arrival=Date.parse(last.arrival);
   if(legs.some((l,i)=>Date.parse(l.arrival)<=Date.parse(l.departure)||i&&Date.parse(l.departure)<Date.parse(legs[i-1].arrival))||!Number.isFinite(a.duration)||Math.abs((arrival-departure)/1000-a.duration)>60){reject('TIME_CONFLICT');continue;}
   if(legs.some((l,i)=>i&&!same(legs[i-1].to,l.from))){reject('DISCONNECTED');continue;}
   if(localZonedISO(a.departure_time,station(ref(connection,'departure_station')).zone)!==first.departure||localZonedISO(a.arrival_time,station(ref(connection,'arrival_station')).zone)!==last.arrival)throw Error('inconsistent connection');
   if(departure<Date.parse(requested)){reject('TOO_EARLY');continue;}
   if(!same(from,first.from)||!same(to,last.to)){reject('ENDPOINT_MISMATCH');suggest('from',from,first.from);suggest('to',to,last.to);continue;}
   journeys.push({departure:first.departure,arrival:last.arrival,legs,notices:[],transfers:Math.max(0,legs.length-1),source:ADO_SOURCE,sourceWarning:'Fahrzeiten und Verfügbarkeit laut ADO. Echtzeit- und Störungsmeldungen sind nicht bestätigt. Der genaue Fahrweg wird nicht angezeigt.',disruptionCoverage:'partial',disruptionCheck:'trip-only',routingStatus:'provider-checked',attributions:[{label:'ADO International',url:'https://international.ado.com.mx/'}],fetchedAt:new Date().toISOString()});
  }catch{reject('INVALID_DATA');}
 }
 journeys.sort((a,b)=>Date.parse(a.arrival)-Date.parse(b.arrival)||Date.parse(a.departure)-Date.parse(b.departure));
 endpointAlternatives.sort((a,b)=>a.side.localeCompare(b.side)||a.distanceMeters-b.distanceMeters);
 return {journeys,endpointAlternatives,diagnostics:{provider:ADO_SOURCE,received:raw.data.length,accepted:journeys.length,rejected}};
}
const cache=new Map();let retryAt=0;
export async function getAdoJourneys(from,to,departure,signal){
 signal?.throwIfAborted();const origin=adoLocation(from),destination=adoLocation(to);if(!origin||!destination)return null;
 const url=adoUrl(origin,destination,departure),key=url.toString(),saved=cache.get(key);let raw=saved?.until>Date.now()?saved.raw:null;
 if(!raw){
  if(Date.now()<retryAt)throw Object.assign(Error('Die ADO-Auskunft pausiert nach einem Anbieterfehler. Bitte gleich erneut suchen.'),{code:'UPSTREAM_UNAVAILABLE'});
  try{
   raw=await fetchJSON(url,{headers:{Accept:'application/json','User-Agent':'RailAtlas/40 (+https://github.com/dunkelst/railatlas-europe)'}},signal,22000,2*1024*1024);
   if(!Array.isArray(raw?.data)||!Array.isArray(raw?.included))throw Object.assign(Error('ADO hat keine auswertbare Verbindungsliste geliefert.'),{code:'SOURCE_RESPONSE_INVALID'});
   if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(key,{raw,until:Date.now()+30000});
  }catch(error){signal?.throwIfAborted();if(!error.responseTooLarge)retryAt=Date.now()+Math.max(30000,error.retryAfterMs||0);throw Object.assign(Error('Die ADO-Auskunft ist gerade nicht erreichbar. Bitte gleich erneut suchen.'),{code:error.code||'UPSTREAM_UNAVAILABLE',cause:error});}
 }
 const result=parseAdoJourneys(raw,from,to,departure);
 if(!result.journeys.length)throw Object.assign(Error(result.endpointAlternatives.length?'ADO liefert Reisen mit einem abweichenden Start- oder Zielhalt. Bitte die vorgeschlagenen Einstiege prüfen und übernehmen.':result.diagnostics.received?'ADO bestätigt keine nutzbare Reise zwischen den gewählten Punkten für diese Abfahrtszeit.':'ADO liefert für diese Orte und Abfahrtszeit keine verfügbare Fahrplanverbindung.'),{code:result.diagnostics.received?'JOURNEY_REJECTED':'NO_JOURNEY',diagnostics:result.diagnostics,endpointAlternatives:result.endpointAlternatives});
 return result.journeys;
}
