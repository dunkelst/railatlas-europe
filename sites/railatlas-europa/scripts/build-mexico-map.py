#!/usr/bin/env python3
"""Import licensed source geometry; never synthesize routes, stops or timetables.

Usage: python scripts/build-mexico-map.py /absolute/source-cache
The cache must contain the listed GTFS ZIPs and the recorded Playa OSM map JSON.
Acquisition URLs, dates, hashes and exclusions are retained with the output.
"""
import base64,csv,gzip,hashlib,io,json,subprocess,sys,zipfile
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FEEDS=[
 ('mx-cdmx-gtfs','mex-cdmx-cdmx','SEMOVI Ciudad de México','CC-BY-4.0','2024-12-19'),
 ('mex-mex-jilotepec','mex-mex-jilotepec','Ayuntamiento de Jilotepec','CC-BY-4.0','2026-07-01'),
 ('mex-oax-salinacruz','mex-oax-salinacruz','SEMOVI Oaxaca / Salina Cruz','ODC-By-1.0','2026-06-01'),
]
MODES=['rail','suburban','subway','tram','bus','colectivo']
def point(lat,lon):
 try:
  p=[float(lat),float(lon)]
  return p if 14.3<=p[0]<=32.8 and -118.5<=p[1]<=-86.5 else None
 except (TypeError,ValueError):return None
def build(cache):
 layers={m:{'lines':[],'stops':[]} for m in MODES};sources=[]
 catalogue={d['dct:identifier']:d for d in json.loads((cache/'mx-hub-catalog.json').read_text())['dcat:dataset']}
 for filename,feed,publisher,license,date in FEEDS:
  data=(cache/(filename+'.zip')).read_bytes();meta=catalogue[feed];date=meta['dct:modified']['@value']
  expected=meta['dcat:distribution'][0]['spdx:checksum']['spdx:checksumValue']
  if hashlib.sha256(data).hexdigest()!=expected:raise ValueError('Source checksum differs from catalogue: '+feed)
  z=zipfile.ZipFile(io.BytesIO(data))
  def rows(name):return list(csv.DictReader(io.StringIO(z.read(name).decode('utf-8-sig'))))
  routes={r['route_id']:r for r in rows('routes.txt')};trips={r['trip_id']:r for r in rows('trips.txt')};shapes=defaultdict(list);stop_routes=defaultdict(set)
  agency={r['agency_id']:r for r in rows('agency.txt')}
  for r in rows('shapes.txt'):shapes[r['shape_id']].append((int(r['shape_pt_sequence']),point(r['shape_pt_lat'],r['shape_pt_lon'])))
  shapes={k:[p for _,p in sorted(v)] for k,v in shapes.items()}
  for r in rows('stop_times.txt'):
   trip=trips.get(r['trip_id']);route=routes.get(trip.get('route_id')) if trip else None
   if route:stop_routes[r['stop_id']].add(route['route_id'])
  source_url='https://hdtp.codeandomexico.org/datos/'+feed
  source={'id':feed,'publisher':publisher,'license':license,'sourceDate':date,'retrieved':'2026-10-28','url':source_url,'downloadUrl':'https://hdtp.codeandomexico.org/gtfs/'+feed+'.zip','sha256':hashlib.sha256(data).hexdigest(),'excludedVirtualStops':0,'excludedInvalidShapes':0}
  def mode(route):
   if route.get('agency_id')=='SUB':return 'suburban'
   return {'0':'tram','1':'subway','2':'rail','3':'bus','11':'bus'}.get(route.get('route_type'))
  added=set()
  for trip in trips.values():
   route=routes.get(trip['route_id']);shape=trip.get('shape_id');m=mode(route) if route else None
   if not m or not shape or (route['route_id'],shape) in added:continue
   added.add((route['route_id'],shape));segments=[];segment=[]
   for p in shapes.get(shape,[]):
    if p:segment.append(p)
    else:
     if len(segment)>1:segments.append(segment)
     segment=[]
   if len(segment)>1:segments.append(segment)
   if not segments:source['excludedInvalidShapes']+=1;continue
   layers[m]['lines'].append({'id':'mx-gtfs:'+feed+':'+route['route_id']+':'+shape,'name':route.get('route_long_name') or route.get('route_short_name') or route['route_id'],'ref':route.get('route_short_name') or '', 'segments':segments,'source':publisher,'sourceUrl':source_url,'sourceDate':date,'pathSource':'GTFS_SHAPE'})
  for r in rows('stops.txt'):
   p=point(r.get('stop_lat'),r.get('stop_lon'));route_ids=stop_routes.get(r['stop_id'],set());names=[routes[k].get('route_short_name') or k for k in sorted(route_ids)]
   if str(r.get('stop_code','')).upper().startswith('VIRTUAL'):
    source['excludedVirtualStops']+=1;continue
   if not p or not r.get('stop_name') or not route_ids:continue
   locality={'mex-cdmx-cdmx':'Ciudad de México CDMX','mex-mex-jilotepec':'Jilotepec','mex-oax-salinacruz':'Salina Cruz'}[feed]
   station={'id':'mx-gtfs:'+feed+':'+r['stop_id'],'name':r['stop_name'],'lat':p[0],'lon':p[1],'country':'MX','dbId':'','main':False,'locality':locality,'lookupSource':publisher,'timetableStatus':'unverified','networkModes':sorted({mode(routes[k]) for k in route_ids if mode(routes[k])})}
   for m in station['networkModes']:
    layers[m]['stops'].append({'id':station['id'],'name':station['name'],'lat':p[0],'lon':p[1],'station':station,'lines':names,'source':publisher,'sourceUrl':source_url,'sourceDate':date,'boardingKind':'source-stop'})
  sources.append(source)
 osm_path=cache/'mx-playa-osm-map.xml';osm=json.loads(osm_path.read_text())
 sources.append({'id':'osm-playa','publisher':'OpenStreetMap-Mitwirkende','license':'ODbL-1.0','sourceDate':osm.get('osm3s',{}).get('timestamp_osm_base') or '2026-10-28','retrieved':'2026-10-28','url':'https://www.openstreetmap.org/copyright','downloadUrl':'https://api.openstreetmap.org/api/0.6/map?bbox=-87.08,20.62,-87.065,20.635','sha256':hashlib.sha256(osm_path.read_bytes()).hexdigest(),'bounds':[20.62,-87.08,20.635,-87.065]})
 payload={'gtfs':{'layers':layers,'bounds':[14.3,-118.5,32.8,-86.5],'modes':MODES,'source':'Mexikanische offene Verkehrsdaten','attributions':[{'label':s['publisher']+' · '+s['license'],'url':s['url']} for s in sources],'coverage':'partial'},'osm':osm}
 # Reuse the application's OSM parser, including gap preservation and stop roles.
 js="""import {parseNetwork,mergeNetworkStops} from './lib/network.mjs';let text='';for await(const c of process.stdin)text+=c;const d=JSON.parse(text),m=['rail','suburban','subway','tram','bus','colectivo'];const osm=parseNetwork(d.osm,[20.62,-87.08,20.635,-87.065],m);osm.source='OpenStreetMap';const r=mergeNetworkStops(d.gtfs,osm,m);process.stdout.write(JSON.stringify(r));"""
 result=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(payload).encode(),cwd=ROOT))
 for mode,layer in result['layers'].items():
  for stop in layer['stops']:
   if stop.get('source')=='OpenStreetMap' and not stop.get('station'):
    stop['sourceDate']='2026-10-28'
    stop['station']={'id':'osm:'+stop['id'],'name':stop['name'],'lat':stop['lat'],'lon':stop['lon'],'country':'MX','dbId':'','main':False,'networkMode':mode,'locality':'Playa del Carmen','lookupSource':'OpenStreetMap','timetableStatus':'unverified'}
 result['sources']=sources;result.pop('fetchedAt',None)
 compressed=base64.b64encode(gzip.compress(json.dumps(result,ensure_ascii=False,separators=(',',':')).encode(),mtime=0)).decode()
 (ROOT/'lib/mexico-network-data.mjs').write_text('// Generated by scripts/build-mexico-map.py; source licences are retained inside.\nexport default '+json.dumps(compressed)+';\n')
 (ROOT/'public/data/mexico-sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'bytes':len(compressed),'layers':{m:{k:len(v) for k,v in layer.items()} for m,layer in result['layers'].items()},'sources':sources},ensure_ascii=False))
if __name__=='__main__':build(Path(sys.argv[1]))
