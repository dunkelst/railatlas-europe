import airports from './mexico-airports-data.mjs';
import {normalize,distanceKm} from './rail.mjs';
import {MEXICO_PLACES,withinRegion} from './regions.mjs';

const cityAliases=new Set(['cdmx','df','mexico df','mexico d f','mexiko stadt','mexiko city','ciudad de mexico','mexico city','mexico distrito federal']);
const airportWords=/\b(flughafen|airport|airports|aeropuerto|aeropuertos|international|internacional|de|del)\b/g;
const cityQuery=q=>cityAliases.has(normalize(q))?'Mexico City':q;
export function airportSearchText(query){let text=normalize(query).replace(airportWords,' ').replace(/\s+/g,' ').trim();for(const a of airports)text=text.replace(new RegExp('\\b'+a.iata.toLowerCase()+'\\b','g'),a.locality);return cityQuery(text);}
export function findMexicanAirports(query){
 const q=normalize(airportSearchText(query)).replace(/\b(terminal|t)\s*\d+\b/g,'').trim(),tokens=q.split(' ').filter(Boolean),codes=airports.filter(a=>new RegExp('\\b'+a.iata.toLowerCase()+'\\b').test(normalize(query)));
 if(!tokens.length)return [];
 return airports.filter(a=>{
  if(codes.length===1)return a.iata===codes[0].iata;
  const text=normalize([a.name,a.locality,a.ident,a.iata,a.keywords,cityAliases.has(normalize(a.locality))?'Mexico City Ciudad de México CDMX Mexico DF Mexiko Stadt':''].join(' '));
  return tokens.every(t=>text.includes(t));
 }).map(a=>({id:'airport:'+a.ident,name:a.name+' ('+a.iata+')',lat:a.lat,lon:a.lon,dbId:'',country:'MX',main:false,
  iata:a.iata,locationType:'coordinate',placeType:'airport',networkMode:'airport',locality:a.locality,
  aliases:[a.iata,a.ident,a.keywords,a.locality,'Flughafen Aeropuerto Airport',cityAliases.has(normalize(a.locality))?'Ciudad de México CDMX Mexico DF Mexiko Stadt':''].join(' '),
  lookupSource:'OurAirports',sourceUrl:'https://ourairports.com/airports/'+a.ident+'/',timetableStatus:'unverified'}));
}
export function mexicoLookupContext(query,near){
 const found=findMexicanAirports(query),airportRequest=/\b(flughafen|airport|aeropuerto|terminal)\b/i.test(query)||found.some(a=>[a.iata,a.id.slice(8)].some(c=>new RegExp('\\b'+normalize(c)+'\\b').test(normalize(query)))),clean=airportRequest?airportSearchText(query):cityQuery(query);
 const city=MEXICO_PLACES.find(p=>normalize(p.label)===normalize(clean))||(cityAliases.has(normalize(clean))?MEXICO_PLACES.find(p=>p.id==='cdmx'):undefined);
 const focus=airportRequest&&found.length===1?[found[0].lat,found[0].lon]:city?.centre||near,terminal=airportRequest&&/\b(?:terminal|t)\s*(\d+)\b/i.exec(clean),lookup=terminal?'Terminal '+terminal[1]:clean;
 return {airports:found,airportRequest,query:lookup,photonQuery:cityAliases.has(normalize(lookup))?'Ciudad de México':lookup,mapQuery:cityAliases.has(normalize(lookup))?'Ciudad de México':lookup,near:focus};
}
export function locationHint(station){
 if(station.locality)return station.locality;
 if(!withinRegion(station.lat,station.lon,'mexico'))return '';
 const nearest=MEXICO_PLACES.map(p=>({p,distance:distanceKm(station,{lat:p.centre[0],lon:p.centre[1]})})).sort((a,b)=>a.distance-b.distance)[0];
 return nearest?.distance<60?'bei '+nearest.p.label:'';
}
export function rankMexicanLocations(stations,context){
 const unique=[...new Map(stations.filter(s=>withinRegion(s.lat,s.lon,'mexico')&&(!context.airportRequest||!context.airports.length||s.placeType==='airport'||context.airports.some(a=>distanceKm(a,s)<10))).map(s=>[s.id,s])).values()];
 const distance=s=>context.near?distanceKm(s,{lat:context.near[0],lon:context.near[1]}):0;
 unique.sort((a,b)=>(context.airportRequest?Number(b.placeType==='airport')-Number(a.placeType==='airport'):0)||Math.floor(distance(a)/25)-Math.floor(distance(b)/25)||(!context.airportRequest?Number(a.placeType==='airport')-Number(b.placeType==='airport'):0));
 return unique.slice(0,18).map(s=>({...s,locationHint:locationHint(s)}));
}
