import {getJourney} from '@/lib/journey.mjs';
import {getVrrJourney,validVrrId} from '@/lib/vrr.mjs';
import type {Station} from '@/lib/types';
function valid(s:Station){return s&&typeof s.name==='string'&&s.name.trim().length>0&&s.name.length<200&&typeof s.dbId==='string'&&(!s.dbId||/^\d{6,9}$/.test(s.dbId))&&Number.isFinite(s.lat)&&Number.isFinite(s.lon)&&s.lat>=-90&&s.lat<=90&&s.lon>=-180&&s.lon<=180;}
export async function POST(request:Request){
 try{const text=await request.text();if(text.length>20000)return Response.json({error:'Die Anfrage ist zu groß.'},{status:400});const {from,to,departure,source='oebb'}=JSON.parse(text);
 if(!['oebb','vrr'].includes(source)||[from,to].some(s=>s?.vrrId!==undefined&&!validVrrId(s.vrrId)))return Response.json({error:'Bitte eine gültige Auskunft und Haltestelle wählen.'},{status:400});
 if(!valid(from)||!valid(to)||typeof departure!=='string'||!/(Z|[+-]\d\d:\d\d)$/.test(departure)||!Number.isFinite(Date.parse(departure)))return Response.json({error:'Bitte gültige Bahnhöfe, Datum und Abfahrtszeit wählen.'},{status:400});
 if(Date.parse(departure)<Date.now()-5*60000)return Response.json({error:'Die Abfahrt liegt in der Vergangenheit. Bitte Datum oder Uhrzeit anpassen.'},{status:400});
 if(Date.parse(departure)>Date.now()+365*86400000)return Response.json({error:'Bitte eine Abfahrt innerhalb der nächsten zwölf Monate wählen.'},{status:400});
 const journey=await (source==='vrr'?getVrrJourney:getJourney)(from,to,departure,request.signal);return Response.json({journey},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Die Fahrplanabfrage ist fehlgeschlagen.',notices:e&&typeof e==='object'&&'notices' in e?e.notices:[]},{status:502,headers:{'Cache-Control':'no-store'}});}
}
