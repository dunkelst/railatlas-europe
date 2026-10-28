import {fetchJSON} from './journey.mjs';
import {normalize} from './rail.mjs';
import {REGIONS} from './regions.mjs';

const countries=new Set('AD AL AM AT AX AZ BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GE GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM TR UA VA XK'.split(' '));
const cache=new Map();let nextRequest=0,cooldown=0;
export function parseBusStops(data,query,region='europe') {
 const tokens=normalize(query).split(' ').filter(t=>t.length>=2),output=[];
 for(const feature of data.features||[]) {
  const p=feature.properties||{},point=feature.geometry?.coordinates||[],country=String(p.countrycode||'').toUpperCase();
  if(feature.geometry?.type!=='Point'||point.length!==2||!point.every(Number.isFinite)||Math.abs(point[0])>180||Math.abs(point[1])>90||!(region==='mexico'?country==='MX':countries.has(country)))continue;
  if(!((p.osm_key==='highway'&&p.osm_value==='bus_stop')||(p.osm_key==='amenity'&&p.osm_value==='bus_station'))||!p.name||!['N','W','R'].includes(p.osm_type)||!Number.isSafeInteger(p.osm_id)||p.osm_id<=0)continue;
  const aliases=[p.city,p.county,p.district,p.locality,p.street,p.state,p.country,p.postcode].filter(Boolean).join(' '),key=normalize(p.name),search=normalize(p.name+' '+aliases);
  // Address context can be translated (Praha/Prag); retain an actual stop-name
  // match while dropping geocoder fuzzy hits such as Rohdental → Rosental.
  if(!tokens.some(t=>key.includes(t))&&!tokens.every(t=>search.includes(t)))continue;
  const id='osm:'+({N:'node',W:'way',R:'relation'}[p.osm_type])+'/'+p.osm_id;
  if(output.some(s=>s.id===id))continue;
  output.push({id,name:p.name,country,lat:point[1],lon:point[0],dbId:'',main:false,networkMode:'bus',aliases,locality:p.city||p.county||p.district||'',lookupSource:'OpenStreetMap / Photon',timetableStatus:'unverified'});
 }
 return output.slice(0,8);
}
export async function findBusStops(query,signal,region='europe',near) {
 signal?.throwIfAborted();
 if(normalize(query).length<2)return [];
 const key=region+':'+normalize(query)+':'+(near?.join(',')||''),saved=cache.get(key),now=Date.now();
 if(saved&&saved.until>now)return saved.stations;
 if(now<cooldown)throw Error('Die ergänzende Haltestellensuche pausiert kurz. Bitte gleich erneut suchen.');
 const wait=Math.max(0,nextRequest-now);
 if(wait>2500)throw Error('Die ergänzende Haltestellensuche ist gerade ausgelastet. Bitte gleich erneut suchen.');
 // One small user query per second per process, no bulk import or retry loop.
 nextRequest=Math.max(now,nextRequest)+1000;
 if(wait)await new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(signal.reason);},timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},wait);signal?.addEventListener('abort',abort,{once:true});});
 signal?.throwIfAborted();
 if(Date.now()<cooldown)throw Error('Die ergänzende Haltestellensuche pausiert kurz. Bitte gleich erneut suchen.');
 const url=new URL('https://photon.komoot.io/api/');
 const [s,w,n,e]=REGIONS[region].bounds;
 url.search=new URLSearchParams({q:query,lang:'de',limit:'12',bbox:[w,s,e,n].join(',')});
 if(near){url.searchParams.set('lat',String(near[0]));url.searchParams.set('lon',String(near[1]));}
 url.searchParams.append('osm_tag','highway:bus_stop');url.searchParams.append('osm_tag','amenity:bus_station');
 try {
  const stations=parseBusStops(await fetchJSON(url,{headers:{'User-Agent':'RailAtlas-Europa/1.0 (+https://github.com/dunkelst/railatlas-europe)'}},signal,15000),query,region);signal?.throwIfAborted();
  if(cache.size>=300)cache.delete(cache.keys().next().value);
  cache.set(key,{stations,until:Date.now()+86400000});return stations;
 }catch(error){if(!signal?.aborted)cooldown=Date.now()+30000;throw error;}
}
