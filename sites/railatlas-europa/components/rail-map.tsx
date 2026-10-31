"use client";
import {useLocale} from '@/components/locale';

import {useEffect,useMemo,useRef,useState} from 'react';
import type {Station,Journey} from '@/lib/types';
import {assetUrl,apiUrl,runtime} from '@/lib/urls.mjs';
import {NETWORK_MODES,NETWORK_MIN_ZOOM,MEXICO_NETWORK_MIN_ZOOM,defaultNetworkLayers,validateBounds,networkRequestBounds,networkCovers,networkInView,fetchNetwork} from '@/lib/network.mjs';
import {REGIONS} from '@/lib/regions.mjs';
declare global {interface Window {L:any}}
type LayerState=Record<string,{lines:boolean;stops:boolean}>;
type NetworkRoute={id:string;name:string;ref:string;mode?:string;from?:string;to?:string;via?:string;operator?:string;network?:string;source?:string;sourceUrl?:string;boardingAllowed?:boolean;alightingAllowed?:boolean};
type NetworkStop={id:string;name:string;lat:number;lon:number;lines:string[];servingRoutes?:NetworkRoute[];station?:Station;source?:string;sourceUrl?:string;sourceDate?:string;boardingKind?:string};
type NetworkData={layers:Record<string,{lines:(NetworkRoute&{calculated?:boolean;sourceDate?:string;segments:[number,number][][]})[];stops:NetworkStop[]}>;bounds:number[];modes:string[];detail?:string;source:string;warning?:string;warningScope?:string;attributions?:{label:string;url:string}[];fetchedAt:string};
let leaflet:Promise<any>|undefined;
function loadLeaflet(){if(window.L)return Promise.resolve(window.L);if(!leaflet)leaflet=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=assetUrl('vendor/leaflet.js');script.onload=()=>resolve(window.L);script.onerror=()=>{leaflet=undefined;reject(new Error('Die Karte konnte nicht geladen werden.'));};document.head.appendChild(script);});return leaflet;}
export default function RailMap({stations,parts,picking,onPick,onStopPick,region='europe',focus}:{stations:Station[];parts:Journey[];picking:string|null;onPick:(lat:number,lon:number)=>void;onStopPick:(station:Station,target?:'start'|'end'|'via')=>void;region?:string;focus?:{centre:number[];zoom:number}}){
 const {t,locale,language}=useLocale();
 const [selectedRoute,setSelectedRoute]=useState<NetworkRoute|null>(null);
 const container=useRef<HTMLDivElement>(null),controls=useRef<HTMLElement>(null),map=useRef<any>(null),journeyLayer=useRef<any>(null),railway=useRef<any>(null),networkGroups=useRef<Record<string,any>>({});
 const pickRef=useRef(onPick),stopRef=useRef(onStopPick),modeRef=useRef(picking);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[tileError,setTileError]=useState(false),[layerState,setLayerState]=useState<LayerState>(defaultNetworkLayers),[view,setView]=useState<{zoom:number;bounds:number[]}|null>(null),[network,setNetwork]=useState<NetworkData|null>(null),[status,setStatus]=useState(''),[networkError,setNetworkError]=useState(false),[loading,setLoading]=useState(false),[retry,setRetry]=useState(0);
 pickRef.current=onPick;stopRef.current=onStopPick;modeRef.current=picking;
 const networkRef=useRef<NetworkData|null>(null),loadedRetry=useRef(0);networkRef.current=network;
 const overview=region==='mexico'&&Boolean(view&&view.zoom<NETWORK_MIN_ZOOM);
 let requestKey='';if(view)try{requestKey=networkRequestBounds(view.bounds,overview).join(',');}catch{requestKey='outside';}
 const detailVisible=Boolean(view&&view.zoom>=(region==='mexico'?MEXICO_NETWORK_MIN_ZOOM:NETWORK_MIN_ZOOM));
 const visibleNetwork=useMemo<NetworkData|null>(()=>network&&view&&detailVisible?networkInView(network,view.bounds):null,[network,view,detailVisible]);
 const routeChoices=[...new Map([...(['bus','colectivo'].flatMap(mode=>(visibleNetwork?.layers[mode].lines||[]).map(r=>({...r,mode})))),...(selectedRoute?[selectedRoute]:[])].map(r=>[r.id,r])).values()].sort((a,b)=>a.ref.localeCompare(b.ref,undefined,{numeric:true})||(a.to||a.name).localeCompare(b.to||b.name));
 const requestDetail=overview?'overview':NETWORK_MODES.some(m=>m.id!=='rail'&&layerState[m.id].lines)?'all':'stops';
 useEffect(()=>{let active=true;loadLeaflet().then(L=>{if(!active||!container.current)return;
  const m=L.map(container.current,{zoomControl:false,scrollWheelZoom:true,preferCanvas:true,zoomAnimation:false}).setView((region==='mexico'?REGIONS.mexico:REGIONS.europe).centre,(region==='mexico'?REGIONS.mexico:REGIONS.europe).zoom);map.current=m;
  L.control.zoom({position:'bottomright'}).addTo(m);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);
  railway.current=L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenRailwayMap'}).on('tileerror',()=>{if(active)setTileError(true);});
  for(const mode of NETWORK_MODES)networkGroups.current[mode.id]=L.layerGroup().addTo(m);
  journeyLayer.current=L.layerGroup().addTo(m);
  if(controls.current){L.DomEvent.disableClickPropagation(controls.current);L.DomEvent.disableScrollPropagation(controls.current);}
  m.on('click',(e:any)=>{if(modeRef.current)pickRef.current(e.latlng.lat,e.latlng.lng);});
  const updateView=()=>{if(!container.current?.clientWidth||!container.current.clientHeight){setView(null);setError('Die Kartendarstellung konnte nicht vollständig geladen werden. Bitte die Seite erneut öffnen.');return;}setError('');const b=m.getBounds();setView({zoom:m.getZoom(),bounds:[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()].map((n:number)=>Number(n.toFixed(5)))});};
  m.on('moveend',updateView);updateView();
  const resize=new ResizeObserver(()=>m.invalidateSize());resize.observe(container.current);m._railResize=resize;setReady(true);
 }).catch(e=>{if(active)setError(e.message);});return()=>{active=false;if(map.current){map.current._railResize?.disconnect();map.current.remove();map.current=null;journeyLayer.current=null;networkGroups.current={};}};},[]);
 useEffect(()=>{if(!ready||!map.current||!journeyLayer.current)return;const L=window.L,group=journeyLayer.current;group.clearLayers();
  const coords:number[][]=[];
  parts.forEach((p,pi)=>p.legs.forEach(l=>{for(const points of l.geometry?.segments||[])if(points.length>1){L.polyline(points,{color:l.walking?(l.walkingFallback?'#c33e38':'#65706b'):l.mode==='bus'||l.mode==='replacement-bus'?'#a25624':pi%2?'#245ddb':'#206449',weight:l.walking?3:5,opacity:.95,...(l.walking?{dashArray:'3 6'}:l.geometry.reason==='unverified'?{dashArray:'8 5'}:{})}).addTo(group);coords.push(...points);}}));
  stations.forEach((s,i)=>{if(!Number.isFinite(s.lat)||!Number.isFinite(s.lon))return;const pos=[s.lat,s.lon];coords.push(pos);const node=document.createElement('div');node.className='map-popup';node.textContent=s.name+(s.country?' · '+s.country:'');
   L.marker(pos,{icon:L.divIcon({className:'station-pin '+(i===0?'pin-start':i===stations.length-1?'pin-end':'pin-via'),html:'<span>'+String(i+1)+'</span>',iconSize:[30,30],iconAnchor:[15,15]})}).bindPopup(node).addTo(group);
  });
  if(coords.length>1)map.current.fitBounds(L.latLngBounds(coords),{padding:[60,60],maxZoom:13});else if(coords.length)map.current.setView(coords[0],13);
 },[stations,parts,ready]);
 useEffect(()=>{if(ready&&focus&&map.current)map.current.setView(focus.centre,focus.zoom);},[ready,focus]);
 useEffect(()=>{setSelectedRoute(null);setLayerState(old=>({...old,...(region==='mexico'?{bus:{lines:true,stops:true},subway:{lines:true,stops:true}}:{}),colectivo:{lines:region==='mexico',stops:region==='mexico'}}));},[region]);
 useEffect(()=>{if(!ready||!map.current||!railway.current)return;if(layerState.rail.lines)railway.current.addTo(map.current);else map.current.removeLayer(railway.current);},[layerState.rail.lines,ready]);
 const modes=NETWORK_MODES.filter(m=>layerState[m.id].stops||(m.id!=='rail'&&layerState[m.id].lines)).map(m=>m.id).join(',');
 useEffect(()=>{
  if(!ready||!view)return;let active=true;const controller=new AbortController();setNetworkError(false);setLoading(false);
  if(!modes){setNetwork(null);setStatus('Detailnetze sind ausgeblendet.');return;}
  if(!detailVisible){setNetwork(null);setStatus(region==='mexico'?'Für mexikanische Linien und Halte näher heranzoomen (ab Zoom 9).':'Für Linien und Halte näher heranzoomen (ab Zoom 12).');return;}
  let bounds:number[];try{bounds=validateBounds(requestKey.split(',').map(Number),overview);}catch{setStatus('Für die Detailnetze bitte näher heranzoomen.');return;}
  const forced=loadedRetry.current!==retry;loadedRetry.current=retry;
  if(!forced&&networkCovers(networkRef.current,bounds,modes.split(','))&&networkRef.current&&(networkRef.current.detail===requestDetail||requestDetail==='stops'&&networkRef.current.detail==='all')&&Date.now()-Date.parse(networkRef.current.fetchedAt)<300000){setStatus(networkRef.current.warning?'Netzdaten teilweise geladen.':'Netzdaten geladen.');return;}
  const timer=setTimeout(async()=>{setLoading(true);setStatus('Linien und Halte für diesen Ausschnitt laden …');try{
   let data;
   const config=runtime();
   if(config.requiresApiOrigin&&!config.apiOrigin)data=await fetchNetwork(bounds,modes.split(','),controller.signal,requestDetail,forced,region);
   else{const response=await fetch(apiUrl('/api/network?'+new URLSearchParams({bbox:bounds.join(','),modes,region,detail:requestDetail,...(forced?{refresh:'1'}:{})})),{signal:controller.signal});const body=await response.json() as NetworkData&{error?:string};if(!response.ok)throw Error(body.error||'Netzebenen nicht erreichbar.');data=body;}
   if(!active)return;setNetwork(data);const count=modes.split(',').reduce((n,m)=>n+data.layers[m].lines.length+data.layers[m].stops.length,0);setNetworkError(false);setStatus(count?(data.warning?'Netzdaten teilweise geladen.':'Netzdaten geladen.'):'Für diesen Ausschnitt wurden keine passenden Netzdaten geliefert.');
  }catch(e){if(active&&!controller.signal.aborted){setNetworkError(true);setStatus(((e as Error).message||'Die Netzebenen sind gerade nicht erreichbar.')+(networkRef.current?' Bereits geladene Netzdaten bleiben sichtbar.':''));}}finally{if(active)setLoading(false);}},1000);
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[ready,requestKey,detailVisible,modes,requestDetail,retry,region]);
 useEffect(()=>{
  if(!ready||!map.current)return;const L=window.L;
  for(const mode of NETWORK_MODES){const group=networkGroups.current[mode.id];group?.clearLayers();const data=visibleNetwork?.layers[mode.id],enabled=layerState[mode.id];if(!data||!group)continue;
   if(enabled.lines&&mode.id!=='rail')for(const line of data.lines){if(selectedRoute?.mode===mode.id&&selectedRoute.id!==line.id)continue;const node=document.createElement('div');node.className='map-popup';const heading=document.createElement('b');heading.textContent=(line.ref?line.ref+' · ':'')+line.name;node.appendChild(heading);for(const value of [line.from&&line.to?line.from+' → '+line.to:line.to?t('Richtung {0}',[line.to]):'',line.via?t('Über {0}',[line.via]):'',line.operator||'',line.source||network?.source||'',line.sourceDate?t('Quellenstand ')+line.sourceDate:''])if(value){const row=document.createElement('small');row.textContent=value;node.appendChild(row);}if(['bus','colectivo'].includes(mode.id)){const button=document.createElement('button');button.type='button';button.textContent=t('Diese Richtung hervorheben');button.onclick=()=>{setSelectedRoute({...line,mode:mode.id});map.current?.closePopup();};node.appendChild(button);}for(const segment of line.segments)L.polyline(segment,{color:mode.color,weight:mode.id==='colectivo'&&selectedRoute?.id===line.id?6:mode.id==='bus'?3:4,opacity:mode.id==='colectivo'&&selectedRoute?(selectedRoute.id===line.id?1:.1):.8,bubblingMouseEvents:false,...(line.calculated?{dashArray:'8 5'}:{})}).bindPopup(node).addTo(group);}
   if(enabled.stops)for(const stop of data.stops){if(selectedRoute?.mode===mode.id&&!stop.servingRoutes?.some(r=>r.id===selectedRoute.id))continue;const node=document.createElement('div');node.className='map-popup network-popup';const heading=document.createElement('b');heading.textContent=stop.name;node.appendChild(heading);const text=document.createElement('small');text.textContent=t(mode.label)+(stop.lines.length&&!stop.servingRoutes?.length?' · '+stop.lines.join(', '):'')+' · '+(stop.source||network?.source||t('Kartendaten'));node.appendChild(text);
    if(['bus','colectivo'].includes(mode.id)&&stop.servingRoutes?.length){const list=document.createElement('div');list.className='route-directions';for(const route of [...stop.servingRoutes].sort((a,b)=>a.ref.localeCompare(b.ref,undefined,{numeric:true})||(a.to||'').localeCompare(b.to||''))){const button=document.createElement('button');button.type='button';button.className='route-direction';button.textContent=(route.ref||route.name)+(route.to?' · '+t('Richtung {0}',[route.to]):'')+(route.boardingAllowed===false?' · '+t('Nur Ausstieg'):'');button.title=[route.from&&route.to?route.from+' → '+route.to:'',route.operator||''].filter(Boolean).join(' · ');button.onclick=()=>{setSelectedRoute({...route,mode:mode.id});setLayerState(old=>({...old,[mode.id]:{lines:true,stops:true}}));map.current?.closePopup();};list.appendChild(button);}node.appendChild(list);}
    if(mode.id==='colectivo'){const note=document.createElement('small');note.textContent=stop.boardingKind==='informal'?t('Informeller Einstieg laut Kartendaten · Bedienung vor Ort prüfen'):t('Kartierter Colectivo-Einstieg · Beschilderung und aktuelle Bedienung vor Ort prüfen');node.appendChild(note);}
    if(stop.sourceDate){const note=document.createElement('small');note.textContent=t('Quellenstand ')+stop.sourceDate;node.appendChild(note);}
    if(stop.sourceUrl&&stop.sourceUrl.startsWith('https://')){const link=document.createElement('a');link.href=stop.sourceUrl;link.textContent=t('Datenquelle öffnen');link.target='_blank';link.rel='noreferrer';node.appendChild(link);}
    const station:Station=stop.station?{...stop.station,networkMode:mode.id}:{id:'osm:'+stop.id,dbId:'',name:stop.name,lat:stop.lat,lon:stop.lon,country:'',main:false,networkMode:mode.id};
    for(const [target,label] of [['start','Als Start'],['end','Als Ziel'],['via','Als Zwischenziel']] as const){const button=document.createElement('button');button.type='button';button.textContent=t(label);button.onclick=()=>{map.current?.closePopup();stopRef.current(station,target);};node.appendChild(button);}
    const tooltip=document.createElement('span');tooltip.textContent=stop.name;
    const marker=L.circleMarker([stop.lat,stop.lon],{radius:mode.id==='rail'||mode.id==='colectivo'?5:4,color:mode.color,fillColor:mode.id==='colectivo'?'#efdfff':'#ffffff',fillOpacity:1,weight:2,bubblingMouseEvents:false,...(stop.boardingKind==='informal'?{dashArray:'2 3'}:{})}).bindPopup(node).bindTooltip(tooltip,{direction:'top'}).addTo(group);
    marker.on('click',()=>{if(modeRef.current){map.current?.closePopup();stopRef.current(station);}});
   }
  }
 },[ready,visibleNetwork,layerState,region,language,selectedRoute]);
 useEffect(()=>{if(!ready)return;for(const [selector,label] of [['.leaflet-control-zoom-in','Vergrößern'],['.leaflet-control-zoom-out','Verkleinern']]){const button=container.current?.querySelector<HTMLElement>(selector);if(button){button.title=t(label);button.setAttribute('aria-label',t(label));}}},[ready,language]);
 const toggle=(mode:string,field:'lines'|'stops',value:boolean)=>setLayerState(old=>({...old,[mode]:{...old[mode],[field]:value}}));
 const shownLines=(mode:string)=>visibleNetwork?.layers[mode].lines.filter(r=>selectedRoute?.mode!==mode||selectedRoute.id===r.id)||[];
 const shownStops=(mode:string)=>visibleNetwork?.layers[mode].stops.filter(stop=>selectedRoute?.mode!==mode||stop.servingRoutes?.some(r=>r.id===selectedRoute.id))||[];
 const visibleObjects=visibleNetwork?NETWORK_MODES.reduce((n,m)=>n+(layerState[m.id].stops?shownStops(m.id).length:0)+(layerState[m.id].lines&&m.id!=='rail'?shownLines(m.id).length:0),0):0;
 const visibleStatus=visibleNetwork&&!loading&&!networkError&&!visibleObjects?'Für den sichtbaren Ausschnitt fehlen passende Netzdaten. Das bestätigt keine fehlende Bedienung.':status;
 return <section className={'map-stage '+(picking?'picking':'')} aria-label={t("Bahn- und Nahverkehrskarte")}>
  <div ref={container} className="map-canvas"/>
  {error&&<div role="alert" className="map-message">{t(error)} {t(" Die Reiseplanung steht weiterhin zur Verfügung.")}</div>}
  <div className="map-tag"><span className="live-dot"/>{t(region==='mexico'?'MEXIKO · BAHN & ÖPNV-NETZE':'EUROPA · BAHN & ÖPNV-NETZE')}</div>
  <aside ref={controls} className="map-options network-controls" aria-label={t("Netzebenen")}><details open>
   <summary>{t("Netzebenen ")}<span>{t("Linien & Halte")}</span></summary>
   <div className="network-grid"><span>{t("VERKEHRSMITTEL")}</span><span>{t("Linien")}</span><span>{t("Halte")}</span>
    {NETWORK_MODES.map(mode=><div key={mode.id} className="network-row">
     <span><i style={{background:mode.color}}/>{t(mode.label)}</span>
     <label><input type="checkbox" aria-label={t(mode.label)+t(' Linien')} checked={layerState[mode.id].lines} onChange={e=>toggle(mode.id,'lines',e.target.checked)}/><span className="sr-only">{t(mode.label)} {t(" Linien")}</span></label>
     <label><input type="checkbox" aria-label={t(mode.label)+t(' Halte')} checked={layerState[mode.id].stops} onChange={e=>toggle(mode.id,'stops',e.target.checked)}/><span className="sr-only">{t(mode.label)} {t(" Halte")}</span></label>
    </div>)}
   </div>
   {region==='mexico'&&routeChoices.length>0&&(['bus','colectivo'].some(mode=>layerState[mode].lines||layerState[mode].stops))&&<label className="network-route-filter">{t('Bus-/Colectivo-Linie und Richtung')}<select aria-label={t('Bus-/Colectivo-Linie und Richtung')} value={selectedRoute?.id||''} onChange={e=>{const route=routeChoices.find(r=>r.id===e.target.value)||null;setSelectedRoute(route);if(route?.mode)setLayerState(old=>({...old,[route.mode!]:{lines:true,stops:true}}));}}><option value="">{t('Alle kartierten Richtungen')}</option>{routeChoices.map(r=><option key={r.id} value={r.id}>{t(r.mode==='bus'?'Bus':'Colectivo / Combi')} · {r.ref||r.name}{r.from&&r.to?' · '+r.from+' → '+r.to:r.to?' · '+r.to:''}</option>)}</select></label>}
   {region==='mexico'&&selectedRoute&&<><p className="selected-network-route"><b>{selectedRoute.ref||selectedRoute.name}</b><span>{selectedRoute.from&&selectedRoute.to?selectedRoute.from+' → '+selectedRoute.to:selectedRoute.name}</span>{selectedRoute.operator&&<small>{selectedRoute.operator}</small>}</p><details className="selected-network-stops"><summary>{t('Kartierte Halte dieser Richtung')} ({selectedRoute.mode?shownStops(selectedRoute.mode).length:0})</summary><ul>{(selectedRoute.mode?shownStops(selectedRoute.mode):[]).slice().sort((a,b)=>a.name.localeCompare(b.name,locale)).map(stop=><li key={stop.id}>{stop.name}{stop.servingRoutes?.find(r=>r.id===selectedRoute.id)?.boardingAllowed===false&&<small>{t('Nur Ausstieg')}</small>}</li>)}</ul><small>{t('Halte im sichtbaren Ausschnitt, alphabetisch. Weitere Einstiege können fehlen.')}</small></details><button type="button" onClick={()=>setSelectedRoute(null)}>{t('Alle Bus- und Colectivo-Richtungen anzeigen')}</button></>}
   {region==='mexico'&&<details className="operator-directory"><summary>{t('Weitere Busanbieter und Linien')}</summary><p><a href="https://www.turicun.com/rutas" target="_blank" rel="noreferrer">Turicún · Cancún</a><small>R-1 · R-2 · R-5 · R-6 · R-11 · R-15 · R-21 · R-27 · R-28 · R-44 · R-68 · R-237 · MOBI</small></p><p><a href="https://ahorrobus.com.mx/es/quintana-roo" target="_blank" rel="noreferrer">Ahorrobus · Mayab / Oriente / SUR</a><small>{t('Betreiberverzeichnis mit Linienkennungen, z. B. Mayab 481/482 und 489/490. Kartierte Betreiberverläufe: Oriente 608/609.')}</small></p><p><a href="https://international.ado.com.mx/ado-bus/playa-del-carmen-to-cancun" target="_blank" rel="noreferrer">Playa Express · Playa del Carmen ↔ Cancún</a></p><small>{t('Diese Quellen ergänzen die Orientierung. Ein Linienverzeichnis oder Kartenverlauf bestätigt keine datumsbezogene Fahrt oder einen Anschluss.')}</small></details>}
   {region==='mexico'&&<small>{t('CL-Kennungen stammen aus Kartendaten. Beschriftung und Ziel am Fahrzeug prüfen. Die Auswahl hebt eine kartierte Richtung hervor; sie bestätigt keinen Fahrplan.')}</small>}
   {region==='mexico'&&<small>{t("Colectivos / Combis: eigene Linien- und Halteebene. Violett: kartierte Verläufe und übliche Einstiegspunkte laut Quelle. Zusätzliche Einstiege können fehlen; kein bestätigter Fahrplan.")}</small>}
   <p className={'network-status '+(networkError?'has-error':'')} role="status">{loading&&<span className="network-spinner"/>}{t(visibleStatus)}</p>
   {visibleNetwork&&<>
    <div className="network-counts"><b>{t("Im sichtbaren Ausschnitt")}</b>
     {NETWORK_MODES.filter(m=>(layerState[m.id].lines||layerState[m.id].stops)&&visibleNetwork.modes?.includes(m.id)).map(m=><span key={m.id}>
      {t(m.label)}: {layerState[m.id].lines&&m.id!=='rail'?shownLines(m.id).length+t(' Linienverläufe')+(layerState[m.id].stops?' · ':''):''}{layerState[m.id].stops?shownStops(m.id).length+t(' Halte'):''}
     </span>)}
    </div>
    <p className="network-source">{t("Quelle: ")}{t(visibleNetwork.source)}{visibleNetwork.attributions?.map(a=><a key={a.url} href={a.url} target="_blank" rel="noreferrer">{t(a.label)}</a>)}</p>
    {(requestDetail==='all'||visibleNetwork.warningScope!=='lines')&&visibleNetwork.warning&&<p className="network-warning" role="status">{t(visibleNetwork.warning)}</p>}
   </>}
   {tileError&&layerState.rail.lines&&<p className="network-status has-error">{t("Einige Kacheln des Bahnnetzes konnten nicht geladen werden.")}</p>}
   <button type="button" onClick={()=>{setTileError(false);railway.current?.redraw();setRetry(n=>n+1);}} disabled={loading}>{t("Ausschnitt neu laden")}</button>
   <small>{t("Die Ebenenschalter ändern die Karte. Die Fahrtsuche berücksichtigt unabhängig davon Bus, Bahn und Nahverkehr. Die Schienenkarte enthält auch Güterstrecken.")}</small><small>{t(region==='mexico'?'Bahnlinien: Schieneninfrastruktur. Kartierte mexikanische Linien und Halte ab Zoom 9. Daten können fehlen; aktuelle Bedienung und Fahrpläne sind nicht bestätigt.':'Bahnlinien: Schieneninfrastruktur. Allgemeines Liniennetz und Halte ab Zoom 12, auch ohne Reiseplanung. Daten können fehlen; keine Zusage zum aktuellen Betrieb.')}</small>
  </details></aside>
  {picking&&<div className="pick-banner">{t("Kartenpunkt oder Halt wählen · als ")}{picking}</div>}
  <div className="map-caption">{parts.length?<>{t("Reiseverlauf: ")}{[...new Set(parts.map(p=>p.source))].join(' · ')} {t(" · Grün/Blau: Bahn · Braun: Bus · Grau: Fußweg")}{parts.some(p=>p.legs.some(l=>!l.walking&&l.geometry?.reason==='unverified'&&l.geometry.segments.length))?t(' · Farbig gestrichelt: Anbieterverlauf, Originalpfad nicht bestätigt'):''}{parts.some(p=>p.alternativeKind==='walking')?t(' · Rot gestrichelt: Fußweg-Notlösung'):''}{parts.some(p=>p.legs.some(l=>l.geometry?.status!=='complete'))?t(' · Fehlende Geometrie bleibt offen.'):''}</>:t('{0} entdecken · Netzebenen unabhängig von deiner Reise einblenden',[t(region==='mexico'?'Mexiko':'Europa')])}</div>
 </section>;
}
