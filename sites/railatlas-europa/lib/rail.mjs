export const normalize = (v) => String(v || '').toLowerCase().replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const aliases = {hn:'heilbronn',wue:'wurzburg',wu:'wurzburg',wü:'wurzburg',muenchen:'munchen',zuerich:'zurich',cologne:'koln',vienna:'wien',prague:'praha',warsaw:'warszawa',brussels:'bruxelles',brussel:'bruxelles',venice:'venezia',rome:'roma',lisbon:'lisboa',copenhagen:'kobenhavn'};
export function unpack(rows) { return rows.map(r=>({id:String(r[0]),name:r[1],country:r[2],lat:r[3],lon:r[4],dbId:r[5],main:r[6],aliases:r[7],search:normalize(r[1]+' '+r[7]),key:normalize(r[1])})); }
export function searchStations(stations,query,limit=10) {
 const n=normalize(query);if(n.length<2)return [];
 const q=aliases[n]||n,tokens=q.split(' '),matches=[];
 for(const s of stations){
  if(!tokens.every(t=>t.length===1?s.search.split(' ').includes(t):s.search.includes(t)))continue;
  let score=(s.key===q?1000:0)+(s.key.startsWith(q+' ')?500:s.key.startsWith(q)?350:0)+(s.key.split(' ').includes(q)?150:0)+(s.main?100:0)+(s.dbId?15:0)-s.name.length/100;
  matches.push({s,score});
 }
 return matches.sort((a,b)=>b.score-a.score||a.s.name.localeCompare(b.s.name)).slice(0,limit).map(m=>m.s);
}
export function distanceKm(a,b){const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlon=(b.lon-a.lon)*r;return 6371*2*Math.atan2(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlon/2)**2),Math.sqrt(1-(Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlon/2)**2)));}
export function walkingMinutes(journey){const legs=journey.legs.filter(l=>l.walking);if(legs.some(l=>Date.parse(l.arrival)<Date.parse(l.departure)||l.arrival===l.departure&&!(Number.isFinite(l.distanceMeters)&&l.distanceMeters<=10)))return null;return Math.round(legs.reduce((n,l)=>n+Date.parse(l.arrival)-Date.parse(l.departure),0)/60000);}
export function nearestStations(stations,lat,lon,limit=5){if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat< -90||lat>90||lon< -180||lon>180)throw new Error('Ungültige Standortkoordinaten.');return stations.map(s=>({...s,distance:distanceKm({lat,lon},s)})).sort((a,b)=>a.distance-b.distance).slice(0,limit);}
export function validateChain(parts,stops,dwell){
 if(parts.length!==stops.length-1)throw new Error('Eine Teilstrecke fehlt.');
 for(let i=0;i<parts.length;i++){
  const p=parts[i];if(!p.legs?.length||!Number.isFinite(Date.parse(p.departure))||!Number.isFinite(Date.parse(p.arrival))||Date.parse(p.arrival)<Date.parse(p.departure))throw new Error('Die Fahrplandaten sind unvollständig.');
  if(i&&Date.parse(p.departure)<Date.parse(parts[i-1].arrival)+dwell[i-1]*60000)throw new Error('Der Anschluss am Zwischenziel ist nicht erreichbar.');
  for(let j=0;j<p.legs.length;j++){const l=p.legs[j];if(l.cancelled)throw new Error('Diese Verbindung enthält einen Zugausfall.');if(Date.parse(l.arrival)<Date.parse(l.departure)||j&&Date.parse(l.departure)<Date.parse(p.legs[j-1].arrival))throw new Error('Die Fahrplandaten enthalten einen Zeitkonflikt.');}
 }
 return true;
}
const berlinFormatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
export function berlinInput(date){return berlinFormatter.format(new Date(date)).replace(' ','T');}
// Calendar midnights also work on DST weekends, unlike 24-hour jumps.
export function berlinSearchDays(departure){const initial=berlinInput(departure),[y,m,d]=initial.slice(0,10).split('-').map(Number);return [initial,...[1,2].map(day=>new Date(Date.UTC(y,m-1,d+day)).toISOString().slice(0,10)+'T00:00:00')];}
export function remainingJourneyPoints(points,partIndex,station,same){
 if(!Number.isInteger(partIndex)||partIndex<0||partIndex>=points.length-1)throw Error('Der gewählte Reiseabschnitt fehlt.');
 const remaining=points.slice(partIndex+1);
 if(same(station,remaining[0].station))remaining.shift();
 if(!remaining.length)throw Error('Dieser Halt ist bereits dein Reiseziel.');
 return [{key:'start',text:station.name,station,dwell:0},...remaining.map((p,i)=>({...p,key:i===remaining.length-1?'end':'via-replan-'+i}))];
}
export function localBerlinISO(s){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s))throw new Error('Bitte Datum und Uhrzeit prüfen.');
 const p=s.slice(0,16),utc=Date.parse((s.length===16?s+':00':s)+'Z');let guess=utc;
 for(let i=0;i<3;i++){const actual=Date.parse(berlinInput(guess)+'Z');guess+=utc-actual;}
 if(berlinInput(guess).slice(0,16)!==p)throw new Error('Diese Uhrzeit gibt es bei der Zeitumstellung nicht.');
 return new Date(guess).toISOString();
}
export function dbLink(from,to,departure){const p=new URLSearchParams({so:from.name,zo:to.name,hd:berlinInput(departure).slice(0,16),hza:'D',kl:'2',r:'13:16:KLASSENLOS:1'});if(/^\d{7,9}$/.test(from.dbId||''))p.set('soei',from.dbId);if(/^\d{7,9}$/.test(to.dbId||''))p.set('zoei',to.dbId);return 'https://www.bahn.de/buchung/fahrplan/suche#'+p;}

export function rankJourneys(journeys,preference='arrival') {
  const walk=j=>walkingMinutes(j)??Infinity;
  const key=j=>j.legs.map(l=>[l.from.lat,l.from.lon,l.to.lat,l.to.lon,l.departure,l.arrival,l.line,l.mode].join(':')).join('|');
  const grouped=new Map();for(const journey of journeys){const id=key(journey),previous=grouped.get(id);if(!previous)grouped.set(id,journey);else previous.notices=[...new Map([...previous.notices,...(journey.notices||[])].map(n=>[n.id,n])).values()];}const unique=[...grouped.values()];
  return unique.sort((a,b)=>(preference==='transfers'?a.transfers-b.transfers:preference==='walking'?walk(a)-walk(b):0)||Date.parse(a.arrival)-Date.parse(b.arrival)||a.transfers-b.transfers||walk(a)-walk(b)||Date.parse(b.departure)-Date.parse(a.departure)).slice(0,6);
}
