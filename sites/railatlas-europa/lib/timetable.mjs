import {findOnlineStations, getJourney} from './journey.mjs';
import {findEfaStations, findVrrStations, getEfaJourney, getVrrJourney} from './vrr.mjs';
import {normalize, searchStations} from './rail.mjs';

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
  const results = await Promise.allSettled([providers.oebb.find(query, signal), providers.efa.find(query, signal)]);
  signal?.throwIfAborted();
  const matches = relevantStations(results.flatMap(r => r.status === 'fulfilled' ? r.value : []), query);
  if (!matches.length && results.some(r => r.status === 'rejected')) throw Error('Die ergänzende Online-Suche ist gerade nur teilweise erreichbar. Bitte erneut suchen oder eine andere Auskunft wählen.');
  return matches;
}
export async function getTimetableJourney(from, to, departure, source='auto', signal) {
  signal?.throwIfAborted();
  if (source !== 'auto') return providers[source].journey(from, to, departure, signal);
  if (from.efaId || to.efaId) return providers.efa.journey(from, to, departure, signal);
  if (from.vrrId || to.vrrId) return providers.vrr.journey(from, to, departure, signal);
  try {return await providers.oebb.journey(from, to, departure, signal);}
  catch (error) {
    signal?.throwIfAborted();
    // Only an unresolved stop can change provider here. A cancelled service,
    // missing connection or outage never silently triggers another route.
    if (error.code !== 'STATION_NOT_FOUND') throw error;
    return providers.efa.journey(from, to, departure, signal);
  }
}
