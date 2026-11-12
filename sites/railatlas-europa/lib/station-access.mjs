import {distanceKm} from './rail.mjs';
import catalogue from './tren-maya-stations.mjs';
// Official access guidance, checked 01.11.2026. These are not timed journey legs.
const teyaStation=catalogue.stations.find(s=>s.code==='15'),cancunStation=catalogue.stations.find(s=>s.code==='22');
const teya={
 title:'R901 IE-TRAM · La Plancha ↔ Mérida Teya',
 text:'R901 verbindet La Plancha mit dem Bahnhof Mérida Teya. Einstieg und aktuelle Abfahrten in der Va-y-Ven-App oder vor Ort prüfen.',
 url:'https://transporteyucatan.org.mx/rutas/R901',
 source:'ATY · offizielle R901-Karte (2026)',
 checkedAt:'2026-11-01',
};
const cancun={
 title:'Tren Maya Conecta · Cancún Aeropuerto',
 text:'Tren Maya bestätigt einen Zubringer zwischen Bahnhof und Flughafen Cancún. Terminal, Einstiegsstelle und aktuelle Abfahrten beim Betreiber prüfen.',
 url:'https://www.trenmaya.gob.mx/comunicado150826.php',
 source:'Tren Maya · Betreiberinformation vom 15.08.2026',
 checkedAt:'2026-11-01',
};
export function stationAccess(station){
 if(station?.country!=='MX'||![station.lat,station.lon].every(Number.isFinite))return null;
 if(station.id==='tren-maya:15'&&station.trenMayaId==='15'&&distanceKm(station,teyaStation)<.03)return teya;
 if(station.id==='tren-maya:22'&&station.trenMayaId==='22'&&distanceKm(station,cancunStation)<.03||(station.iata==='CUN'||station.relatedAirport==='CUN')&&distanceKm(station,cancunStation)<5)return cancun;
 return null;
}
