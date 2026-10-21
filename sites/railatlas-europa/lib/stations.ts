import {unpack} from './rail.mjs';
import type {Station} from './types';
let promise:Promise<Station[]>|undefined;
export function loadStations():Promise<Station[]>{
 if(!promise)promise=fetch('/data/stations.json').then(r=>{if(!r.ok)throw new Error('Der Bahnhofskatalog konnte nicht geladen werden. Bitte erneut versuchen.');return r.json();}).then(unpack).catch(e=>{promise=undefined;throw e;});return promise;
}
