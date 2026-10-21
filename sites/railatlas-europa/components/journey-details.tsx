import {AlertTriangle,BusFront,Clock,Footprints,Ship,TrainFront,TramFront} from 'lucide-react';
import type {Journey,Leg,Notice} from '@/lib/types';

const time=(s:string)=>new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'}).format(new Date(s));
const dateTime=(s:string)=>new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s));
const day=(s:string)=>new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit'}).format(new Date(s));
const minutes=(a:string,b:string)=>Math.round((Date.parse(b)-Date.parse(a))/60000);
export function ModeIcon({mode}:{mode:string}){const Icon=mode==='walk'?Footprints:mode==='bus'||mode==='replacement-bus'?BusFront:mode==='ferry'?Ship:mode==='tram'?TramFront:TrainFront;return <Icon size={13} aria-hidden="true"/>;}
function NoticeCard({notice:n}:{notice:Notice}){return <article className={'notice-card '+n.kind}>
 <div className="notice-title"><AlertTriangle size={14}/><b>{n.kind==='closure'?'Sperrhinweis':n.kind==='cancellation'?'Ausfallhinweis':n.kind==='delay'?'Verspätung':n.title}</b></div>
 <small>{n.scope}</small>{n.title&&n.title!=='Betriebshinweis'&&n.title!==n.text&&<strong>{n.title}</strong>}
 {n.text&&<p>{n.text}</p>}
 <div className="notice-validity">{n.validFrom||n.validUntil?<>Gültig {n.validFrom?'ab '+dateTime(n.validFrom):''}{n.validUntil?' bis '+dateTime(n.validUntil):''}</>:n.periods.length?'Zeitfenster laut Quelle':'Gültigkeitszeitraum von der Quelle nicht angegeben'}</div>
 {n.periods.map((p,i)=><div className="notice-validity" key={i}>{p.from?dateTime(p.from):'Offener Beginn'} → {p.until?dateTime(p.until):'Offenes Ende'}</div>)}
 <small>Quelle: {n.source}</small>
 </article>;}
export function JourneyAlerts({parts,notices=[]}:{parts:Journey[];notices?:Notice[]}){
 const warnings=[...new Map([...notices,...parts.flatMap(p=>p.notices||[])].filter(n=>n.severity==='warning').map(n=>[n.id,n])).values()];
 const endpointFeed=parts.length>0&&parts.every(p=>p.disruptionCheck==='trip-and-station-alerts');
 return <div className="journey-alerts" aria-label="Störungen und Datenabdeckung">
  <div className="coverage-note"><AlertTriangle size={15}/><div><b>{warnings.length?`${warnings.length} Betriebs- oder Sperrhinweis${warnings.length===1?'':'e'}`:'Störungslage nicht vollständig bestätigt'}</b><p>ÖBB / Scotty berücksichtigt die dort erfassten Fahrplanänderungen. {endpointFeed?'Reise- und Start-/Zielmeldungen wurden für die Reisezeit geprüft. ':''}Ausfälle und nicht erreichbare Verbindungen werden ausgeschlossen. Weitere, auch kurzfristige Sperrungen können fehlen.</p></div></div>
  {warnings.map(n=><NoticeCard key={n.id} notice={n}/>)}
 </div>;
}
function ChangedTime({actual,planned}:{actual:string;planned?:string|null}){if(!planned||actual===planned)return null;const delay=minutes(planned,actual);return <small className="changed-time">Plan {time(planned)} · {delay>0?'+':''}{delay} Min.</small>;}
export function JourneyLeg({leg:l,previous}:{leg:Leg;previous?:Leg}){
 const wait=previous?minutes(previous.arrival,l.departure):0;
 const unspecifiedWalk=l.walking&&l.departure===l.arrival;
 return <>
 {previous&&!l.walking&&wait>0&&<div className="transfer-wait"><Clock size={12}/>{wait} Min. {previous.walking?'bis zur Weiterfahrt':'Umsteigezeit'}</div>}
 <div className={'leg '+(l.walking?'walking':'')}>
  <div className="leg-times"><b>{time(l.departure)}</b><span className="leg-track"/><b>{time(l.arrival)}</b></div>
  <div className="leg-content">
   <b>{l.from.name}</b><ChangedTime actual={l.departure} planned={l.plannedDeparture}/>
   <div className="leg-service"><span className={'train-label mode-'+l.mode}><ModeIcon mode={l.mode}/>{unspecifiedWalk?l.line:l.modeLabel+' · '+l.line}</span><span>{unspecifiedWalk?'Gehzeit nicht separat geliefert':minutes(l.departure,l.arrival)+' Min.'}</span></div>
   {l.direction&&<small className="service-detail">Richtung {l.direction}</small>}
   {l.operator&&<small className="service-detail">{l.operator}</small>}
   {l.platform&&<small className="service-detail">Abfahrt {l.walking?'an':'ab'} {['bus','replacement-bus','tram'].includes(l.mode)?'Steig':'Gleis'} {l.platform}{l.plannedPlatform&&l.plannedPlatform!==l.platform&&<em> · geändert, geplant {l.plannedPlatform}</em>}</small>}
   {!l.walking&&<small className="service-detail realtime-status">{l.realtime?'Prognose laut Fahrplandienst':'Abfahrt/Ankunft laut Sollfahrplan · keine Prognose geliefert'}</small>}
   <b className="leg-destination">{l.to.name}</b><ChangedTime actual={l.arrival} planned={l.plannedArrival}/>
   {l.arrivalPlatform&&<small className="service-detail">Ankunft {['bus','replacement-bus','tram'].includes(l.mode)?'Steig':'Gleis'} {l.arrivalPlatform}{l.plannedArrivalPlatform&&l.plannedArrivalPlatform!==l.arrivalPlatform&&<em> · geändert, geplant {l.plannedArrivalPlatform}</em>}</small>}
   {day(l.departure)!==day(l.arrival)&&<small className="arrival-day">Ankunft am {day(l.arrival)}</small>}
   {l.notices?.some(n=>n.severity==='warning')&&<div className="leg-warning"><AlertTriangle size={12}/>Betriebshinweise zu dieser Fahrt oben beachten.</div>}
   {!l.walking&&l.geometry.status!=='complete'&&<small className="geometry-note">{l.geometry.status==='partial'?'Streckenverlauf nur teilweise geliefert. Kartenlücken bleiben offen.':'Für diese Fahrt wurde kein Streckenverlauf geliefert. Keine Linie auf der Karte.'}</small>}
   {l.stopovers?.length>0&&<details className="stop-list"><summary>{l.stopovers.length} Fahrplanhalte anzeigen</summary><ol>{l.stopovers.map((s,i)=><li key={i} className={s.cancelled?'cancelled-stop':''}><span>{s.arrival?time(s.arrival):'–'}{s.departure&&s.departure!==s.arrival?' / '+time(s.departure):''}</span><div><b>{s.station.name}</b>{s.platform&&<small>{['bus','replacement-bus','tram'].includes(l.mode)?'Steig':'Gleis'} {s.platform}</small>}{s.cancelled&&<small>Halt entfällt</small>}{s.notices.map(n=><small key={n.id}>{n.text||n.title}</small>)}</div></li>)}</ol></details>}
   {l.notes.length>0&&<details className="leg-notes"><summary>Weitere Fahrplanhinweise</summary>{l.notes.map((n,k)=><p key={k}>{n}</p>)}</details>}
  </div>
 </div>
 </>;
}
