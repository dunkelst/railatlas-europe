import {findTimetableStations, getTimetableJourneys, journeyPreferences, timetableSources} from './timetable.mjs';
import {validVrrId} from './vrr.mjs';
import {apiJson, apiOptions, rejectOrigin} from './api-cors.mjs';
import {fetchNetwork} from './network.mjs';
import {REGIONS,withinRegion} from './regions.mjs';

function validStation(s) {
  return s && typeof s.name === 'string' && s.name.trim().length > 0 && s.name.length < 200 && typeof s.dbId === 'string' && (!s.dbId || /^\d{6,9}$/.test(s.dbId)) && Number.isFinite(s.lat) && Number.isFinite(s.lon) && s.lat >= -90 && s.lat <= 90 && s.lon >= -180 && s.lon <= 180;
}
// Shared by Sites and the independent Node server; no Site services needed.
export async function handleApi(request) {
  const url = new URL(request.url), path = url.pathname;
  const methods = {'/api/stations': 'GET', '/api/journeys': 'POST', '/api/network': 'GET', '/api/health': 'GET'};
  const method = methods[path], json = (body, init = {}) => apiJson(request, body, {headers: {'Cache-Control': 'no-store'}, ...init});
  if (!method) return json({error: 'Unbekannte API-Adresse.'}, {status: 404});
  if (request.method === 'OPTIONS') return apiOptions(request, method);
  const rejected = rejectOrigin(request); if (rejected) return rejected;
  if (request.method !== method) return json({error: 'Unzulässige HTTP-Methode.'}, {status: 405, headers: {Allow: method}});
  if (path === '/api/health') return json({service: 'RailAtlas Europa', apiVersion: 1, standalone: true});
  if (path === '/api/network') {
    try {return json(await fetchNetwork((url.searchParams.get('bbox') || '').split(',').map(Number), (url.searchParams.get('modes') || '').split(','), request.signal, url.searchParams.get('detail')||'all',url.searchParams.get('refresh')==='1',url.searchParams.get('region')||undefined));}
    catch (e) {return json({error: e.message || 'Die Netzebenen konnten nicht geladen werden.'}, {status: e.code==='INVALID_INPUT'?400:502});}
  }
  if (path === '/api/stations') {
    const q = url.searchParams.get('q')?.trim() || '', source = url.searchParams.get('source') || 'auto',region=url.searchParams.get('region')||'europe';
    if(!Object.hasOwn(REGIONS,region))return json({error:'Unbekannte Region.'},{status:400});
    const near=url.searchParams.has('near')?url.searchParams.get('near').split(',').map(Number):undefined;
    if(near&&(near.length!==2||!near.every(Number.isFinite)||!withinRegion(near[0],near[1],region)))return json({error:'Ungültige Suchposition.'},{status:400});
    if (!timetableSources.includes(source)) return json({error: 'Unbekannte Auskunft.'}, {status: 400});
    if(region==='mexico'&&source!=='auto')return json({error:'Für Mexiko bitte die automatische Auskunft verwenden.'},{status:400});
    if (q.length < 2 || q.length > 120) return json({stations: []});
    try {return json({stations: await findTimetableStations(q, source, request.signal,region,near)}, {headers: {'Cache-Control': source === 'oebb' ? 'private, max-age=3600' : 'private, no-store'}});}
    catch (e) {return json({stations: [], error: e.message || 'Die ergänzende Online-Suche ist gerade nicht erreichbar.'}, {status: 502});}
  }
  try {
    const text = await request.text();
    if (text.length > 20000) return json({error: 'Die Anfrage ist zu groß.'}, {status: 400});
    let input; try {input = JSON.parse(text);} catch {return json({error: 'Die Anfrage enthält kein gültiges JSON.'}, {status: 400});}
    const {from, to, departure, source = 'auto', preference = 'arrival', walkingBudget = 0,region='europe'} = input || {};
    if(!Object.hasOwn(REGIONS,region))return json({error:'Unbekannte Region.'},{status:400});
    if(region==='mexico'&&source!=='auto')return json({error:'Für Mexiko bitte die automatische Auskunft verwenden.'},{status:400});
    if(walkingBudget&&(region==='mexico'||from?.country==='MX'&&to?.country==='MX'))return json({error:'Zusätzliche Fußweg-Notlösungen sind für Mexiko nicht bestätigt.'},{status:400});
    if(![0,15,30,60].includes(walkingBudget)||walkingBudget&&source!=='auto')return json({error:'Fußweg-Notlösungen bitte mit automatischer Auskunft und einem Gehbudget von 15, 30 oder 60 Minuten je Teilstrecke wählen.'},{status:400});
    if (!timetableSources.includes(source) || !journeyPreferences.includes(preference) || [from, to].some(s => ['vrrId', 'efaId'].some(key => s?.[key] !== undefined && !validVrrId(s[key])))) return json({error: 'Bitte eine gültige Auskunft und Haltestelle wählen.'}, {status: 400});
    if (!validStation(from) || !validStation(to) || typeof departure !== 'string' || !/(Z|[+-]\d\d:\d\d)$/.test(departure) || !Number.isFinite(Date.parse(departure))) return json({error: 'Bitte gültige Bahnhöfe, Datum und Abfahrtszeit wählen.'}, {status: 400});
    if (Date.parse(departure) < Date.now() - 5 * 60000) return json({error: 'Die Abfahrt liegt in der Vergangenheit. Bitte Datum oder Uhrzeit anpassen.'}, {status: 400});
    if (Date.parse(departure) > Date.now() + 365 * 86400000) return json({error: 'Bitte eine Abfahrt innerhalb der nächsten zwölf Monate wählen.'}, {status: 400});
    const journeys=await getTimetableJourneys(from,to,departure,source,request.signal,preference,walkingBudget,region);return json({journey:journeys[0],journeys});
  } catch (e) {return json({error: e instanceof Error ? e.message : 'Die Fahrplanabfrage ist fehlgeschlagen.',code:e.code||'UPSTREAM_UNAVAILABLE',notices:Array.isArray(e?.notices)?e.notices:[],...(e.diagnostics?{diagnostics:e.diagnostics}:{}),...(e.endpointAlternatives?{endpointAlternatives:e.endpointAlternatives}:{} )}, {status: ['NO_JOURNEY','JOURNEY_REJECTED','WALKING_PATH_UNCONFIRMED'].includes(e.code)?422:502});}
}
