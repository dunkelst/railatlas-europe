# Abgleich des produktiven Sites-Standes

Der Ordner `sites/railatlas-europa` enthält den Quellstand der privaten Sites-Version 8 vom 20.10.2026, Commit `c3dc4c8ae65aa380363fbadc601f31f5b1e50c0b`. Er entspricht den dort eingecheckten Dateien; ausschließlich das generierte `tsconfig.tsbuildinfo` ist ausgenommen. Die bytegenaue Herkunft jeder Datei ist in `sites-source-manifest.json` festgehalten.

Die Anwendung braucht einen Server für `/api/journeys` und `/api/stations`. GitHub Pages kann diese Serverauskunft nicht ausführen. Der vorhandene statische Atlas und die Graph-/OSM-Werkzeuge im Repository bleiben bei diesem Quellabgleich erhalten. Eine Migration dieser Werkzeuge ist nicht Bestandteil des Syncs.

## Starten und prüfen

Die Projektwerkzeuge benötigen Linux, Node.js ab 22.13, pnpm 11.25.0 bzw. Corepack, GNU timeout und flock. Der installierte pnpm-Stand wird überprüft; das Lockfile bleibt maßgeblich.

```bash
cd sites/railatlas-europa
npm run install:ci
node --test tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
npm run dev
```

Ohne checkout-lokales Sites-Ausführungsprofil verwenden die Framework-Skripte den portablen Vinext-Modus. Die lokale Vorschau verwendet Testauthentifizierung. Sie ist kein Nachweis für privaten Zugriff im Internet; die echte Sites-Veröffentlichung benötigt die vom Hosting bereitgestellte Anmeldung. Keine Vorschau ungeschützt als Produktivwebsite veröffentlichen.

Die Root-Regressionen für die vorhandene Graph-Pipeline laufen weiterhin mit `npm test`. Die CI führt zusätzlich die eigenständigen Fahrplan-/Geometrie-/Störungsregressionen des Sites-Standes aus. Sie veröffentlicht die Sites-Anwendung nicht.

## Quellen und bestätigte Grenzen

- Fahrplan und gelieferte Streckenverläufe: ÖBB / Scotty. Zusätzliche HimSearch-Meldungen für Start und Ziel werden zeitlich und anhand der gelieferten Reisehalte zugeordnet.
- Stationskatalog: Trainline EU / stations, ODbL 1.0; Lizenz und Herkunft liegen zusammen mit dem Katalog unter `public/data`.
- DB-Verbindungen sind über die Fahrplanauskunft enthalten, jedoch keine gesonderte direkte DB- oder VBB/Fahrinfo-Anbindung. Die DB-Prüflinks sind Verweise zur externen Auskunft.
- Fehlende Streckengeometrie wird nicht durch eine selbst gezeichnete Verbindung ersetzt. Es gibt keinen erfundenen Ersatzfahrplan.
- Die Echtzeit-/Sperrungsabdeckung bleibt partiell. Fehlende Meldungen bedeuten keine bestätigte Störungsfreiheit. Die konkreten ausgeführten Live-Prüfungen und ihre Grenzen stehen in `QA.md`.

## Veröffentlichungsverhalten

Der bestehende Pages-Workflow veröffentlicht bei einem Push auf `main` das Repository als statische Seite. Deshalb liegt dieser Sync auf einem Feature-Branch mit Pull Request. Die Sites-Website bleibt unter ihrer vorhandenen URL und ihrer unveränderten Eigentümerfreigabe erreichbar. Ein Merge oder eine spätere Pages-Änderung ist gesondert zu beurteilen; insbesondere ist die servergestützte Sites-App kein statischer Pages-Ersatz.
