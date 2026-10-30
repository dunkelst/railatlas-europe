import {findOnlineStations, getJourney, getJourneys, sameStation} from './journey.mjs';
import {findEfaStations, findVrrStations, getEfaJourney, getEfaJourneys, getEfaWalkingJourneys, getVrrJourney} from './vrr.mjs';
import {normalize, searchStations, rankJourneys} from './rail.mjs';
import {findTransportLocations as findBusStops} from './stop-search.mjs';
import {getDbJourneys} from './db.mjs';
import {getTransitousJourneys,findTransitousStations} from './transitous.mjs';
import {getAdoJourneys} from './ado.mjs';
import {getTrenMayaJourneys,findTrenMayaStations} from './tren-maya.mjs';
import {findMexicanMapStations} from './network.mjs';
import {mexicoLookupContext,rankMexicanLocations} from './location-search.mjs';

export const timetableSources = ['auto', 'oebb', 'efa', 'vrr'];
const providers = {oebb: {find: findOnlineStations, journey: getJourney}, efa: {find: findEfaStations, journey: getEfaJourney}, vrr: {find: findVrrStations, journey: getVrrJourney}};

// Reuse the catalogue's name/alias ranking; unrelated fuzzy provider hits must
// not hide a regional stop that only the other timetable source knows.
export function relevantStations(stations, query) {
  return searchStations(stations.map(s => ({...s, search: normalize(s.name+' '+(s.aliases||'')), key: normalize(s.name)})), query, 18);
}
export async function findTimetableStations(query, source='auto', signal,region='europe',near) {
  signal?.throwIfAborted();
  if (source !== 'auto') return providers[source].find(query, signal);
  if(region==='mexico'){
   const context=mexicoLookupContext(query,near);
   const trains=findTrenMayaStations(query);
   if(context.airports.some(a=>a.iata.toLowerCase()===query.trim().toLowerCase()))return rankMexicanLocations([...context.airports,...trains],context);
   const queries=[context.query,context.photonQuery,context.mapQuery],results=await Promise.allSettled([findTransitousStations(queries[0],signal,region,context.near),findBusStops(queries[1],signal,region,context.near),findMexicanMapStations(queries[2],context.near)]);signal?.throwIfAborted();
   const matches=rankMexicanLocations([...context.airports,...trains,...results.flatMap((r,i)=>r.status==='fulfilled'?relevantStations(r.value,queries[i]):[])],context);
   if(!matches.length&&results.some(r=>r.status==='rejected'))throw Error('Die mexikanische Haltestellensuche ist gerade nur teilweise erreichbar. Bitte erneut suchen.');return matches;
  }
  const results = await Promise.allSettled([providers.oebb.find(query, signal), providers.efa.find(query, signal), findBusStops(query,signal,region,near)]);
  signal?.throwIfAborted();
  const matches = relevantStations(results.slice(0,2).flatMap(r => r.status === 'fulfilled' ? r.value : []), query);
  const busStops=results[2].status==='fulfilled'?results[2].value:[];
  for(const stop of busStops)if(!matches.some(s=>sameStation(s,stop)))matches.push(stop);
  if (!matches.length && results.some(r => r.status === 'rejected')) throw Error('Die ergänzende Online-Suche ist gerade nur teilweise erreichbar. Bitte erneut suchen oder eine andere Auskunft wählen.');
  return matches;
}
export {rankJourneys} from './rail.mjs';
export const journeyPreferences=['arrival','transfers','walking'];
export async function getTimetableJourneys(from,to,departure,source='auto',signal,preference='arrival',walkingBudget=0,region='europe') {
  signal?.throwIfAborted();
  if(source!=='auto')return [await providers[source].journey(from,to,departure,signal)];
  if(region==='mexico'||from.country==='MX'&&to.country==='MX'){
   const results=await Promise.allSettled([getAdoJourneys(from,to,departure,signal),getTrenMayaJourneys(from,to,departure,signal)]);signal?.throwIfAborted();
   const journeys=rankJourneys(results.flatMap(r=>r.status==='fulfilled'?r.value||[]:[]),preference),errors=results.filter(r=>r.status==='rejected').map(r=>r.reason);
   if(journeys.length){for(const j of journeys)if(errors.some(e=>['UPSTREAM_UNAVAILABLE','SOURCE_RESPONSE_INVALID'].includes(e.code)))j.sourceWarning=[j.sourceWarning,'Der automatische Vergleich konnte nur einen Teil der Auskünfte bestätigen.'].join(' ');return journeys;}
   if(results.every(r=>r.status==='fulfilled'&&r.value===null))return rankJourneys(await getTransitousJourneys(from,to,departure,signal),preference);
   // Keep provider-specific boarding proposals together in the existing recovery flow.
   if(errors.length===1)throw errors[0];
   const endpointAlternatives=errors.flatMap(e=>e.endpointAlternatives||[]).sort((a,b)=>a.side.localeCompare(b.side)||a.distanceMeters-b.distanceMeters),received=errors.reduce((n,e)=>n+(e.diagnostics?.received||0),0);
   throw Object.assign(Error(endpointAlternatives.length?'Die Auskünfte liefern Fahrten ab anderen Einstiegen. Bitte die vorgeschlagenen Halte und Bahnhöfe prüfen und übernehmen.':errors.map(e=>e.message).join(' ')),{code:endpointAlternatives.length?'JOURNEY_REJECTED':errors.some(e=>e.code==='UPSTREAM_UNAVAILABLE'||e.code==='SOURCE_RESPONSE_INVALID')?'UPSTREAM_UNAVAILABLE':received?'JOURNEY_REJECTED':'NO_JOURNEY',endpointAlternatives,diagnostics:{provider:'ADO / Tren Maya',received,accepted:0,providers:errors.filter(e=>e.diagnostics).map(e=>e.diagnostics)}});
  }
  const results=await Promise.allSettled([getJourneys(from,to,departure,signal),getEfaJourneys(from,to,departure,signal),...(walkingBudget?[getEfaWalkingJourneys(from,to,departure,signal,walkingBudget)]:[])]);
  signal?.throwIfAborted();
  if(!results.some(r=>r.status==='fulfilled'&&r.value.length))try{results.push({status:'fulfilled',value:await getTransitousJourneys(from,to,departure,signal)});}catch(reason){signal?.throwIfAborted();results.push({status:'rejected',reason});}
  if(!results.some(r=>r.status==='fulfilled'&&r.value.length))try{results.push({status:'fulfilled',value:await getDbJourneys(from,to,departure,signal)});}catch(reason){signal?.throwIfAborted();results.push({status:'rejected',reason});}
  const journeys=rankJourneys(results.flatMap(r=>r.status==='fulfilled'?r.value:[]),preference);
  if(!journeys.length){const walking=results.find(r=>r.status==='rejected'&&r.reason?.code==='WALKING_PATH_UNCONFIRMED')?.reason,unavailable=results.some(r=>r.status==='rejected'&&['UPSTREAM_UNAVAILABLE','SOURCE_RESPONSE_INVALID'].includes(r.reason?.code||r.reason?.cause?.code));const diagnostic=results.find(r=>r.status==='rejected'&&r.reason?.diagnostics?.received>0)?.reason;const error=Error(walking?walking.message:diagnostic?diagnostic.message:unavailable?'Die angebundenen Auskünfte konnten gerade keine nutzbare Verbindung bestätigen; mindestens eine Datenquelle ist nicht erreichbar. Bitte die Suche erneut versuchen.':'Für diese Halte und Abfahrtszeit wurde in den angebundenen Auskünften keine nutzbare Verbindung bestätigt. Bitte Zeit oder Halte prüfen. Die Fahrplanabdeckung ist regional unterschiedlich.');if(walking)error.code=walking.code;else if(diagnostic){error.code=diagnostic.code;error.diagnostics=diagnostic.diagnostics;error.endpointAlternatives=diagnostic.endpointAlternatives;}error.notices=results.flatMap(r=>r.status==='rejected'&&Array.isArray(r.reason?.notices)?r.reason.notices:[]);throw error;}
  // Failed alternatives cannot erase a source's actual cancellation/closure notice.
  const excluded=results.flatMap(r=>r.status==='rejected'&&Array.isArray(r.reason?.notices)?r.reason.notices.map(n=>({...n,scope:'Andere Auskunft, verworfener Vorschlag: '+n.scope})):[]);
  for(const journey of journeys){journey.notices=[...(journey.notices||[]),...excluded];if(results.slice(0,2).some(r=>r.status==='rejected'))journey.sourceWarning=[journey.sourceWarning,'Der automatische Vergleich konnte nur einen Teil der Auskünfte bestätigen.'].filter(Boolean).join(' ');if(walkingBudget&&results[2]?.status==='rejected')journey.sourceWarning=[journey.sourceWarning,'Zusätzliche Fußweg-Option: '+results[2].reason.message].filter(Boolean).join(' ');}
  return journeys;
}
export async function getTimetableJourney(from,to,departure,source='auto',signal) {
  return (await getTimetableJourneys(from,to,departure,source,signal))[0];
}
