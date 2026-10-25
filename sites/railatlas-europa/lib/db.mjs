import {fetchJSON,parseJourneys,parseStation,sameStation,sameNearbyStation,timestamp} from './journey.mjs';
import {berlinSearchDays,normalize,distanceKm} from './rail.mjs';
import {plainText,mergeNotices,transportProduct} from './transit.mjs';

export const DB_SOURCE='DB / bahn.de';
const base='https://int.bahn.de/web/api/',headers={'User-Agent':'RailAtlas-Europa/1.0 (+https://github.com/dunkelst/railatlas-europe)'};
const products=['ICE','EC_IC','IR','REGIONAL','SBAHN','BUS','SCHIFF','UBAHN','TRAM','ANRUFPFLICHTIG'];
const classes={ICE:1,EC_IC:2,IR:16,REGIONAL:16,SBAHN:32,BUS:64,SCHIFF:128,UBAHN:256,TRAM:512,ANRUFPFLICHTIG:2048};
const cache=new Map();let pause=0;
async function request(path,body,signal){
 signal?.throwIfAborted();if(Date.now()<pause){const e=Error('Die ergänzende DB-Auskunft pausiert nach einem Anbieterfehler.');e.code='UPSTREAM_UNAVAILABLE';throw e;}
 try{const data=await fetchJSON(new URL(path,base),{headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})},signal,20000);if(data.fehlerNachricht)throw Object.assign(Error(plainText(data.fehlerNachricht.text||data.fehlerNachricht.ueberschrift)),{code:'PROVIDER_REJECTED'});return data;}
 catch(e){if(!signal?.aborted){console.warn('[RailAtlas] DB-Auskunft',String(path).startsWith('http')?new URL(path).pathname:String(path),e.code||'UNKNOWN',e.message);if(e.code!=='PROVIDER_REJECTED')pause=Date.now()+30000;}throw e;}
}
export function parseDbStation(raw,context={}){
 const s=parseStation(raw),places=String(raw.name||'').split(',').map(x=>x.trim()),last=places.at(-1),known=normalize((context.aliases||'')+' '+(context.locality||'')+' '+(context.name||''));
 return {...s,id:'db:'+s.dbId,dbStopId:s.dbId,dbId:'',dbLid:raw.id,country:s.country||context.country||'',networkModes:(raw.products||[]).map(p=>transportProduct({cls:classes[p]}).mode),locality:known.includes(normalize(last))?last:context.locality||''};
}
async function resolve(station,signal){
 const key=station.id+':'+station.lat+':'+station.lon+':'+normalize(station.name),saved=cache.get(key);signal?.throwIfAborted();if(saved&&saved.until>Date.now())return saved.stop;
 const url=new URL('reiseloesung/orte/nearby',base);url.search=new URLSearchParams({lat:String(station.lat),long:String(station.lon),radius:'300',maxNo:'15'});
 const data=await request(url,undefined,signal),stops=(Array.isArray(data)?data:[]).filter(s=>s.type==='ST').map(s=>parseDbStation(s,station)).filter(s=>sameNearbyStation(station,s));
 stops.sort((a,b)=>distanceKm(station,a)-distanceKm(station,b));
 const stop=stops[0];if(!stop)throw Object.assign(Error('„'+station.name+'“ konnte der ergänzenden DB-Auskunft nicht eindeutig zugeordnet werden.'),{code:'STATION_NOT_FOUND'});
 if(cache.size>=200)cache.delete(cache.keys().next().value);cache.set(key,{stop,until:Date.now()+3600000});return stop;
}
function cancelled(raw){return raw?.cancelled===true||raw?.originCancelled===true||raw?.destinationCancelled===true||(raw?.risNotizen||[]).some(n=>/cancelled|brokentrip|entry.*disabled|exit.*disabled/.test(n.key||''));}
function notices(objects,start,end,scope){
 const output=[];
 for(const raw of objects.filter(Boolean))for(const info of [...(raw.risNotizen||[]),...(raw.himMeldungen||[]),...(raw.priorisierteMeldungen||[])]){
  const text=plainText(info.text||info.value||info.kurzText||info.titel||''),code=String(info.key||info.type||'');if(!text)continue;
  const from=info.validFrom?timestamp(info.validFrom):null,until=info.validUntil?timestamp(info.validUntil):null;
  if(from&&Date.parse(from)>Date.parse(end)||until&&Date.parse(until)<Date.parse(start))continue;
  if(output.some(n=>n.text===text&&n.scope===scope&&n.validFrom===from&&n.validUntil===until))continue;
  output.push({id:'db:'+code+':'+text+':'+scope,code,title:'Betriebshinweis',text,kind:/cancelled|ausfall/i.test(code+' '+text)?'cancellation':/sperr/i.test(text)?'closure':/verspät/i.test(text)?'delay':'notice',severity:'warning',validFrom:from,validUntil:until,periods:[],validity:from||until?'dated':'unspecified',scope,source:DB_SOURCE,routingUncertain:/nicht.{0,30}berücksichtigt/i.test(text)});
 }
 return mergeNotices([output]);
}
function geometry(raw,from,to){
 const descriptions=raw.polylineGroup?.polylineDescriptions||[],segments=descriptions.filter(p=>p.delta===false).map(p=>(p.coordinates||[]).map(c=>[c.lat,c.lng])).filter(p=>p.length>=2&&p.every(c=>c.every(Number.isFinite)&&Math.abs(c[0])<=90&&Math.abs(c[1])<=180));
 if(!segments.length||segments.flat().length===2&&distanceKm(from,to)>.15)return {status:'missing',segments:[],source:DB_SOURCE};
 const close=(p,s)=>distanceKm({lat:p[0],lon:p[1]},s)<.5;
 return {status:segments.length===descriptions.length&&close(segments[0][0],from)&&close(segments.at(-1).at(-1),to)?'complete':'partial',segments,source:DB_SOURCE};
}
export function parseDbJourneys(data,from,to,requested){
 const result=[],excluded=[];
 for(const raw of data.verbindungen||[]){
  if(cancelled(raw)){excluded.push(...notices([raw],requested,new Date(Date.parse(requested)+3*86400000).toISOString(),'Verworfener DB-Vorschlag ('+(raw.verbindungsAbschnitte||[]).map(l=>l.verkehrsmittel?.name).filter(Boolean).join(' / ')+')'));continue;}
  const parsed=parseJourneys({verbindungen:[raw]},from,to,requested)[0];if(!parsed)continue;
  const sourceLegs=raw.verbindungsAbschnitte||[];
  parsed.legs=parsed.legs.map((leg,i)=>{
   const r=sourceLegs[i],v=r.verkehrsmittel||{},stops=r.halte||[],scope=leg.from.name+' → '+leg.to.name;
   const stopovers=stops.map(s=>({station:parseStation(s),departure:timestamp(s.abfahrt?.echtzeit||s.abfahrt?.sollzeit),arrival:timestamp(s.ankunft?.echtzeit||s.ankunft?.sollzeit),plannedDeparture:timestamp(s.abfahrt?.sollzeit),plannedArrival:timestamp(s.ankunft?.sollzeit),platform:s.ezGleis||s.gleis,cancelled:cancelled(s),notices:notices([s],leg.departure,leg.arrival,s.name)}));
   return {...leg,...(v.produktGattung==='ANRUFPFLICHTIG'?{mode:'bus',modeLabel:'Rufverkehr (Anmeldung erforderlich)'}:transportProduct({cls:classes[v.produktGattung]||0,name:v.name,prodCtx:{catOut:v.kategorie}},leg.walking)),notes:[...new Set([...leg.notes,...(v.zugattribute||[]).map(a=>plainText(a.value||'')).filter(Boolean)])],operator:(v.zugattribute||[]).find(a=>a.kategorie==='BEFÖRDERER')?.value||'',direction:v.richtung||'',tripId:r.journeyId||null,plannedDeparture:timestamp(r.abfahrt?.sollzeit),plannedArrival:timestamp(r.ankunft?.sollzeit),plannedPlatform:stops[0]?.gleis,plannedArrivalPlatform:stops.at(-1)?.gleis,realtime:!!(r.abfahrt?.echtzeit||r.ankunft?.echtzeit),stopovers,notices:notices([r,...stops],leg.departure,leg.arrival,scope),geometry:geometry(r,leg.from,leg.to),cancelled:leg.cancelled||cancelled(r)||cancelled(stops[0])||cancelled(stops.at(-1))};
  });
  if(parsed.legs.some((l,i)=>l.cancelled||![l.from.lat,l.from.lon,l.to.lat,l.to.lon].every(Number.isFinite)||i&&!sameStation(parsed.legs[i-1].to,l.from)))continue;
  parsed.notices=mergeNotices([notices([raw],parsed.departure,parsed.arrival,from.name+' → '+to.name),...parsed.legs.map(l=>l.notices)]);
  if(parsed.notices.some(n=>n.routingUncertain))continue;
  const own=s=>({...s,id:'db:'+s.dbId,dbStopId:s.dbId,dbId:'',country:s.country||(from.country===to.country?from.country:'')});for(const leg of parsed.legs){leg.from=own(leg.from);leg.to=own(leg.to);leg.stops=leg.stops.map(own);for(const stop of leg.stopovers)stop.station=own(stop.station);}
  Object.assign(parsed,{source:DB_SOURCE,disruptionCoverage:'partial',disruptionCheck:'trip-only',routingStatus:'provider-checked',sourceTripId:raw.tripId,transfers:Number.isInteger(raw.umstiegsAnzahl)?raw.umstiegsAnzahl:parsed.transfers});result.push(parsed);
 }
 if(result.length)result[0].notices=mergeNotices([result[0].notices,excluded]);return result;
}
export async function getDbJourneys(from,to,departure,signal){
 const [origin,destination]=await Promise.all([resolve(from,signal),resolve(to,signal)]);let data,parsed=[];
 for(const when of berlinSearchDays(departure)){
  signal?.throwIfAborted();
  data=await request('angebote/fahrplan',{deutschlandTicketVorhanden:false,nurDeutschlandTicketVerbindungen:false,reservierungsKontingenteVorhanden:false,schnelleVerbindungen:true,sitzplatzOnly:false,abfahrtsHalt:origin.dbLid,ankunftsHalt:destination.dbLid,produktgattungen:products,anfrageZeitpunkt:when,ankunftSuche:'ABFAHRT',klasse:'KLASSE_2',reisende:[{typ:'ERWACHSENER',anzahl:1,alter:[],ermaessigungen:[{art:'KEINE_ERMAESSIGUNG',klasse:'KLASSENLOS'}]}]},signal);
  if(!Array.isArray(data.verbindungen))throw Object.assign(Error('Die ergänzende DB-Auskunft hat keine auswertbaren Verbindungsdaten geliefert.'),{code:'PROVIDER_REJECTED'});
  parsed=parseDbJourneys(data,origin,destination,departure);if(parsed.length||data.verbindungen.length)break;
 }
 if(!parsed.length)throw Object.assign(Error('Keine nutzbare DB-Verbindung innerhalb der nächsten drei Kalendertage bestätigt.'),{code:'NO_JOURNEY',notices:notices(data.verbindungen||[],departure,new Date(Date.parse(departure)+3*86400000).toISOString(),from.name+' → '+to.name)});
 // Refresh only the chosen alternative for available source geometry. Other
 // alternatives remain honest about missing geometry until queried again.
 const first=parsed[0],raw=data.verbindungen.find(t=>t.tripId===first.sourceTripId);
 if(raw?.ctxRecon)try{const refreshed=await request('reiseloesung/verbindung',{ctxRecon:raw.ctxRecon,poly:true},signal);const checked=parseDbJourneys({verbindungen:[refreshed]},origin,destination,departure)[0];if(!checked)throw Object.assign(Error('Die gewählte DB-Verbindung wurde bei der erneuten Prüfung nicht bestätigt.'),{code:'NO_JOURNEY'});checked.notices=mergeNotices([checked.notices,first.notices.filter(n=>n.scope.startsWith('Verworfener DB-Vorschlag'))]);parsed[0]=checked;}catch(e){signal?.throwIfAborted();if(e.code==='NO_JOURNEY')throw e;}
 for(const journey of parsed){journey.endpointMappings=[[from,origin],[to,destination]].map(([asked,resolved])=>'„'+asked.name+'“ wurde anhand von Name und Lage dem DB-Halt „'+resolved.name+'“ zugeordnet.');}
 return parsed.slice(0,3);
}
