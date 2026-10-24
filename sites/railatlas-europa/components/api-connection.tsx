"use client";
import {useEffect, useState} from 'react';
import {normalizeApiOrigin, restoreApiOrigin, runtime, saveApiOrigin} from '@/lib/urls.mjs';

export default function ApiConnection({onReady}:{onReady:(ready:boolean)=>void}) {
  const [visible,setVisible]=useState(false),[origin,setOrigin]=useState(''),[saved,setSaved]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{restoreApiOrigin();const config=runtime();setVisible(!!config.requiresApiOrigin);setOrigin(config.apiOrigin||'');setSaved(config.apiOrigin||'');onReady(!config.requiresApiOrigin||!!config.apiOrigin);},[onReady]);
  async function connect(e:React.FormEvent) {
    e.preventDefault();setError('');setBusy(true);
    try {const value=normalizeApiOrigin(origin);const response=await fetch(value+'/api/health',{signal:AbortSignal.timeout(8000)});const data=await response.json() as {service?:string;apiVersion?:number};if(!response.ok||data.service!=='RailAtlas Europa'||data.apiVersion!==1)throw Error('Unter dieser Adresse ist keine passende RailAtlas-Auskunft erreichbar.');saveApiOrigin(value);setSaved(value);setOrigin(value);onReady(true);}
    catch(e){setError((e as Error).message||'Der Server ist nicht erreichbar.');}finally{setBusy(false);}
  }
  if(!visible)return null;
  return <details className="api-connection" open={!saved}><summary>{saved?'Eigener Auskunftsserver verbunden':'Live-Auskunft einrichten'}</summary><p>Diese GitHub-Oberfläche nutzt deinen eigenen RailAtlas-Server. Karte und lokaler Bahnhofskatalog funktionieren auch ohne Server.</p><form onSubmit={connect}><label htmlFor="api-server">Serveradresse</label><input id="api-server" type="url" placeholder="https://dein-railatlas-server.de" value={origin} onChange={e=>setOrigin(e.target.value)} required/><button disabled={busy} type="submit">{busy?'Verbindung prüfen …':'Server verbinden'}</button>{saved&&<button type="button" onClick={()=>{saveApiOrigin('');setSaved('');setOrigin('');onReady(false);}}>Verbindung entfernen</button>}</form>{error&&<p role="alert">{error}</p>}<a href="https://github.com/dunkelst/railatlas-europe#eigenstaendig-starten" target="_blank" rel="noreferrer">Eigenen Server starten</a></details>;
}
