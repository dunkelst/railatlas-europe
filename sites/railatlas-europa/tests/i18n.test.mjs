import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLanguage,LANGUAGE_KEY,LANGUAGES,localeFor,translate} from '../lib/i18n.mjs';
import {messages} from '../lib/messages.mjs';

test('Language preference is explicit, persists independently of region and rejects unsupported values',()=>{
 assert.equal(initialLanguage(),'de');
 assert.equal(initialLanguage('?region=mexico','en'),'en');
 assert.equal(initialLanguage('?region=europe&place=cdmx&lang=es','en'),'es');
 assert.equal(initialLanguage('?lang=fr','es'),'es');
 assert.equal(initialLanguage('?lang=__proto__','bad'),'de');
 assert.equal(LANGUAGE_KEY,'railatlas-language');
 assert.deepEqual(LANGUAGES.map(l=>l.name),['Deutsch','English','Español']);
});
test('Translations preserve names, values, punctuation and original provider text',()=>{
 assert.equal(translate('en','Zwischenziel {0}',[2]),'Stopover 2');
 assert.equal(translate('es','7 Std. 35 Min.'),'7 h 35 min');
 const original='Terminal 2 · Cancún übernommen · 0.6 km vom gewählten Punkt.';
 assert.equal(translate('es',original),'Terminal 2 · Cancún seleccionado · A 0.6 km del punto elegido.');
 assert.equal(translate('en','Bitte „Würzburg Hbf“ aus den Haltestellenvorschlägen eindeutig auswählen.'),'Please select “Würzburg Hbf” from the stop suggestions.');
 for(const lang of ['de','en','es']){
  assert.equal(translate(lang,'Würzburg Hbf'),'Würzburg Hbf');
  assert.equal(translate(lang,'Aviso original: cierre en Terminal 2.'),'Aviso original: cierre en Terminal 2.');
  assert.equal(translate(lang,'   '),'   ');
 }
 assert.equal(translate('es','  Verbindung finden '),'  Buscar viaje ');
 assert.equal(translate('es',translate('en',original)),translate('es',original));
});
test('Every interface translation is complete and preserves all substitution tokens',()=>{
 for(const [source,translations] of Object.entries(messages)){
  assert.equal(translations.length,2,source);
  const tokens=s=>[...s.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();
  for(const text of translations){assert.ok(text.trim(),source);assert.deepEqual(tokens(text),tokens(source),source);}
 }
});
test('Locale formatting changes display without changing the journey instant or time zone',()=>{
 const when=new Date('2026-10-29T18:30:00Z');
 for(const language of ['de','en','es']){
  const parts=new Intl.DateTimeFormat(localeFor(language),{timeZone:'America/Cancun',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(when);
  assert.equal(parts.find(p=>p.type==='hour').value,'13');
  assert.equal(parts.find(p=>p.type==='minute').value,'30');
 }
 assert.notEqual((54114).toLocaleString(localeFor('de')),(54114).toLocaleString(localeFor('en')));
});

test('Combined network notices translate each message while keeping provider identities',()=>{
 const original='Kartierte mexikanische Netzdaten mit Quellenstand im Halte-/Linienfenster; aktuelle Bedienung und Fahrpläne sind nicht bestätigt. Für Colectivo / Combi fehlen bestätigte Linienverläufe in diesem Ausschnitt. Die gelieferten Halte bleiben nutzbar; daraus folgt keine Aussage über vorhandenen Verkehr.';
 const result=translate('es',original);
 assert.ok(result.startsWith('Datos cartográficos de la red mexicana'));
 assert.ok(result.includes('Faltan recorridos confirmados para Colectivo / Combi'));
 assert.ok(result.endsWith('esto no confirma la disponibilidad de servicio.'));
 assert.equal(translate('en','Transitous / MOTIS (GTFS) + Mexikanische offene Verkehrsdaten'),'Transitous / MOTIS (GTFS) + Mexican open transit data');
});
