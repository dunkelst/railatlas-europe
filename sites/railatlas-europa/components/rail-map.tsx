"use client";
import {useEffect,useRef,useState} from 'react';
import type {Station,Journey} from '@/lib/types';
declare global {interface Window {L:any}}
let leaflet:Promise<any>|undefined;
function loadLeaflet(){if(window.L)return Promise.resolve(window.L);if(!leaflet)leaflet=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/vendor/leaflet.js';script.onload=()=>resolve(window.L);script.onerror=()=>{leaflet=undefined;reject(new Error('Die Karte konnte nicht geladen werden.'));};document.head.appendChild(script);});return leaflet;}
export default function RailMap({stations,parts,picking,onPick,overlay,setOverlay}:{stations:Station[];parts:Journey[];picking:string|null;onPick:(lat:number,lon:number)=>void;overlay:boolean;setOverlay:(v:boolean)=>void}){
 const container=useRef<HTMLDivElement>(null),map=useRef<any>(null),layers=useRef<any>(null),railway=useRef<any>(null),pickRef=useRef(onPick),modeRef=useRef(picking);const [error,setError]=useState('');
 pickRef.current=onPick;modeRef.current=picking;
 useEffect(()=>{let active=true;loadLeaflet().then(L=>{if(!active||!container.current)return;
  const m=L.map(container.current,{zoomControl:false,scrollWheelZoom:true}).setView([49.3,8.5],5);map.current=m;
  L.control.zoom({position:'bottomright'}).addTo(m);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap-Mitwirkende'}).addTo(m);
  railway.current=L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenRailwayMap'});
  layers.current=L.layerGroup().addTo(m);
  m.on('click',(e:any)=>{if(modeRef.current)pickRef.current(e.latlng.lat,e.latlng.lng);});
  const resize=new ResizeObserver(()=>m.invalidateSize());resize.observe(container.current);m._railResize=resize;
 }).catch(e=>setError(e.message));return()=>{active=false;if(map.current){map.current._railResize?.disconnect();map.current.remove();map.current=null;layers.current=null;}};},[]);
 useEffect(()=>{let active=true;loadLeaflet().then(L=>{if(!active||!map.current||!layers.current)return;const group=layers.current;group.clearLayers();
  const coords:number[][]=[];
  if(parts.length){parts.forEach((p,pi)=>p.legs.forEach(l=>{for(const points of l.geometry?.segments||[]){if(points.length>1){L.polyline(points,{color:l.walking?'#65706b':l.mode==='bus'||l.mode==='replacement-bus'?'#a25624':pi%2?'#245ddb':'#206449',weight:l.walking?3:4,opacity:.9,...(l.walking?{dashArray:'3 6'}:{})}).addTo(group);coords.push(...points);}}}));}
  stations.forEach((s,i)=>{if(!Number.isFinite(s.lat)||!Number.isFinite(s.lon))return;const pos=[s.lat,s.lon];coords.push(pos);const node=document.createElement('div');node.className='map-popup';node.textContent=s.name+' · '+s.country;
   L.marker(pos,{icon:L.divIcon({className:'station-pin '+(i===0?'pin-start':i===stations.length-1?'pin-end':'pin-via'),html:'<span>'+String(i+1)+'</span>',iconSize:[30,30],iconAnchor:[15,15]})}).bindPopup(node).addTo(group);
  });
  if(coords.length>1)map.current.fitBounds(L.latLngBounds(coords),{padding:[60,60],maxZoom:11});else if(coords.length)map.current.setView(coords[0],12);
 });return()=>{active=false};},[stations,parts]);
 useEffect(()=>{loadLeaflet().then(()=>{if(!map.current||!railway.current)return;if(overlay)railway.current.addTo(map.current);else map.current.removeLayer(railway.current);});},[overlay]);
 return <section className={'map-stage '+(picking?'picking':'')} aria-label="Europäische Bahnkarte"><div ref={container} className="map-canvas"/>{error&&<div className="map-message">{error} Die Reiseplanung steht weiterhin zur Verfügung.</div>}<div className="map-tag"><span className="live-dot"/>EUROPÄISCHES SCHIENENNETZ</div><div className="map-options"><label><input type="checkbox" checked={overlay} onChange={e=>setOverlay(e.target.checked)}/>Bahnstrecken</label></div>{picking&&<div className="pick-banner">In die Karte klicken · nächster Halt als {picking}</div>}<div className="map-caption">{parts.length?<>Streckenverlauf: ÖBB / Scotty · Grün/Blau: Bahn · Braun: Bus · Grau: Fußweg{parts.some(p=>p.legs.some(l=>l.geometry?.status!=='complete'))?' · Fehlende Geometrie bleibt offen.':''}</>:'Entdecke Europa mit Bahn & ÖPNV'}</div></section>;
}
