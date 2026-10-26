import {findOnlineStations, getJourney, getJourneys, sameStation} from './journey.mjs';
import {findEfaStations, findVrrStations, getEfaJourney, getEfaJourneys, getEfaWalkingJourneys, getVrrJourney} from './vrr.mjs';
import {normalize, searchStations, rankJourneys} from './rail.mjs';
import {findBusStops} from './stop-search.mjs';
import {getDbJourneys} from './db.mjs';
import {getTransitousJourneys} from './transitous.mjs';

export const timetableSources = ['auto', 'oebb', 'efa', 'vrr'];
const providers = {oebb: {find: findOnlineStations, journey: getJourney}, efa: {find: findEfaStations, journey: getEfaJourney}, vrr: {find: findVrrStations, journey: getVrrJourney}};

// Reuse the catalogue's name/alias ranking; unrelated fuzzy provider hits must
// not hide a regional stop that only the other timetable source knows.
export function relevantStations(stations, query) {
  return searchStations(stations.map(s => ({...s, search: normalize(s.name+' '+(s.aliases||'')), key: normalize(s.name)})), query, 18);
}
export async function findTimetableStations(query, source='auto', signal) {
  signal?.throwIfAborted();
  if (source !== 'auto') return providers[source].find(query, signal);
  const results = await Promise.allSettled([providers.oebb.find(query, signal), providers.efa.find(query, signal), findBusStops(query,signal)]);
  signal?.throwIfAborted();
  const matches = relevantStations(results.slice(0,2).flatMap(r => r.status === 'fulfilled' ? r.value : []), query);
  const busStops=results[2].status==='fulfilled'?results[2].value:[];
  for(const stop of busStops)if(!matches.some(s=>sameStation(s,stop)))matches.push(stop);
  if (!matches.length && results.some(r => r.status === 'rejected')) throw Error('Die ergänzende Online-Suche ist gerade nur teilweise erreichbar. Bitte erneut suchen oder eine andere Auskunft wählen.');
  return matches;
}
export {rankJourneys} from './rail.mjs';
export const journeyPreferences=['arrival','transfers','walking'];
export async function getTimetableJourneys(from,to,departure,source='auto',signal,preference='arrival',walkingBudget=0) {
  signal?.throwIfAborted();
  if(source!=='auto')return [await providers[source].journey(from,to,departure,signal)];
  const results=await Promise.allSettled([getJourneys(from,to,departure,signal),getEfaJourneys(from,to,departure,signal),...(walkingBudget?[getEfaWalkingJourneys(from,to,departure,signal,walkingBudget)]:[])]);
  signal?.throwIfAborted();
  if(!results.some(r=>r.status==='fulfilled'&&r.value.length))try{results.push({status:'fulfilled',value:await getTransitousJourneys(from,to,departure,signal)});}catch(reason){signal?.throwIfAborted();results.push({status:'rejected',reason});}
  if(!results.some(r=>r.status==='fulfilled'&&r.value.length))try{results.push({status:'fulfilled',value:await getDbJourneys(from,to,departure,signal)});}catch(reason){signal?.throwIfAborted();results.push({status:'rejected',reason});}
  const journeys=rankJourneys(results.flatMap(r=>r.status==='fulfilled'?r.value:[]),preference);
  if(!journeys.length){const unavailable=results.some(r=>r.status==='rejected'&&['UPSTREAM_UNAVAILABLE','SOURCE_RESPONSE_INVALID'].includes(r.reason?.code||r.reason?.cause?.code));const error=Error(unavailable?'Die angebundenen Auskünfte konnten gerade keine nutzbare Verbindung bestätigen; mindestens eine Datenquelle ist nicht erreichbar. Bitte die Suche erneut versuchen.':'Für diese Halte und Abfahrtszeit wurde in den angebundenen Auskünften keine nutzbare Verbindung bestätigt. Bitte Zeit oder Halte prüfen. Die Fahrplanabdeckung ist regional unterschiedlich.');error.notices=results.flatMap(r=>r.status==='rejected'&&Array.isArray(r.reason?.notices)?r.reason.notices:[]);throw error;}
  // Failed alternatives cannot erase a source's actual cancellation/closure notice.
  const excluded=results.flatMap(r=>r.status==='rejected'&&Array.isArray(r.reason?.notices)?r.reason.notices.map(n=>({...n,scope:'Andere Auskunft, verworfener Vorschlag: '+n.scope})):[]);
  for(const journey of journeys){journey.notices=[...(journey.notices||[]),...excluded];if(results.slice(0,2).some(r=>r.status==='rejected'))journey.sourceWarning=[journey.sourceWarning,'Der automatische Vergleich konnte nur einen Teil der Auskünfte bestätigen.'].filter(Boolean).join(' ');if(walkingBudget&&results[2]?.status==='rejected')journey.sourceWarning=[journey.sourceWarning,'Zusätzliche Fußweg-Option: '+results[2].reason.message].filter(Boolean).join(' ');}
  return journeys;
}
export async function getTimetableJourney(from,to,departure,source='auto',signal) {
  return (await getTimetableJourneys(from,to,departure,source,signal))[0];
}
