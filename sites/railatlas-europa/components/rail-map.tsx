"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import type {Station,Journey} from '@/lib/types';
import {assetUrl,apiUrl,runtime} from '@/lib/urls.mjs';
import {NETWORK_MODES,NETWORK_MIN_ZOOM,defaultNetworkLayers,validateBounds,networkRequestBounds,networkCovers,networkInView,fetchNetwork} from '@/lib/network.mjs';
import {REGIONS} from '@/lib/regions.mjs';
declare global {interface Window {L:any}}
type LayerState=Record<string,{lines:boolean;stops:boolean}>;
type NetworkStop={id:string;name:string;lat:number;lon:number;lines:string[];station?:Station;source?:string;sourceUrl?:string;sourceDate?:string;boardingKind?:string};
type NetworkData={layers:Record<string,{lines:{id:string;name:string;ref:string;calculated?:boolean;source?:string;sourceUrl?:string;sourceDate?:string;segments:[number,number][][]}[];stops:NetworkStop[]}>;bounds:number[];modes:string[];detail?:string;source:string;warning?:string;warningScope?:string;attributions?:{label:string;url:string}[];fetchedAt:string};
let leaflet:Promise<any>|undefined;
function loadLeaflet(){if(window.L)return Promise.resolve(window.L);if(!leaflet)leaflet=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=assetUrl('vendor/leaflet.js');script.onload=()=>resolve(window.L);script.onerror=()=>{leaflet=undefined;reject(new Error('Die Karte konnte nicht geladen werden.'));};document.head.appendChild(script);});return leaflet;}
export default function RailMap({stations,parts,picking,onPick,onStopPick,region='europe',focus}:{stations:Station[];parts:Journey[];picking:string|null;onPick:(lat:number,lon:number)=>void;onStopPick:(station:Station,target?:'start'|'end'|'via')=>void;region?:string;focus?:{centre:number[];zoom:number}}){
 const container=useRef<HTMLDivElement>(null),controls=useRef<HTMLElement>(null),map=useRef<any>(null),journeyLayer=useRef<any>(null),railway=useRef<any>(null),networkGroups=useRef<Record<string,any>>({});
 const pickRef=useRef(onPick),stopRef=useRef(onStopPick),modeRef=useRef(picking);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[tileError,setTileError]=useState(false),[layerState,setLayerState]=useState<LayerState>(defaultNetworkLayers),[view,setView]=useState<{zoom:number;bounds:number[]}|null>(null),[network,setNetwork]=useState<NetworkData|null>(null),[status,setStatus]=useState(''),[networkError,setNetworkError]=useState(false),[loading,setLoading]=useState(false),[retry,setRetry]=useState(0);
 pickRef.current=onPick;stopRef.current=onStopPick;modeRef.current=picking;
 const networkRef=useRef<NetworkData|null>(null),loadedRetry=useRef(0);networkRef.current=network;
 let requestKey='';if(view)try{requestKey=networkRequestBounds(view.bounds).join(',');}catch{requestKey='outside';}
 const detailVisible=Boolean(view&&view.zoom>=NETWORK_MIN_ZOOM);
 const visibleNetwork=useMemo<NetworkData|null>(()=>network&&view&&detailVisible?networkInView(network,view.bounds):null,[network,view,detailVisible]);
 const requestDetail=NETWORK_MODES.some(m=>m.id!=='rail'&&layerState[m.id].lines)?'all':'stops';
 useEffect(()=>{let active=true;loadLeaflet().then(L=>{if(!active||!container.current)return;
  const m=L.map(container.current,{zoomControl:false,scrollWheelZoom:true,preferCanvas:true,zoomAnimation:false}).setView((region==='mexico'?REGIONS.mexico:REGIONS.europe).centre,(region==='mexico'?REGIONS.mexico:REGIONS.europe).zoom);map.current=m;
  L.control.zoom({position:'bottomright'}).addTo(m);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap-Mitwirkende'}).addTo(m);
  railway.current=L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenRailwayMap · Schieneninfrastruktur'}).on('tileerror',()=>{if(active)setTileError(true);});
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
 useEffect(()=>{setLayerState(old=>({...old,...(region==='mexico'?{bus:{lines:true,stops:true},subway:{lines:true,stops:true}}:{}),colectivo:{lines:region==='mexico',stops:region==='mexico'}}));},[region]);
 useEffect(()=>{if(!ready||!map.current||!railway.current)return;if(layerState.rail.lines)railway.current.addTo(map.current);else map.current.removeLayer(railway.current);},[layerState.rail.lines,ready]);
 const modes=NETWORK_MODES.filter(m=>layerState[m.id].stops||(m.id!=='rail'&&layerState[m.id].lines)).map(m=>m.id).join(',');
 useEffect(()=>{
  if(!ready||!view)return;let active=true;const controller=new AbortController();setNetworkError(false);setLoading(false);
  if(!modes){setNetwork(null);setStatus('Detailnetze sind ausgeblendet.');return;}
  if(!detailVisible){setNetwork(null);setStatus('Für Linien und Halte näher heranzoomen (ab Zoom 12).');return;}
  let bounds:number[];try{bounds=validateBounds(requestKey.split(',').map(Number));}catch{setStatus('Für die Detailnetze bitte näher heranzoomen.');return;}
  const forced=loadedRetry.current!==retry;loadedRetry.current=retry;
  if(!forced&&networkCovers(networkRef.current,bounds,modes.split(','))&&networkRef.current&&(requestDetail==='stops'||networkRef.current.detail==='all')&&Date.now()-Date.parse(networkRef.current.fetchedAt)<300000){setStatus(networkRef.current.warning?'Netzdaten teilweise geladen.':'Netzdaten geladen.');return;}
  const timer=setTimeout(async()=>{setLoading(true);setStatus('Linien und Halte für diesen Ausschnitt laden …');try{
   let data;
   const config=runtime();
   if(config.requiresApiOrigin&&!config.apiOrigin)data=await fetchNetwork(bounds,modes.split(','),controller.signal,requestDetail,forced);
   else{const response=await fetch(apiUrl('/api/network?'+new URLSearchParams({bbox:bounds.join(','),modes,detail:requestDetail,...(forced?{refresh:'1'}:{})})),{signal:controller.signal});const body=await response.json() as NetworkData&{error?:string};if(!response.ok)throw Error(body.error||'Netzebenen nicht erreichbar.');data=body;}
   if(!active)return;setNetwork(data);const count=modes.split(',').reduce((n,m)=>n+data.layers[m].lines.length+data.layers[m].stops.length,0);setNetworkError(false);setStatus(count?(data.warning?'Netzdaten teilweise geladen.':'Netzdaten geladen.'):'Für diesen Ausschnitt wurden keine passenden Netzdaten geliefert.');
  }catch(e){if(active&&!controller.signal.aborted){setNetworkError(true);setStatus(((e as Error).message||'Die Netzebenen sind gerade nicht erreichbar.')+(networkRef.current?' Bereits geladene Netzdaten bleiben sichtbar.':''));}}finally{if(active)setLoading(false);}},1000);
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[ready,requestKey,detailVisible,modes,requestDetail,retry]);
 useEffect(()=>{
  if(!ready||!map.current)return;const L=window.L;
  for(const mode of NETWORK_MODES){const group=networkGroups.current[mode.id];group?.clearLayers();const data=visibleNetwork?.layers[mode.id],enabled=layerState[mode.id];if(!data||!group)continue;
   if(enabled.lines&&mode.id!=='rail')for(const line of data.lines){const node=document.createElement('div');node.className='map-popup';node.textContent=mode.label+' · '+line.name+(line.calculated?' · berechneter Verlauf laut Auskunft':'')+(line.source?' · '+line.source:'')+(line.sourceDate?' · Stand '+line.sourceDate:'');for(const segment of line.segments)L.polyline(segment,{color:mode.color,weight:mode.id==='bus'?3:4,opacity:.8,bubblingMouseEvents:false,...(line.calculated?{dashArray:'8 5'}:{})}).bindPopup(node).addTo(group);}
   if(enabled.stops)for(const stop of data.stops){const node=document.createElement('div');node.className='map-popup network-popup';const heading=document.createElement('b');heading.textContent=stop.name;node.appendChild(heading);const text=document.createElement('small');text.textContent=mode.label+(stop.lines.length?' · '+stop.lines.join(', '):'')+' · '+(stop.source||network?.source||'Kartendaten');node.appendChild(text);
    if(mode.id==='colectivo'){const note=document.createElement('small');note.textContent=stop.boardingKind==='informal'?'Informeller Einstieg laut Kartendaten · Bedienung vor Ort prüfen':'Kartierter Colectivo-Einstieg · Beschilderung und aktuelle Bedienung vor Ort prüfen';node.appendChild(note);}
    if(stop.sourceDate){const note=document.createElement('small');note.textContent='Quellenstand '+stop.sourceDate;node.appendChild(note);}
    if(stop.sourceUrl&&stop.sourceUrl.startsWith('https://')){const link=document.createElement('a');link.href=stop.sourceUrl;link.textContent='Datenquelle öffnen';link.target='_blank';link.rel='noreferrer';node.appendChild(link);}
    const station:Station=stop.station?{...stop.station,networkMode:mode.id}:{id:'osm:'+stop.id,dbId:'',name:stop.name,lat:stop.lat,lon:stop.lon,country:'',main:false,networkMode:mode.id};
    for(const [target,label] of [['start','Als Start'],['end','Als Ziel'],['via','Als Zwischenziel']] as const){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{map.current?.closePopup();stopRef.current(station,target);};node.appendChild(button);}
    const tooltip=document.createElement('span');tooltip.textContent=stop.name;
    const marker=L.circleMarker([stop.lat,stop.lon],{radius:mode.id==='rail'||mode.id==='colectivo'?5:4,color:mode.color,fillColor:mode.id==='colectivo'?'#efdfff':'#ffffff',fillOpacity:1,weight:2,bubblingMouseEvents:false,...(stop.boardingKind==='informal'?{dashArray:'2 3'}:{})}).bindPopup(node).bindTooltip(tooltip,{direction:'top'}).addTo(group);
    marker.on('click',()=>{if(modeRef.current){map.current?.closePopup();stopRef.current(station);}});
   }
  }
 },[ready,visibleNetwork,layerState,region]);
 const toggle=(mode:string,field:'lines'|'stops',value:boolean)=>setLayerState(old=>({...old,[mode]:{...old[mode],[field]:value}}));
 const visibleObjects=visibleNetwork?NETWORK_MODES.reduce((n,m)=>n+(layerState[m.id].stops?visibleNetwork.layers[m.id].stops.length:0)+(layerState[m.id].lines&&m.id!=='rail'?visibleNetwork.layers[m.id].lines.length:0),0):0;
 const visibleStatus=visibleNetwork&&!loading&&!networkError&&!visibleObjects?'Für den sichtbaren Ausschnitt fehlen passende Netzdaten. Das bestätigt keine fehlende Bedienung.':status;
 return <section className={'map-stage '+(picking?'picking':'')} aria-label="Bahn- und Nahverkehrskarte">
  <div ref={container} className="map-canvas"/>
  {error&&<div role="alert" className="map-message">{error} Die Reiseplanung steht weiterhin zur Verfügung.</div>}
  <div className="map-tag"><span className="live-dot"/>{region==='mexico'?'MEXIKOS':'EUROPAS'} BAHN & ÖPNV-NETZE</div>
  <aside ref={controls} className="map-options network-controls" aria-label="Netzebenen"><details open>
   <summary>Netzebenen <span>Linien & Halte</span></summary>
   <div className="network-grid"><span>VERKEHRSMITTEL</span><span>Linien</span><span>Halte</span>
    {NETWORK_MODES.map(mode=><div key={mode.id} className="network-row">
     <span><i style={{background:mode.color}}/>{mode.label}</span>
     <label><input type="checkbox" aria-label={mode.label+' Linien'} checked={layerState[mode.id].lines} onChange={e=>toggle(mode.id,'lines',e.target.checked)}/><span className="sr-only">{mode.label} Linien</span></label>
     <label><input type="checkbox" aria-label={mode.label+' Halte'} checked={layerState[mode.id].stops} onChange={e=>toggle(mode.id,'stops',e.target.checked)}/><span className="sr-only">{mode.label} Halte</span></label>
    </div>)}
   </div>
   {region==='mexico'&&<small>Colectivos / Combis: eigene Linien- und Halteebene. Violett: kartierte Verläufe und übliche Einstiegspunkte laut Quelle. Zusätzliche Einstiege können fehlen; kein bestätigter Fahrplan.</small>}
   <p className={'network-status '+(networkError?'has-error':'')} role="status">{loading&&<span className="network-spinner"/>}{visibleStatus}</p>
   {visibleNetwork&&<>
    <div className="network-counts"><b>Im sichtbaren Ausschnitt</b>
     {NETWORK_MODES.filter(m=>(layerState[m.id].lines||layerState[m.id].stops)&&visibleNetwork.modes?.includes(m.id)).map(m=><span key={m.id}>
      {m.label}: {layerState[m.id].lines&&m.id!=='rail'?visibleNetwork.layers[m.id].lines.length+' Linienverläufe'+(layerState[m.id].stops?' · ':''):''}{layerState[m.id].stops?visibleNetwork.layers[m.id].stops.length+' Halte':''}
     </span>)}
    </div>
    <p className="network-source">Quelle: {visibleNetwork.source}{visibleNetwork.attributions?.map(a=><a key={a.url} href={a.url} target="_blank" rel="noreferrer">{a.label}</a>)}</p>
    {(requestDetail==='all'||visibleNetwork.warningScope!=='lines')&&visibleNetwork.warning&&<p className="network-warning" role="status">{visibleNetwork.warning}</p>}
   </>}
   {tileError&&layerState.rail.lines&&<p className="network-status has-error">Einige Kacheln des Bahnnetzes konnten nicht geladen werden.</p>}
   <button type="button" onClick={()=>{setTileError(false);railway.current?.redraw();setRetry(n=>n+1);}} disabled={loading}>Ausschnitt neu laden</button>
   <small>Bahnlinien: Schieneninfrastruktur. Allgemeines Liniennetz und Halte ab Zoom 12, auch ohne Reiseplanung. Daten können fehlen; keine Zusage zum aktuellen Betrieb.</small>
  </details></aside>
  {picking&&<div className="pick-banner">Kartenpunkt oder Halt wählen · als {picking}</div>}
  <div className="map-caption">{parts.length?<>Reiseverlauf: {[...new Set(parts.map(p=>p.source))].join(' · ')} · Grün/Blau: Bahn · Braun: Bus · Grau: Fußweg{parts.some(p=>p.legs.some(l=>!l.walking&&l.geometry?.reason==='unverified'&&l.geometry.segments.length))?' · Farbig gestrichelt: Anbieterverlauf, Originalpfad nicht bestätigt':''}{parts.some(p=>p.alternativeKind==='walking')?' · Rot gestrichelt: Fußweg-Notlösung':''}{parts.some(p=>p.legs.some(l=>l.geometry?.status!=='complete'))?' · Fehlende Geometrie bleibt offen.':''}</>:(region==='mexico'?'Mexiko':'Europa')+' entdecken · Netzebenen unabhängig von deiner Reise einblenden'}</div>
 </section>;
}
