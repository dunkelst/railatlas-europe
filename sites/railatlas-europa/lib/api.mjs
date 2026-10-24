import {findOnlineStations, getJourney} from './journey.mjs';
import {findVrrStations, getVrrJourney, validVrrId} from './vrr.mjs';
import {apiJson, apiOptions, rejectOrigin} from './api-cors.mjs';
import {fetchNetwork} from './network.mjs';

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
    try {return json(await fetchNetwork((url.searchParams.get('bbox') || '').split(',').map(Number), (url.searchParams.get('modes') || '').split(','), request.signal));}
    catch (e) {return json({error: e.message || 'Die Netzebenen konnten nicht geladen werden.'}, {status: 502});}
  }
  if (path === '/api/stations') {
    const q = url.searchParams.get('q')?.trim() || '', source = url.searchParams.get('source') || 'oebb';
    if (!['oebb', 'vrr'].includes(source)) return json({error: 'Unbekannte Auskunft.'}, {status: 400});
    if (q.length < 2 || q.length > 120) return json({stations: []});
    try {return json({stations: await (source === 'vrr' ? findVrrStations : findOnlineStations)(q, request.signal)}, {headers: {'Cache-Control': source === 'vrr' ? 'private, no-store' : 'private, max-age=3600'}});}
    catch {return json({stations: [], error: 'Die ergänzende Online-Suche ist gerade nicht erreichbar.'}, {status: 502});}
  }
  try {
    const text = await request.text();
    if (text.length > 20000) return json({error: 'Die Anfrage ist zu groß.'}, {status: 400});
    let input; try {input = JSON.parse(text);} catch {return json({error: 'Die Anfrage enthält kein gültiges JSON.'}, {status: 400});}
    const {from, to, departure, source = 'oebb'} = input || {};
    if (!['oebb', 'vrr'].includes(source) || [from, to].some(s => s?.vrrId !== undefined && !validVrrId(s.vrrId))) return json({error: 'Bitte eine gültige Auskunft und Haltestelle wählen.'}, {status: 400});
    if (!validStation(from) || !validStation(to) || typeof departure !== 'string' || !/(Z|[+-]\d\d:\d\d)$/.test(departure) || !Number.isFinite(Date.parse(departure))) return json({error: 'Bitte gültige Bahnhöfe, Datum und Abfahrtszeit wählen.'}, {status: 400});
    if (Date.parse(departure) < Date.now() - 5 * 60000) return json({error: 'Die Abfahrt liegt in der Vergangenheit. Bitte Datum oder Uhrzeit anpassen.'}, {status: 400});
    if (Date.parse(departure) > Date.now() + 365 * 86400000) return json({error: 'Bitte eine Abfahrt innerhalb der nächsten zwölf Monate wählen.'}, {status: 400});
    return json({journey: await (source === 'vrr' ? getVrrJourney : getJourney)(from, to, departure, request.signal)});
  } catch (e) {return json({error: e instanceof Error ? e.message : 'Die Fahrplanabfrage ist fehlgeschlagen.', notices: Array.isArray(e?.notices) ? e.notices : []}, {status: 502});}
}
