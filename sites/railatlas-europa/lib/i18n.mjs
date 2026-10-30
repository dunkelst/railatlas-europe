import {messages} from './messages.mjs';
export const LANGUAGES = [{id:'de',name:'Deutsch',locale:'de-DE'},{id:'en',name:'English',locale:'en-GB'},{id:'es',name:'Español',locale:'es-MX'}];
export const LANGUAGE_KEY = 'railatlas-language';
/** @typedef {'de'|'en'|'es'} Language */
/** @param {unknown} value @returns {value is Language} */
export const validLanguage = value => LANGUAGES.some(l=>l.id===value);
/** @param {string} [search] @param {string} [stored] @returns {Language} */
export function initialLanguage(search='',stored='') {
  const requested=new URLSearchParams(search).get('lang');
  return validLanguage(requested)?requested:validLanguage(stored)?stored:'de';
}
export const localeFor = language => LANGUAGES.find(l=>l.id===language)?.locale||'de-DE';
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const exact=new Map(), patterns=[];
for(const [de,translations] of Object.entries(messages)) {
  const variants=[de,...translations];
  for(const value of variants) if(!exact.has(value))exact.set(value,variants);
  if(!/\{\d+\}/.test(de))continue;
  for(const value of variants){const tokens=[...value.matchAll(/\{(\d+)\}/g)],chunks=value.split(/\{\d+\}/);patterns.push({specificity:chunks.join('').length,expression:new RegExp('^'+chunks.map(escape).join('(.*?)')+'$','s'),tokens:tokens.map(m=>m[1]),variants});}
}
// Prefer complete messages over shorter suffix templates.
patterns.sort((a,b)=>b.specificity-a.specificity);
// Translate interface strings only, at presentation time. Timetable records,
// station names, IDs, coordinates and source notices are never rewritten.
export function translate(language,message,values) {
  if(typeof message!=='string')return message??'';
  if(!message.trim())return message;
  const index=language==='en'?1:language==='es'?2:0;
  const leading=message.match(/^\s*/)[0],trailing=message.match(/\s*$/)[0],key=message.trim();
  let result=exact.get(key)?.[index];
  if(result===undefined&&key.length<6000)for(const pattern of patterns){const match=pattern.expression.exec(key);if(!match)continue;const captured=Object.fromEntries(pattern.tokens.map((token,i)=>[token,match[i+1]]));result=pattern.variants[index].replace(/\{(\d+)\}/g,(token,id)=>captured[id]??token);break;}
  if(result===undefined){
    // Shared network handlers combine notices and source names. Translate the
    // individual owned messages while retaining every source and data value.
    const sentences=key.split(/(?<=[.!?])(?=\s+[A-ZÄÖÜ])/);
    if(sentences.length>1)result=sentences.map(part=>translate(language,part)).join('');
    else if(key.includes(' + '))result=key.split(' + ').map(part=>translate(language,part)).join(' + ');
    else result=key;
  }
  if(values)result=result.replace(/\{(\d+)\}/g,(token,id)=>String(values[id]??token));
  return leading+result+trailing;
}
export function locationHintText(language,station){
  const hint=station?.locationHint;
  return typeof hint==='string'&&hint.startsWith('bei ')?translate(language,'bei {0}',[hint.slice(4)]):hint||station?.locality||'';
}
