import {fetchJSON} from './journey.mjs';

export const TRANSITOUS_SOURCE='Transitous / MOTIS (GTFS)';
export const TRANSITOUS_ATTRIBUTIONS=[{label:'Transitous-Datenquellen',url:'https://transitous.org/sources/'},{label:'OpenStreetMap',url:'https://www.openstreetmap.org/copyright'}];
const modes={rail:['HIGHSPEED_RAIL','LONG_DISTANCE','NIGHT_RAIL','REGIONAL_RAIL'],suburban:['SUBURBAN'],subway:['SUBWAY'],tram:['TRAM'],bus:['BUS','COACH']};
const localMode=new Map(Object.entries(modes).flatMap(([mode,values])=>values.map(value=>[value,mode])));
export function transitousModes(raw){return [...new Set((Array.isArray(raw?.modes)?raw.modes:[]).map(m=>localMode.get(m)).filter(Boolean))];}
export function parseTransitousStation(raw){
 if(typeof raw?.stopId!=='string'||!raw.stopId.length||raw.stopId.length>500||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>=200||![raw.lat,raw.lon].every(Number.isFinite)||Math.abs(raw.lat)>90||Math.abs(raw.lon)>180)return null;
 return {id:'transitous:'+raw.stopId,transitousId:raw.stopId,name:raw.name,lat:raw.lat,lon:raw.lon,dbId:'',country:'',main:false,networkModes:transitousModes(raw).map(m=>m==='rail'?'train':m),lookupSource:TRANSITOUS_SOURCE,timetableStatus:'unverified'};
}
let nextRequestAt=0;
// Bounds and map modes are validated by the shared network handler.
export async function fetchTransitousStops(bounds,selected,signal){
 signal?.throwIfAborted();
 if(Date.now()<nextRequestAt)throw Error('Die europäische Haltestellenquelle pausiert nach einem Anbieterfehler.');
 const native=[...new Set(selected.flatMap(m=>modes[m]||[]))];if(!native.length)throw Error('Ungültige Verkehrsmittelauswahl.');
 const [s,w,n,e]=bounds,url=new URL('https://api.transitous.org/api/v6/map/stops');
 url.search=new URLSearchParams({min:s+','+w,max:n+','+e,grouped:'true',modes:native.join(',')});
 try{
  const data=await fetchJSON(url,{headers:{'User-Agent':'RailAtlas-Europa/24 (+https://github.com/dunkelst/railatlas-europe)'}},signal,16000,4*1024*1024);
  if(!Array.isArray(data))throw Object.assign(Error('Die europäische Haltestellenquelle liefert keine lesbare Liste.'),{code:'SOURCE_RESPONSE_INVALID'});
  return data;
 }catch(error){
  signal?.throwIfAborted();nextRequestAt=Date.now()+Math.max(30000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0);throw error;
 }
}
