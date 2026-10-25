"use client";
import {useState} from 'react';
import {Navigation} from 'lucide-react';
import type {Journey,Station} from '@/lib/types';

export default function JourneyReplan({parts,busy,onChoose}:{parts:Journey[];busy:boolean;onChoose:(part:number,station:Station,when:string)=>void}){
 const [selected,setSelected]=useState('');
 const options=parts.flatMap((p,part)=>{
  const seen=new Set<string>();
  return p.legs.flatMap(l=>[{station:l.from,when:l.departure},...l.stopovers.filter(s=>!s.cancelled).map(s=>({station:s.station,when:s.departure||s.arrival})),{station:l.to,when:l.arrival}]).filter(s=>{
   if(!s.when||s.station.locationType==='coordinate'||seen.has(s.station.id))return false;
   seen.add(s.station.id);return true;
  }).map((s,i)=>({...s,part,key:part+':'+i}));
 });
 const chosen=options.find(s=>s.key===selected);
 return <details className="journey-replan"><summary><Navigation size={13}/>Bei Ausfall: ab einem Halt neu planen</summary>
  <p>Deinen tatsächlichen Halt wählen. Verbleibende Zwischenziele bleiben erhalten. Datum und Uhrzeit werden oben zur Prüfung übernommen.</p>
  <label>AKTUELLER HALT<select aria-label="Aktueller Halt für Neuplanung" value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)}><option value="">Halt wählen …</option>{options.map(s=><option key={s.key} value={s.key}>{parts.length>1?'Teilstrecke '+(s.part+1)+': ':''}{s.station.name}</option>)}</select></label>
  <button type="button" className="text-button" disabled={!chosen||busy} onClick={()=>{if(chosen?.when)onChoose(chosen.part,chosen.station,chosen.when);}}>Ab hier neu planen</button>
 </details>;
}
