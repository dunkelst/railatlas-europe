import {distanceKm, localBerlinISO, normalize} from './rail.mjs';

export function hafasTime(date,time,offset){
 if(!date||!time)return null;
 const t=String(time).padStart(6,'0'),days=t.length>6?Number(t.slice(0,-6)):0,clock=t.slice(-6);
 const utc=Date.UTC(Number(date.slice(0,4)),Number(date.slice(4,6))-1,Number(date.slice(6,8))+days,Number(clock.slice(0,2)),Number(clock.slice(2,4)),Number(clock.slice(4,6)));
 if(!Number.isFinite(utc))return null;
 return Number.isFinite(offset)?new Date(utc-offset*60000).toISOString():localBerlinISO(new Date(utc).toISOString().slice(0,19));
}

// HAFAS cfg.polyEnc=GPA uses Google's documented delta polyline encoding (1e-5 degrees).
// Keep source fragments separate: joining them would invent a path across missing geometry.
export function decodePolyline(encoded){
 if(typeof encoded!=='string'||encoded.length>2000000)return [];
 let i=0,lat=0,lon=0;const points=[];
 const value=()=>{let n=0,shift=0,b;do{if(i>=encoded.length||shift>30)throw Error('Ungültige Geometrie');b=encoded.charCodeAt(i++)-63;if(b<0||b>63)throw Error('Ungültige Geometrie');n|=(b&31)<<shift;shift+=5;}while(b>=32);return n&1?~(n>>>1):n>>>1;};
 try{while(i<encoded.length){lat+=value();lon+=value();const p=[lat/1e5,lon/1e5];if(Math.abs(p[0])>90||Math.abs(p[1])>180)return [];points.push(p);}return points.length>1?points:[];}catch{return [];}
}
export function routeGeometry(raw,common,from,to){
 const owner=raw.jny||raw.gis||{},refs=owner.polyG?.polyXL||[],polys=refs.length?refs.map(i=>common.polyL?.[i]):owner.poly?[owner.poly]:[];
 let segments=polys.map(p=>decodePolyline(p?.crdEncYX)).filter(p=>p.length>1);
 // Some transfer responses contain only an endpoint-to-endpoint chord, not a routed path.
 if(segments.flat().length===2&&distanceKm(from,to)>.15)segments=[];
 if(!segments.length)return {status:'missing',segments:[],source:'ÖBB / Scotty'};
 const km=(p,s)=>distanceKm({lat:p[0],lon:p[1]},s);
 const endpoints=km(segments[0][0],from)<2&&km(segments.at(-1).at(-1),to)<2;
 const continuous=segments.every((s,i)=>!i||km(segments[i-1].at(-1),{lat:s[0][0],lon:s[0][1]})<.1);
 return {status:segments.length===polys.length&&endpoints&&continuous?'complete':'partial',segments,source:'ÖBB / Scotty'};
}
export function transportProduct(product,walking=false,notes=[]){
 if(walking)return {mode:'walk',modeLabel:'Fußweg'};
 const cls=Number(product.cls)||0,cat=String(product.prodCtx?.catOutS||product.prodCtx?.catOut||'').trim(),name=String(product.name||cat);
 const replacement=/\b(SEV|EV|Ersatzbus|Schienenersatzverkehr|Ersatzverkehr)\b/i.test(name+' '+cat)||(!!(cls&64)&&notes.some(n=>/Schienenersatzverkehr|Ersatzbus/i.test(n)));
 if(replacement)return {mode:'replacement-bus',modeLabel:'Ersatzbus / SEV'};
 if(cls&256)return {mode:'subway',modeLabel:'U-Bahn'};
 if(cls&512)return {mode:'tram',modeLabel:'Straßenbahn'};
 if(cls&64)return {mode:'bus',modeLabel:'Bus'};
 if(cls&128)return {mode:'ferry',modeLabel:'Fähre'};
 if(cls&32)return {mode:'suburban',modeLabel:'S-Bahn'};
 if(cls&2048)return {mode:'on-demand',modeLabel:'Rufverkehr / Seilbahn'};
 if(cls&(1|2|4|8|16|4096))return {mode:'train',modeLabel:cls&(1|2|4|8|4096)?'Fernverkehr':'Regionalzug'};
 return {mode:'unknown',modeLabel:cat||'Öffentlicher Verkehr'};
}
export function plainText(value){return String(value||'').replace(/<br\s*\/?\s*>|<\/(?:p|div|li)>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return c>0&&c<=0x10ffff?String.fromCodePoint(c):'';}).replace(/&(amp|lt|gt|quot|apos|nbsp|auml|ouml|uuml|Auml|Ouml|Uuml|szlig|bdquo|ldquo|ndash|hellip);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',auml:'ä',ouml:'ö',uuml:'ü',Auml:'Ä',Ouml:'Ö',Uuml:'Ü',szlig:'ß',bdquo:'„',ldquo:'“',ndash:'–',hellip:'…'})[n]).trim();}
function period(o,fromDate,fromTime,toDate,toTime){return {from:hafasTime(o[fromDate],o[fromTime]||'000000'),until:hafasTime(o[toDate],o[toTime]||'235959')};}
function overlaps(p,start,end){return (!p.from||Date.parse(p.from)<=Date.parse(end))&&(!p.until||Date.parse(p.until)>=Date.parse(start));}
export function noticeReferences(objects){
 const refs=[];
 for(const o of objects.filter(Boolean)){
  const located=Number.isInteger(o.locX)?{fLocX:o.locX,tLocX:o.locX,passBy:o.passBy||o.dInS===false&&o.aOutS===false}:{};
  refs.push(...(o.msgL||[]).map(ref=>({...located,...ref})));
  for(const key of ['rRefL','remL'])for(const i of o[key]||[])if(Number.isInteger(i))refs.push({...located,type:'REM',remX:i});
 }
 return refs;
}
export function parseNotices(refs,common,locations,start,end,scope){
 const result=new Map();
 for(const ref of refs){
  const warning=ref.type==='HIM',item=warning?common.himL?.[ref.himX]:ref.type==='REM'?common.remL?.[ref.remX]:null;if(!item)continue;
  const title=plainText(item.head||item.txtS),text=plainText(item.text||item.txtN);if(!title&&!text)continue;
  const validity=warning?period(item,'sDate','sTime','eDate','eTime'):{from:null,until:null};
  const periods=(item.eventRefL||[]).map(i=>common.himMsgEventL?.[i]).filter(Boolean).map(e=>period(e,'fDate','fTime','tDate','tTime'));
  if(!overlaps(validity,start,end)||periods.length&&!periods.some(p=>overlaps(p,start,end)))continue;
  const code=item.code||'',all=normalize(title+' '+text);
  const kind=/streckensperr|totalsperr|strecke.{0,80}gesperrt|sperrung.{0,80}zwischen|verkehr.{0,40}unterbrochen|kein zugverkehr/.test(all)?'closure':/cancel|ausfall|fallt aus|kann.{0,80}nicht fahren|kein halt/.test(normalize(code+' '+all))?'cancellation':/delay|verspat/.test(normalize(code+' '+all))?'delay':'notice';
  const operational=warning||['D','U','R','N','Y','Q','P','M'].includes(item.type)||kind!=='notice'||/baustell|ersatzverkehr|ersatzbus|umleitung|haltentfall|sperr|storung/.test(all);
  const f=locations[ref.fLocX],t=locations[ref.tLocX];
  const context=f&&t?f.name+(f.dbId!==t.dbId?' → '+t.name:''):f?.name||scope;
  let hash=2166136261;for(const c of JSON.stringify([code,title,text,context,validity,periods]))hash=Math.imul(hash^c.charCodeAt(0),16777619);
  const id=String(item.hid||ref.type)+':'+(hash>>>0).toString(16);
  const relevant=operational&&!(ref.passBy&&/^text\.realtime\.stop\.(entry|exit)/.test(code));
  result.set(id,{id,title:title||(relevant?'Betriebshinweis':'Fahrplanhinweis'),text,code,kind,severity:relevant?'warning':'info',validFrom:validity.from,validUntil:validity.until,periods,validity:validity.from||validity.until||periods.length?'dated':'unspecified',scope:context,source:'ÖBB / Scotty'});
 }
 return [...result.values()];
}
export function mergeNotices(lists){const result=new Map();for(const n of lists.flat()){const text=normalize(n.text).replace(/^[a-z]{1,8}\s*\d+\s+/,'');const key=JSON.stringify([n.kind,normalize(n.title),text,normalize(n.scope),n.validFrom||'',n.validUntil||'']);const current=result.get(key);if(!current||n.text.length>current.text.length)result.set(key,n);}return [...result.values()];}
