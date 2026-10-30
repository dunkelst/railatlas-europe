"use client";
import {useLocale} from '@/components/locale';
import {AlertTriangle,BusFront,Clock,Footprints,MapPin,Plane,Ship,TrainFront,TramFront} from 'lucide-react';
import type {Journey,Leg,Notice} from '@/lib/types';

const time=(s:string,timeZone='Europe/Berlin',locale='de-DE')=>new Intl.DateTimeFormat(locale,{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));
const dateTime=(s:string,timeZone='Europe/Berlin',locale='de-DE')=>new Intl.DateTimeFormat(locale,{timeZone,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));
const day=(s:string,timeZone='Europe/Berlin',locale='de-DE')=>new Intl.DateTimeFormat(locale,{timeZone,day:'2-digit',month:'2-digit'}).format(new Date(s));
const minutes=(a:string,b:string)=>Math.round((Date.parse(b)-Date.parse(a))/60000);
export function ModeIcon({mode}:{mode:string}){const Icon=mode==='location'?MapPin:mode==='airport'?Plane:mode==='walk'?Footprints:mode==='bus'||mode==='colectivo'||mode==='replacement-bus'?BusFront:mode==='ferry'?Ship:mode==='tram'?TramFront:TrainFront;return <Icon size={13} aria-hidden="true"/>;}
function NoticeCard({notice:n,timeZone}:{notice:Notice;timeZone:string}){
 const {t,locale,language}=useLocale();return <article className={'notice-card '+n.kind}>
 <div className="notice-title"><AlertTriangle size={14}/><b>{n.kind==='closure'?t('Sperrhinweis'):n.kind==='cancellation'?t('Ausfallhinweis'):n.kind==='delay'?t('Verspätung'):t(n.title)}</b></div>
 <small>{t(n.scope)}</small>{n.title&&n.title!=='Betriebshinweis'&&n.title!==n.text&&<strong>{n.title}</strong>}
 {n.text&&<>{language!=='de'&&<small>{t('Anbietermeldungen im Original')}</small>}<p>{n.text}</p></>}
 <div className="notice-validity">{n.validFrom||n.validUntil?<>{t("Gültig ")}{n.validFrom?t('ab ')+dateTime(n.validFrom,timeZone,locale):''}{n.validUntil?t(' bis ')+dateTime(n.validUntil,timeZone,locale):''}</>:n.periods.length?t('Zeitfenster laut Quelle'):t('Gültigkeitszeitraum von der Quelle nicht angegeben')}</div>
 {n.periods.map((p,i)=><div className="notice-validity" key={i}>{p.from?dateTime(p.from,timeZone,locale):t('Offener Beginn')} → {p.until?dateTime(p.until,timeZone,locale):t('Offenes Ende')}</div>)}
 <small>{t("Quelle: ")}{n.source}</small>
 </article>;}
export function JourneyAlerts({parts,notices=[],timeZone='Europe/Berlin'}:{parts:Journey[];notices?:Notice[];timeZone?:string}){
 const {t,locale,language}=useLocale();
 const warnings=[...new Map([...notices,...parts.flatMap(p=>p.notices||[])].filter(n=>n.severity==='warning').map(n=>[n.id,n])).values()];
 const noDisruptionFeed=parts.some(p=>p.disruptionCheck==='unavailable');
 const endpointFeed=parts.length>0&&parts.every(p=>p.disruptionCheck==='trip-and-station-alerts');
 const sources=[...new Set(parts.map(p=>p.source))].join(' · ')||'Die gewählte Auskunft';
 const attributions=[...new Map(parts.flatMap(p=>p.attributions||[]).map(a=>[a.url,a])).values()];
 return <div className="journey-alerts" aria-label={t("Störungen und Datenabdeckung")}>
  <div className="coverage-note"><AlertTriangle size={15}/><div><b>{warnings.length?t('Betriebs- oder Sperrhinweise: {0}',[warnings.length]):t('Störungslage nicht vollständig bestätigt')}</b><p>{noDisruptionFeed?t("Für mindestens eine Auskunft sind keine aktuellen Betriebs- oder Sperrmeldungen angebunden. Fahrplanangaben bestätigen keine störungsfreie Fahrt."):<>{t(sources)}{t(": Gelieferte Betriebs- und Sperrhinweise werden für die Reisezeit geprüft. ")}{endpointFeed?t('Zusätzliche Start-/Zielmeldungen wurden abgefragt. '):''}{t("Ausfälle und nicht erreichbare Verbindungen werden ausgeschlossen. Weitere, auch kurzfristige Sperrungen können fehlen.")}</>}</p>{[...new Set(parts.map(p=>p.sourceWarning).filter(Boolean))].map(w=><p key={w}>{t(w||'')}</p>)}</div></div>
  {attributions.length>0&&<p className="journey-attributions">{attributions.map(a=><a key={a.url} href={a.url} target="_blank" rel="noreferrer">{t(a.label)}</a>)}</p>}
  {warnings.map(n=><NoticeCard key={n.id} notice={n} timeZone={timeZone}/>)}
 </div>;
}
function ChangedTime({actual,planned,timeZone}:{actual:string;planned?:string|null;timeZone:string}){
 const {t,locale,language}=useLocale();if(!planned||actual===planned)return null;const delay=minutes(planned,actual);return <small className="changed-time">{t("Plan ")}{time(planned,timeZone,locale)} · {delay>0?'+':''}{delay} {t(" Min.")}</small>;}
export function JourneyLeg({leg:l,previous,timeZone='Europe/Berlin'}:{leg:Leg;previous?:Leg;timeZone?:string}){
 const {t,locale,language}=useLocale();
 const wait=previous?minutes(previous.arrival,l.departure):0;
 const unspecifiedWalk=l.walking&&l.departure===l.arrival;
 return <>
 {l.throughService&&<div className="transfer-wait"><BusFront size={12}/>{t("Im Fahrzeug bleiben · Linienwechsel ohne Umstieg")}</div>}
 {previous&&!l.walking&&!l.throughService&&wait>0&&<div className="transfer-wait"><Clock size={12}/>{wait} {t(" Min. ")}{previous.walking?t('bis zur Weiterfahrt'):t('Umsteigezeit')}</div>}
 <div className={'leg '+(l.walking?'walking':'')+(l.walkingFallback?' walking-fallback':'')}>
  <div className="leg-times"><b>{time(l.departure,timeZone,locale)}</b><span className="leg-track"/><b>{time(l.arrival,timeZone,locale)}</b></div>
  <div className="leg-content">
   <b>{l.from.name}</b><ChangedTime actual={l.departure} planned={l.plannedDeparture} timeZone={timeZone}/>
   <div className="leg-service"><span className={'train-label mode-'+l.mode}><ModeIcon mode={l.mode}/>{unspecifiedWalk?t(l.line):t(l.modeLabel)+' · '+l.line}</span><span>{unspecifiedWalk?t('Gehzeit nicht separat geliefert'):minutes(l.departure,l.arrival)+t(' Min.')}</span></div>
   {l.walkingFallback&&<small className="fallback-label"><Footprints size={12}/>{t("Fußweg-Notlösung")}{Number.isFinite(l.distanceMeters)?t(' · etwa ')+((l.distanceMeters as number)/1000).toLocaleString(locale,{maximumFractionDigits:2})+' km':''} {t(" · Verlauf laut Auskunft")}</small>}
   {l.direction&&<small className="service-detail">{t("Richtung ")}{l.direction}</small>}
   {l.operator&&<small className="service-detail">{l.operator}</small>}
   {l.platform&&<small className="service-detail">{t("Abfahrt ")}{l.walking?t('an'):t('ab')} {['bus','replacement-bus','tram'].includes(l.mode)?t('Steig'):t('Gleis')} {l.platform}{l.plannedPlatform&&l.plannedPlatform!==l.platform&&<em> {t(" · geändert, geplant ")}{l.plannedPlatform}</em>}</small>}
   {!l.walking&&<small className="service-detail realtime-status">{l.realtime?t('Prognose laut Fahrplandienst'):t('Abfahrt/Ankunft laut Sollfahrplan · keine Prognose geliefert')}</small>}
   <b className="leg-destination">{l.to.name}</b><ChangedTime actual={l.arrival} planned={l.plannedArrival} timeZone={timeZone}/>
   {l.arrivalPlatform&&<small className="service-detail">{t("Ankunft ")}{['bus','replacement-bus','tram'].includes(l.mode)?t('Steig'):t('Gleis')} {l.arrivalPlatform}{l.plannedArrivalPlatform&&l.plannedArrivalPlatform!==l.arrivalPlatform&&<em> {t(" · geändert, geplant ")}{l.plannedArrivalPlatform}</em>}</small>}
   {day(l.departure,timeZone,locale)!==day(l.arrival,timeZone,locale)&&<small className="arrival-day">{t("Ankunft am ")}{day(l.arrival,timeZone,locale)}</small>}
   {l.notices?.some(n=>n.severity==='warning')&&<div className="leg-warning"><AlertTriangle size={12}/>{t("Betriebshinweise zu dieser Fahrt oben beachten.")}</div>}
   {!l.walking&&(l.geometry.status!=='complete'||l.geometry.reason==='unverified')&&<small className="geometry-note">{l.geometry.reason==='unverified'&&l.geometry.segments.length?t('Verlauf laut Fahrplanauskunft, farbig gestrichelt. Kann berechnet sein; Original-GTFS-Pfad nicht bestätigt.'):l.geometry.status==='partial'?t('Streckenverlauf nur teilweise geliefert. Kartenlücken bleiben offen.'):t('Für diese Fahrt wurde kein nutzbarer Streckenverlauf geliefert. Die Kartenlücke bleibt offen.')}</small>}
   {l.walking&&l.geometry.reason==='station-access'&&<small className="geometry-note">{t("Stationszugang: ")}{l.geometry.gapMeters} {t(" m zwischen Haltestellenpunkt und geliefertem Wegverlauf. Gehzeit und Anschluss laut Auskunft; die Kartenlücke bleibt offen.")}</small>}
   {l.stopovers?.length>0&&<details className="stop-list"><summary>{l.stopovers.length} {t(" Fahrplanhalte anzeigen")}</summary><ol>{l.stopovers.map((s,i)=><li key={i} className={s.cancelled?'cancelled-stop':''}><span title={s.scheduledTime?t('Haltezeit laut Quelle; Ankunft und Abfahrt nicht getrennt geliefert.'):undefined}>{s.arrival?time(s.arrival,timeZone,locale):s.scheduledTime?time(s.scheduledTime,timeZone,locale):'–'}{s.departure&&s.departure!==s.arrival?' / '+time(s.departure,timeZone,locale):''}</span><div><b>{s.station.name}</b>{s.platform&&<small>{['bus','replacement-bus','tram'].includes(l.mode)?t('Steig'):t('Gleis')} {s.platform}</small>}{s.cancelled&&<small>{t("Halt entfällt")}</small>}{s.notices.map(n=><small key={n.id}>{n.text||n.title}</small>)}</div></li>)}</ol></details>}
   {l.notes.length>0&&<details className="leg-notes"><summary>{t("Weitere Fahrplanhinweise")}</summary>{l.notes.map((n,k)=><p key={k}>{n}</p>)}</details>}
  </div>
 </div>
 </>;
}
