import {berlinInput, berlinSearchDays, distanceKm, localBerlinISO, normalize, walkingMinutes, isMapStop} from './rail.mjs';
import {fetchJSON, sameStation} from './journey.mjs';
import {mergeNotices, plainText} from './transit.mjs';

export const VRR_SOURCE = 'VRR / EFA OpenService';
export const EFA_SOURCE = 'Region Hannover / EFA Deutschland';
const VRR_PROVIDER = {id:'vrr',idField:'vrrId',label:VRR_SOURCE,base:'https://openservice.vrr.de/openservice/',warning:'VRR-Testzugang. Der Anbieter kann diesen Server für Tests verwenden; Ergebnisse und Verfügbarkeit sind nicht garantiert.'};
export const EFA_PROVIDER = {id:'efa',idField:'efaId',label:EFA_SOURCE,base:'https://www.efa.de/efa/',warning:''};
export const validVrrId = id => typeof id === 'string' && /^(?:[a-z]{2}:\d+:[\w-]+(?::[\w-]+)*|\d{5,12})$/i.test(id);
async function request(method, params, signal, provider=VRR_PROVIDER) {
 const url = new URL(method, provider.base), query=new URLSearchParams({outputFormat:'rapidJSON',coordOutputFormat:'WGS84[dd.ddddd]',language:'de'});
 for(const [key,value] of Object.entries(params))if(Array.isArray(value)){for(const item of value)query.append(key,String(item));}else query.set(key,String(value));
 url.search=query.toString();
 const data = await fetchJSON(url, {}, signal, 22000);
 const error = data.systemMessages?.find(m => m.type === 'error');
 // Broker ambiguity/no-match replies are valid station search results, even
 // when EFA labels them "error". They must not become a network outage.
 if(error&&!(method==='XML_STOPFINDER_REQUEST'&&[-8011,-8014].includes(Number(error.code)))){const failure=Error(provider.label+': '+(plainText(error.text)||'Die Auskunft hat die Anfrage nicht bestätigt ('+error.code+').'));failure.code='PROVIDER_REJECTED';throw failure;}
 return data;
}
export function parseVrrStation(raw, provider=VRR_PROVIDER) {
 const stop = raw.type === 'platform' && raw.parent?.type === 'stop' ? raw.parent : raw;
 const coord = stop.coord || raw.coord || [];
 const city = stop.parent?.name || '';
 const name = stop.name || '';
 const coordinate=['address','coord'].includes(stop.type);
 // A German EFA service also returns foreign stops. Numeric keys are opaque;
 // retain a country only when its global stop ID explicitly supplies one.
 const country=/^([a-z]{2}):/i.exec(stop.id||'')?.[1].toUpperCase()||'';
 return {id:coordinate?'coord:'+coord.join(':'):provider.id+':'+stop.id,...(!coordinate?{[provider.idField]:String(stop.id||'')}:{locationType:'coordinate'}),aliases:[stop.disassembledName,stop.properties?.mainLocality].filter(Boolean).join(' '),locality:stop.properties?.mainLocality||city,networkModes:[...new Set((stop.productClasses||raw.productClasses||[]).map(cls=>vrrProduct({product:{class:cls}}).mode))],dbId:'',name:city && !normalize(name).startsWith(normalize(city)) ? city+', '+name : name,country,lat:coord[0],lon:coord[1],main:false};
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
 if([a,b].some(s=>s?.locationType==='coordinate'))return [a.lat,a.lon,b.lat,b.lon].every(Number.isFinite)&&distanceKm(a,b)<=.03;
 if([a,b].some(isMapStop))return sameStation(a,b);
 if(a[provider.idField] && b[provider.idField]) return a[provider.idField]===b[provider.idField];
 const key=s=>normalize(s.name).replace(/\b(hauptbahnhof|hbf|bahnhof|station)\b/g,'').replace(/[^\p{L}\p{N}]/gu,'');
 return sameStation(a,b)||!!key(a)&&key(a)===key(b)&&[a.lat,a.lon,b.lat,b.lon].every(Number.isFinite)&&distanceKm(a,b)<.8;
}
async function resolveStation(station, signal, provider=VRR_PROVIDER) {
 if(validVrrId(station[provider.idField]))return station;
 const matches=await findVrrStations(station.name,signal,provider);
 if(isMapStop(station))matches.sort((a,b)=>distanceKm(station,a)-distanceKm(station,b));
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
function geometry(raw, from, to, provider=VRR_PROVIDER, maxGap=.5) {
 const coords=raw.coords;
 if(!Array.isArray(coords)||coords.length<2||coords.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>90||Math.abs(p[1])>180)||coords.length===2&&distanceKm(from,to)>.15)return {status:'missing',segments:[],source:provider.label};
 const close=(point,station)=>distanceKm({lat:point[0],lon:point[1]},station)<=maxGap;
 return {status:close(coords[0],from)&&close(coords.at(-1),to)?'complete':'partial',segments:[coords],source:provider.label};
}
function lineName(transport, fallback) {
 const line=transport.number||transport.disassembledName||transport.name||fallback;
 return /^\d+[A-Za-z]?$/.test(line)&&transport.properties?.trainType?transport.properties.trainType+' '+line:line;
}
function disabled(raw) {
 const statuses=Array.isArray(raw.realtimeStatus)?raw.realtimeStatus:[raw.realtimeStatus];
 return raw.cancelled===true||raw.isCancelled===true||raw.tripImpossible===true||raw.isRealtimeInformative===true||raw.isRealTimeOnlyInformative===true||raw.isRealtimeOnlyInformative===true||statuses.some(s=>['TRIP_CANCELLED','DEVIATION','REALTIME_ONLY_INFORMATIVE'].includes(s))||raw.properties?.isCancelled===true;
}
function stopover(raw,start,end,provider=VRR_PROVIDER) {
 const station=parseVrrStation(raw,provider);
 return {station,departure:iso(raw.departureTimeEstimated||raw.departureTimePlanned),arrival:iso(raw.arrivalTimeEstimated||raw.arrivalTimePlanned),plannedDeparture:iso(raw.departureTimePlanned),plannedArrival:iso(raw.arrivalTimePlanned),platform:raw.properties?.platformName||raw.properties?.platform,cancelled:disabled(raw),notices:parseVrrNotices(raw.infos,start,end,station.name,provider)};
}
// No geometry or timetable fallback is generated here. Only complete source journeys survive.
export function parseVrrJourneys(data, from, to, requested, provider=VRR_PROVIDER, coordinateEndpoints=false) {
 const journeys=[],excludedNotices=[];
 for(const trip of data.journeys||[])try {
  if(disabled(trip)){
   const start=iso(trip.legs?.[0]?.origin?.departureTimeEstimated||trip.legs?.[0]?.origin?.departureTimePlanned)||requested,end=iso(trip.legs?.at(-1)?.destination?.arrivalTimeEstimated||trip.legs?.at(-1)?.destination?.arrivalTimePlanned)||new Date(Date.parse(requested)+3*86400000).toISOString();
   excludedNotices.push(...parseVrrNotices([...(trip.infos||[]),...(trip.legs||[]).flatMap(l=>[...(l.infos||[]),...(l.origin?.infos||[]),...(l.destination?.infos||[])])],start,end,'Verworfener Verbindungsvorschlag ('+(trip.legs||[]).map(l=>lineName(l.transportation||{},'')).filter(Boolean).join(' / ')+'): '+from.name+' → '+to.name,provider));
   continue;
  }
  const sourceLegs=(trip.legs||[]).map(raw=>{
   const origin=raw.origin||{},destination=raw.destination||{},start=parseVrrStation(origin,provider),end=parseVrrStation(destination,provider);
   const departure=iso(origin.departureTimeEstimated||origin.departureTimePlanned),arrival=iso(destination.arrivalTimeEstimated||destination.arrivalTimePlanned);
   if(!departure||!arrival||![start.lat,start.lon,end.lat,end.lon].every(Number.isFinite))throw Error('Unvollständige Teilstrecke');
   const transport=raw.transportation||{},product=vrrProduct(transport),walking=product.mode==='walk';
   const notices=parseVrrNotices([...(raw.infos||[]),...(origin.infos||[]),...(destination.infos||[])],departure,arrival,start.name+' → '+end.name,provider);
   const stopovers=(raw.stopSequence||[]).map(s=>stopover(s,departure,arrival,provider));
   const physical=(raw,station)=>Array.isArray(raw.coord)?{lat:raw.coord[0],lon:raw.coord[1]}:station;
   const shape=geometry(raw,walking?physical(origin,start):start,walking?physical(destination,end):end,provider,walking?.03:.5),distance=walking?(Number.isFinite(raw.distance)&&raw.distance>=0?raw.distance:shape.status==='complete'?shape.segments.reduce((sum,segment)=>sum+segment.slice(1).reduce((n,p,i)=>n+distanceKm({lat:segment[i][0],lon:segment[i][1]},{lat:p[0],lon:p[1]})*1000,0),0):null):null;
   return {from:start,to:end,departure,arrival,plannedDeparture:iso(origin.departureTimePlanned),plannedArrival:iso(destination.arrivalTimePlanned),line:lineName(transport,product.modeLabel),...product,operator:transport.operator?.name||'',direction:transport.destination?.name||'',tripId:transport.properties?.tripCode!=null?String(transport.properties.tripCode):null,platform:origin.properties?.platformName||origin.properties?.platform,arrivalPlatform:destination.properties?.platformName||destination.properties?.platform,plannedPlatform:origin.properties?.plannedPlatformName,plannedArrivalPlatform:destination.properties?.plannedPlatformName,walking,...(walking?{distanceMeters:distance}:{}),cancelled:disabled(raw)||disabled(origin)||disabled(destination),realtime:raw.isRealtimeControlled===true,stops:stopovers.slice(1,-1).map(s=>s.station),stopovers,notices,notes:(raw.hints||[]).map(h=>plainText(h.content||h.text)).filter(Boolean),geometry:shape};
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
  if(legs.some(l=>l.cancelled)){excludedNotices.push(...legs.flatMap(l=>l.notices).map(n=>({...n,scope:'Verworfener Verbindungsvorschlag ('+legs.map(l=>l.line).join(' / ')+'): '+n.scope})));continue;}
  if(!legs.length||legs.some((l,i)=>Date.parse(l.arrival)<Date.parse(l.departure)||i&&(Date.parse(l.departure)<Date.parse(legs[i-1].arrival)||!sameVrrStation(legs[i-1].to,l.from,provider))))continue;
  const endpoint=(asked,actual)=>coordinateEndpoints?[asked.lat,asked.lon,actual.lat,actual.lon].every(Number.isFinite)&&distanceKm(asked,actual)<=.03:sameVrrStation(asked,actual,provider);
  if(Date.parse(legs[0].departure)<Date.parse(requested)||!endpoint(from,legs[0].from)||!endpoint(to,legs.at(-1).to))continue;
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
let efaMapNextRequestAt=0;
export async function requestEfaMap(method,params,signal){
 signal?.throwIfAborted();
 if(Date.now()<efaMapNextRequestAt)throw Error('Die Karten-Linienauskunft pausiert nach einem Anbieterfehler. Bitte später erneut laden.');
 try{return await request(method,params,signal,EFA_PROVIDER);}catch(error){if(!signal?.aborted&&['UPSTREAM_UNAVAILABLE','SOURCE_RESPONSE_INVALID'].includes(error.code))efaMapNextRequestAt=Date.now()+Math.max(30000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0);throw error;}
}
export const getEfaJourney=(from,to,departure,signal)=>getVrrJourney(from,to,departure,signal,EFA_PROVIDER);

export const getEfaJourneys=(from,to,departure,signal)=>getVrrJourney(from,to,departure,signal,EFA_PROVIDER,true);

// Each response owns a complete journey, including routed pedestrian access.
// Never join a nearby map stop to an unverified onward service.
export async function getEfaWalkingJourneys(from,to,departure,signal,maxMinutes=30){
 if(![15,30,60].includes(maxMinutes))throw Object.assign(Error('Bitte ein gültiges Gehbudget wählen.'),{code:'INVALID_INPUT'});
 let data;
 for(const local of berlinSearchDays(departure)){
  signal?.throwIfAborted();
  data=await request('XML_TRIP_REQUEST2',{type_origin:'coord',name_origin:from.lon+':'+from.lat+':WGS84[dd.ddddd]',type_destination:'coord',name_destination:to.lon+':'+to.lat+':WGS84[dd.ddddd]',itdDate:local.slice(0,10).replaceAll('-',''),itdTime:local.slice(11,16).replace(':',''),itdTripDateTimeDepArr:'dep',calcOneDirection:'1',useRealtime:'1',realDesc:'2',calcNumberOfTrips:'5',ptOptionsActive:'1',itOptionsActive:'1',trITMOT:'100',trITMOTvalue:String(maxMinutes),lineRestriction:'400',locationServerActive:'1',useProxFootSearch:'1'},signal,EFA_PROVIDER);
  if(!Array.isArray(data.journeys))throw Object.assign(Error('Die Fußweg-Auskunft hat keine auswertbare Verbindungsliste geliefert.'),{code:'SOURCE_RESPONSE_INVALID'});
  const journeys=parseVrrJourneys(data,from,to,departure,EFA_PROVIDER,true).filter(j=>{
   const walks=j.legs.filter(l=>l.walking),minutes=walkingMinutes(j);
   if(!walks.length||!j.legs.some(l=>!l.walking)||minutes===null||walks.reduce((n,l)=>n+Date.parse(l.arrival)-Date.parse(l.departure),0)>maxMinutes*60000||walks.some(l=>l.geometry.status!=='complete'||!Number.isFinite(l.distanceMeters))||walks.reduce((n,l)=>n+l.distanceMeters,0)>3000)return false;
   const firstRide=j.legs.findIndex(l=>!l.walking),access=j.legs.slice(0,firstRide);
   if(access.some(l=>l.distanceMeters>10)){
    const gap=Date.parse(j.legs[firstRide].departure)-Date.parse(access.at(-1).arrival),shift=Math.max(0,120000-gap);
    if(Date.parse(j.departure)-shift<Date.parse(departure))return false;
    // A pedestrian leg can begin earlier; retain its supplied duration and path.
    // Only calculated access times move. Transit departure times never do.
    if(shift){for(const l of access){l.sourceDeparture=l.departure;l.sourceArrival=l.arrival;l.departure=new Date(Date.parse(l.departure)-shift).toISOString();l.arrival=new Date(Date.parse(l.arrival)-shift).toISOString();l.plannedDeparture=undefined;l.plannedArrival=undefined;l.walkingTiming='calculated';l.notes.unshift('Fußweg-Zeiten aus der gelieferten Gehzeit berechnet: früher losgehen für mindestens 2 Minuten Reserve bis zur Weiterfahrt.');}j.departure=j.legs[0].departure;}
   }
   for(const l of walks)l.walkingFallback=true;
   j.alternativeKind='walking';j.walkingDistanceMeters=Math.round(walks.reduce((n,l)=>n+l.distanceMeters,0));
   j.endpointMappings=['Zusätzliche Fußweg-Option: Start und Ziel wurden über ihre gewählten Koordinaten geprüft (maximal 30 Meter Abweichung). Die Auskunft kann dafür eine nahe Adresse benennen.'];
   j.sourceWarning='Fußweg-Notlösung mit Quellverlauf; maximal '+maxMinutes+' Minuten und 3 km je Teilstrecke. Bei einem ersten Gehweg werden aus der Quellgehzeit mindestens 2 Minuten Reserve bis zur Weiterfahrt eingeplant. Interne Umstiege laut Auskunft. Die Zugänglichkeit aller Wege ist nicht bestätigt.';
   return true;
  });
  if(journeys.length)return journeys.slice(0,3);
  if(data.journeys.length)break;
 }
 const error=Object.assign(Error('Keine bestätigte Fußweg-Alternative innerhalb des Gehbudgets und der nächsten drei Kalendertage gefunden.'),{code:'NO_JOURNEY'});
 const end=new Date(Date.parse(departure)+3*86400000).toISOString();
 error.notices=mergeNotices((data?.journeys||[]).flatMap(t=>[parseVrrNotices(t.infos,departure,end,from.name+' → '+to.name,EFA_PROVIDER),...(t.legs||[]).map(l=>parseVrrNotices(l.infos,departure,end,from.name+' → '+to.name,EFA_PROVIDER))]));
 throw error;
}
