#!/usr/bin/env python3
"""Read a public Geofabrik PBF once per entity type; retain original OSM data.

Build-only dependency: osmium>=4,<5 (same as the repository's existing builder).
Usage: python scripts/extract-mexico-transit.py source.osm.pbf output.json.gz
"""
import gzip,json,sys,time
from pathlib import Path
import osmium

path=Path(sys.argv[1]);output=Path(sys.argv[2]);started=time.time()
relations=[];way_ids=set();node_ids=set()
for r in osmium.FileProcessor(path,entities=osmium.osm.RELATION).with_filter(osmium.filter.TagFilter(('type','route'))):
 tags=dict(r.tags)
 if tags.get('route') not in ['bus','trolleybus','minibus','share_taxi','train','light_rail','subway','tram']:continue
 members=[{'type':{'n':'node','w':'way','r':'relation'}[m.type],'ref':m.ref,'role':m.role} for m in r.members]
 relations.append({'type':'relation','id':r.id,'tags':tags,'members':members})
 for m in members:
  if m['type']=='way':way_ids.add(m['ref'])
  elif m['type']=='node':node_ids.add(m['ref'])
print(json.dumps({'phase':'relations','relations':len(relations),'waysNeeded':len(way_ids),'seconds':round(time.time()-started)}),flush=True)
ways=[]
for w in osmium.FileProcessor(path,entities=osmium.osm.WAY).with_filter(osmium.filter.IdFilter(way_ids)):
 nodes=[n.ref for n in w.nodes];node_ids.update(nodes);ways.append({'type':'way','id':w.id,'tags':dict(w.tags),'nodes':nodes})
print(json.dumps({'phase':'ways','ways':len(ways),'nodesNeeded':len(node_ids),'seconds':round(time.time()-started)}),flush=True)
nodes={}
for n in osmium.FileProcessor(path,entities=osmium.osm.NODE).with_filter(osmium.filter.IdFilter(node_ids)):
 if n.location.valid():nodes[n.id]={'type':'node','id':n.id,'lat':n.location.lat,'lon':n.location.lon,'tags':dict(n.tags)}
tags=[('highway','bus_stop'),('amenity','bus_station'),('railway','station'),('railway','halt'),('railway','tram_stop'),('public_transport','platform'),('public_transport','stop_position'),('amenity','taxi')]
for n in osmium.FileProcessor(path,entities=osmium.osm.NODE).with_filter(osmium.filter.TagFilter(*tags)):
 if n.location.valid():nodes[n.id]={'type':'node','id':n.id,'lat':n.location.lat,'lon':n.location.lon,'tags':dict(n.tags)}
with osmium.io.Reader(str(path)) as reader:timestamp=reader.header().get('osmosis_replication_timestamp')
data={'version':'0.6','generator':'RailAtlas / pyosmium','sourceDate':timestamp or '2026-10-27','elements':[*nodes.values(),*ways,*relations]}
with gzip.open(output,'wt',encoding='utf8') as target:json.dump(data,target,ensure_ascii=False,separators=(',',':'))
print(json.dumps({'phase':'complete','nodes':len(nodes),'ways':len(ways),'relations':len(relations),'bytes':output.stat().st_size,'sourceDate':data['sourceDate'],'seconds':round(time.time()-started)}),flush=True)
