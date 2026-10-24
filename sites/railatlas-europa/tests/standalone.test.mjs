import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createStandaloneServer} from '../scripts/serve-standalone.mjs';
import {handleApi} from '../lib/api.mjs';
import {normalizeApiOrigin,apiUrl} from '../lib/urls.mjs';

test('standalone health, static assets, CORS and API errors work without any Site service',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'railatlas-'));await writeFile(path.join(dir,'index.html'),'<title>RailAtlas test</title>');
 const server=createStandaloneServer({staticRoot:dir});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 try {
  assert.match(await (await fetch(origin)).text(),/RailAtlas test/);
  const health=await fetch(origin+'/api/health');assert.deepEqual(await health.json(),{service:'RailAtlas Europa',apiVersion:1,standalone:true});
  const preflight=await fetch(origin+'/api/journeys',{method:'OPTIONS',headers:{Origin:'https://dunkelst.github.io','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://dunkelst.github.io');
  assert.equal((await fetch(origin+'/api/health',{headers:{Origin:'https://unapproved.example'}})).status,403);
  const bad=await fetch(origin+'/api/journeys',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'});assert.equal(bad.status,400);assert.match((await bad.json()).error,/JSON/);
  assert.equal((await fetch(origin+'/api/journeys',{method:'POST',body:JSON.stringify({departure:new Date().toISOString()})})).status,400);
  assert.equal((await fetch(origin+'/api/journeys',{method:'POST',body:'x'.repeat(20001)})).status,413);
  assert.equal((await fetch(origin+'/missing')).status,404);
  assert.equal((await fetch(origin+'/index.html',{method:'POST'})).status,405);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
test('live-journey request validation preserves dates, valid station IDs and no-store',async()=>{
 const station={name:'Heilbronn Hbf',dbId:'8000157',lat:49.142,lon:9.208};
 const send=body=>handleApi(new Request('https://railatlas.example/api/journeys',{method:'POST',body:JSON.stringify(body)}));
 let response=await send({from:station,to:{...station,name:'Würzburg Hbf',dbId:'8000260'},departure:'2020-01-01T08:00:00Z'});assert.equal(response.status,400);assert.match((await response.json()).error,/Vergangenheit/);assert.equal(response.headers.get('Cache-Control'),'no-store');
 response=await send({from:station,to:station,departure:new Date(Date.now()+86400000).toISOString(),source:'unknown'});assert.equal(response.status,400);
 response=await send({from:station,to:station,departure:'2026-10-25T08:00:00'});assert.equal(response.status,400);
});
test('Pages needs an explicitly configured server; API addresses cannot carry credentials',()=>{
 assert.throws(()=>apiUrl('/api/journeys',{requiresApiOrigin:true}),/RailAtlas-Servers/);
 assert.equal(apiUrl('/api/journeys',{requiresApiOrigin:true,apiOrigin:'https://railatlas.example'}),'https://railatlas.example/api/journeys');
 assert.equal(normalizeApiOrigin('https://railatlas.example/'),'https://railatlas.example');assert.equal(normalizeApiOrigin('http://localhost:3000'),'http://localhost:3000');
 for(const value of ['https://user:secret@railatlas.example','javascript:alert(1)','http://public.example','https://railatlas.example/api','https://railatlas.example/?secret=1'])assert.throws(()=>normalizeApiOrigin(value));
});
