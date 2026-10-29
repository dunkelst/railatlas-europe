# RailAtlas Europe

Interaktiver Eisenbahnatlas für Europa mit getrennten Ebenen für Infrastruktur, Reiseplanung und Fahrplandaten.

## Aktueller Stand

- OSM-Basiskarte und OpenRailwayMap-Overlay
- Europäischer Standortkatalog mit Stations-/Orts-Autocomplete
- GPS-Standort als Start oder Ziel
- Graph-Auflösung für ausgewählte Katalogorte und GPS-Zugänge
- Echter, bei Deployment aus OSM/PBF erzeugter RailGraph für den Regierungsbezirk Stuttgart
- Automatischer Routing-Smoke-Test für Heilbronn Hbf → Stuttgart Hbf vor Veröffentlichung
- Atlas-, Route- und Zeitplan-Ansichten sowie PWA-Grundlage

**Wichtig:** Der Katalog ist europaweit, die tatsächlich routbare Netzabdeckung ist es noch nicht. Aktuell ist der erste reale Korridor Heilbronn–Stuttgart das Abnahmeziel. Fahrplandaten sind noch nicht angebunden; berechnete Strecken sind keine Live-Verbindungen und enthalten keine Abfahrtszeiten.

## Reproduzierbarer OSM-Graph-Build

```bash
python3 -m pip install -r requirements-builder.txt
bash tools/build_stuttgart_graph.sh
```

Der Build löst den aktuellen Geofabrik-Extrakt des Regierungsbezirks Stuttgart zuerst auf eine **datierte, unveränderliche Snapshot-Datei** auf und lädt anschließend genau diese Datei. Normalerweise geschieht das über das Redirect-Ziel von `stuttgart-regbez-latest.osm.pbf`; falls ein Mirror oder Proxy die stabile `-latest`-URL beibehält, wird die neueste datierte PBF aus Geofabriks eigenem Verzeichnisindex ermittelt. Kann keine datierte Snapshot-URL sicher bestimmt werden, bricht der Build ab. Danach erzeugt er `data/de-bw-stuttgart.graph.json`, führt Graph-QA aus und muss eine verbundene Route zwischen Heilbronn und Stuttgart nachweisen. Derselbe Build läuft vor jedem GitHub-Pages-Deployment und als eigener CI-Gate für relevante Pull Requests.

OSM-Daten: © OpenStreetMap contributors, ODbL 1.0. Geofabrik-Extrakte werden regelmäßig aktualisiert; der erzeugte Graph enthält die tatsächlich verwendete datierte Quelle und das Snapshot-Datum in den Metadaten.

## Ausbauplan

1. Heilbronn → Stuttgart zuverlässig routen und Regressionen absichern
2. weitere echte, benachbarte Graph-Bundles erzeugen und über gemeinsame OSM-Knoten verbinden
3. Nürnberg, Frankfurt, Karlsruhe, Ulm und München ergänzen
4. Infrastruktur-Attribute als auswählbare Karten-Layer bereitstellen
5. Fahrplanadapter (DELFI/GTFS/NeTEx) über stabile Betriebsstellen-IDs anbinden
6. Grenzüberschreitendes Routing und später Echtzeitdaten ausbauen

## GitHub Pages

`.github/workflows/pages.yml` erzeugt und validiert den echten Stuttgart-Graphen und veröffentlicht anschließend die statische Site.
