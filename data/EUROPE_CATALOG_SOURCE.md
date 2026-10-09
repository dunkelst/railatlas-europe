# RailAtlas Europe station catalog

The generated Europe station catalog under `data/locations/` is built from the
Trainline EU `stations` dataset:

- Source: https://github.com/trainline-eu/stations
- Dataset: `stations.csv`
- License: Open Database License (ODbL) 1.0

The upstream dataset combines compatible open sources including OpenStreetMap,
SNCF OpenData, GeoNames, Digitraffic.fi and OpenTransportData.swiss. See the
upstream repository for detailed provenance and licence information.

RailAtlas keeps this discovery catalog separate from its physical rail graph.
Catalog entries can therefore be searchable before a corresponding RailAtlas
routing bundle exists. As real graph bundles are added, stations are cross-walked
using identifiers such as UIC/IFOPT/EVA/operator IDs and coordinates.
