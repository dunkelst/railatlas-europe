import {fetchText} from './journey.mjs';
import {distanceKm,localZonedISO,zonedInput,normalize,searchStations} from './rail.mjs';
import {withinRegion} from './regions.mjs';
import catalogue from './tren-maya-stations.mjs';

export const TREN_MAYA_SOURCE='Tren Maya';
export const TREN_MAYA_URL='https://reservas.ventaboletostrenmaya.com.mx/web/portal/horarios';
export const trenMayaStations=catalogue.stations.map(s=>({id:'tren-maya:'+s.code,trenMayaId:s.code,name:'Tren Maya · '+s.name,lat:s.lat,lon:s.lon,country:'MX',dbId:'',main:false,networkMode:'rail',timeZone:s.timeZone,locality:s.locality,aliases:[s.name,s.locality,'Estación Bahnhof Station Tren Maya',s.airport||''].join(' '),lookupSource:TREN_MAYA_SOURCE,sourceUrl:s.sourceUrl,timetableStatus:'unverified',...(s.airport?{relatedAirport:s.airport}:{})}));
const byId=new Map(trenMayaStations.map(s=>[s.trenMayaId,s]));
export function findTrenMayaStations(query){return searchStations(trenMayaStations.map(s=>({...s,key:normalize(s.name),search:normalize(s.name+' '+s.aliases)})),query,18);}
export function trenMayaLocation(s){
 if(!s||!withinRegion(s.lat,s.lon,'mexico')||s.adoStationCode||s.transitousId)return null;
 if(s.trenMayaId!==undefined)return s.id==='tren-maya:'+s.trenMayaId?byId.get(s.trenMayaId)||null:null;
 const native=catalogue.stations.find(c=>c.osmId&&s.id==='osm:'+c.osmId);if(native)return byId.get(native.code);
 if(s.networkMode==='rail')return trenMayaStations.find(c=>distanceKm(s,c)<.8)||null;
 if(!s.placeType&&s.locationType!=='coordinate')return null;
 const name=normalize([s.name,s.locality,s.iata,s.relatedAirport].filter(Boolean).join(' '));
 const candidates=trenMayaStations.filter(c=>{
  const distance=distanceKm(s,c);if(!s.placeType)return distance<.8;
  if(s.placeType==='airport'||s.placeType==='terminal')return distance<10&&c.relatedAirport&&(s.iata||s.relatedAirport?c.relatedAirport===(s.iata||s.relatedAirport):name.includes(normalize(c.locality)));
  return s.placeType==='city'&&distance<25&&name.includes(normalize(c.locality));
 });
 return candidates.sort((a,b)=>distanceKm(s,a)-distanceKm(s,b))[0]||null;
}
export function trenMayaTimetableUrl(from,to,date){
 const url=new URL(TREN_MAYA_URL),prefix='_TmFlatTimetables_';
 url.search=new URLSearchParams({p_p_id:'TmFlatTimetables',p_p_lifecycle:'0',[prefix+'javax.portlet.action']:'sendTicketData',[prefix+'idFromStation']:from.trenMayaId,[prefix+'idToStation']:to.trenMayaId,[prefix+'departureDate']:date.slice(8,10)+'/'+date.slice(5,7)+'/'+date.slice(0,4),[prefix+'datePattern']:'dd/MM/yyyy',[prefix+'language']:'en_US'});
 return url;
}
const decode=s=>s.replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const value=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return value>0&&value<=0x10ffff?String.fromCodePoint(value):'';}).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
const text=s=>decode(s.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const clock=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const nextDay=date=>new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);
const same=(asked,actual)=>distanceKm(asked,actual)<=.03&&(!asked.trenMayaId||asked.id===actual.id&&asked.trenMayaId===actual.trenMayaId);
const invalid=()=>Object.assign(Error('Tren Maya hat keinen auswertbaren datumsbezogenen Fahrplan geliefert.'),{code:'SOURCE_RESPONSE_INVALID'});
export function parseTrenMayaTimetable(html,from,to,requested){
 const origin=trenMayaLocation(from),destination=trenMayaLocation(to);if(!origin||!destination||typeof html!=='string')throw invalid();
 const date=zonedInput(requested,origin.timeZone).slice(0,10),expected=date.slice(8,10)+'/'+date.slice(5,7)+'/'+date.slice(0,4);
 const echo=side=>html.match(new RegExp('_id'+side+'Station["\']\\)\\.val\\(["\'](\\d+)["\']\\)'))?.[1];
 if(echo('From')!==origin.trenMayaId||echo('To')!==destination.trenMayaId||html.match(/calendarsPicker\(["']setDate["'],["']([\d/]+)["']\)/)?.[1]!==expected)throw invalid();
 const body=html.match(/<tbody\b[^>]*class=["'][^"']*\btable-data\b[^"']*["'][^>]*>([\s\S]*?)<\/tbody>/i)?.[1];if(body===undefined)throw invalid();
 const rows=[...body.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi)];if(rows.length%2||rows.length>200)throw invalid();
 const journeys=[],endpointAlternatives=[],rejected={};let received=0;
 const reject=code=>{rejected[code]=(rejected[code]||0)+1;};
 const suggest=(side,asked,actual)=>{if(same(asked,actual))return;const d=distanceKm(asked,actual),limit=asked.placeType==='city'?25:['airport','terminal'].includes(asked.placeType)?10:.8;if(d>limit)return;const existing=endpointAlternatives.find(a=>a.side===side);if(existing)existing.journeys++;else endpointAlternatives.push({side,station:{...actual},distanceMeters:Math.round(d*1000),journeys:1});};
 for(let i=0;i<rows.length;i+=2){
  if(!/\btrain-short-retail\b/.test(rows[i][1])||!/\btr-detail\b/.test(rows[i+1][1]))throw invalid();received++;
  try{
   if(/\b(cancelled|canceled|suspended)\b/i.test(rows[i][1])){reject('UNAVAILABLE');continue;}
   const cells=[...rows[i][2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>text(m[1]));
   const duration=cells[3]?.match(/^(?:(\d+)\s*h\s*)?(?:(\d+)\s*min)?$/),minutes=Number(duration?.[1]||0)*60+Number(duration?.[2]||0);
   if(cells.length!==6||!clock(cells[1])||!clock(cells[2])||!/^\d{1,6}$/.test(cells[4])||!minutes||minutes>24*60)throw invalid();
   const detail=rows[i+1][2],starts=[...detail.matchAll(/<div\b[^>]*class=["'][^"']*\bstep\b[^"']*["'][^>]*>/gi)];
   const steps=starts.map((m,n)=>{const chunk=detail.slice(m.index,starts[n+1]?.index??detail.length),id=chunk.match(/data-station=["'](\d+)["']/)?.[1],time=chunk.match(/<span\b[^>]*class=["'][^"']*\btime\b[^"']*["'][^>]*>([\d:]+)<\/span>/)?.[1];if(!byId.has(id)||!clock(time))throw invalid();return {station:byId.get(id),time};});
   if(steps.length<2||steps[0].station.id!==origin.id||steps.at(-1).station.id!==destination.id||steps[0].time!==cells[1]||steps.at(-1).time!==cells[2]||Number(cells[5].match(/^\d+/)?.[0])!==steps.length-2)throw invalid();
   let day=date,previous=-Infinity;
   for(const step of steps){let instant=localZonedISO(day+'T'+step.time,step.station.timeZone);if(Date.parse(instant)<previous){day=nextDay(day);instant=localZonedISO(day+'T'+step.time,step.station.timeZone);}step.instant=instant;previous=Date.parse(instant);}
   const departure=steps[0].instant,arrival=steps.at(-1).instant;
   if(Date.parse(arrival)-Date.parse(departure)!==minutes*60000){reject('TIME_CONFLICT');continue;}
   if(Date.parse(departure)<Date.parse(requested)){reject('TOO_EARLY');continue;}
   if(!same(from,origin)||!same(to,destination)){reject('ENDPOINT_MISMATCH');suggest('from',from,origin);suggest('to',to,destination);continue;}
   const leg={from:{...origin},to:{...destination},departure,arrival,plannedDeparture:departure,plannedArrival:arrival,line:'Tren Maya '+cells[4],mode:'train',modeLabel:'Zug',operator:TREN_MAYA_SOURCE,direction:destination.name,tripId:cells[4]+':'+date,walking:false,realtime:false,cancelled:false,throughService:false,stops:steps.slice(1,-1).map(s=>({...s.station})),stopovers:steps.slice(1,-1).map(s=>({station:{...s.station},scheduledTime:s.instant,arrival:null,departure:null,plannedArrival:null,plannedDeparture:null,cancelled:false,notices:[]})),notices:[],notes:[],geometry:{status:'missing',segments:[],source:TREN_MAYA_SOURCE,reason:'unverified'}};
   journeys.push({departure,arrival,legs:[leg],notices:[],transfers:0,source:TREN_MAYA_SOURCE,sourceWarning:'Datumsbezogener Sollfahrplan von Tren Maya. Sitzplätze, Echtzeit und Störungen sind nicht bestätigt. Bahnhofszugänge und genauer Fahrweg sind nicht geliefert.',disruptionCoverage:'partial',disruptionCheck:'unavailable',routingStatus:'provider-checked',attributions:[{label:'Tren Maya · Fahrplan',url:trenMayaTimetableUrl(origin,destination,date).toString()}],fetchedAt:new Date().toISOString()});
  }catch{reject('INVALID_DATA');}
 }
 journeys.sort((a,b)=>Date.parse(a.arrival)-Date.parse(b.arrival)||Date.parse(a.departure)-Date.parse(b.departure));
 return {journeys,endpointAlternatives,diagnostics:{provider:TREN_MAYA_SOURCE,received,accepted:journeys.length,rejected}};
}
const cache=new Map();let retryAt=0;
export async function getTrenMayaJourneys(from,to,departure,signal){
 signal?.throwIfAborted();const origin=trenMayaLocation(from),destination=trenMayaLocation(to);
 if(!origin||!destination){if(from.trenMayaId||to.trenMayaId)throw Object.assign(Error('Für die Tren-Maya-Reise bitte zwei erfasste Bahnhöfe oder zugehörige Orte wählen.'),{code:'NO_JOURNEY'});return null;}
 if(origin.id===destination.id)throw Object.assign(Error('Für die Tren-Maya-Reise bitte zwei unterschiedliche Bahnhöfe wählen.'),{code:'NO_JOURNEY'});
 const date=zonedInput(departure,origin.timeZone).slice(0,10),url=trenMayaTimetableUrl(origin,destination,date).toString(),saved=cache.get(url);let html=saved?.until>Date.now()?saved.html:null;
 if(!html){
  if(Date.now()<retryAt)throw Object.assign(Error('Die Tren-Maya-Auskunft pausiert nach einem Anbieterfehler. Bitte gleich erneut suchen.'),{code:'UPSTREAM_UNAVAILABLE'});
  try{
   html=await fetchText(url,{headers:{Accept:'text/html','User-Agent':'RailAtlas/42 (+https://github.com/dunkelst/railatlas-europe)'}},signal,22000,2*1024*1024);
   // Validate the dated source before it can enter the short-lived raw cache.
   parseTrenMayaTimetable(html,from,to,departure);
   if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(url,{html,until:Date.now()+60000});
  }catch(error){signal?.throwIfAborted();if(!error.responseTooLarge)retryAt=Date.now()+Math.max(30000,error.retryAfterMs||0);throw Object.assign(Error(error.code==='SOURCE_RESPONSE_INVALID'?error.message:'Die Tren-Maya-Auskunft ist gerade nicht erreichbar. Bitte gleich erneut suchen.'),{code:error.code||'UPSTREAM_UNAVAILABLE',cause:error});}
 }
 const result=parseTrenMayaTimetable(html,from,to,departure);
 if(!result.journeys.length)throw Object.assign(Error(result.endpointAlternatives.length?'Tren Maya liefert Fahrten ab tatsächlichen Bahnhöfen. Bitte die vorgeschlagenen Bahnhöfe prüfen und übernehmen.':'Tren Maya bestätigt für diese Bahnhöfe und Abfahrtszeit keine nutzbare Direktfahrt.'),{code:result.diagnostics.received?'JOURNEY_REJECTED':'NO_JOURNEY',...result});
 return result.journeys;
}
