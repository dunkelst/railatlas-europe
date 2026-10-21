# Abgleich des produktiven Sites-Standes

Der Ordner `sites/railatlas-europa` enthält den Quellstand der privaten Sites-Version 10 vom 21.10.2026, Commit `8a33978826e2ff0379363acb471196a8777c8154`. Er entspricht den dort eingecheckten Dateien; ausschließlich das generierte `tsconfig.tsbuildinfo` ist ausgenommen. Die bytegenaue Herkunft jeder Datei ist in `sites-source-manifest.json` festgehalten.

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

- Fahrplan und gelieferte Streckenverläufe: auswählbar ÖBB / Scotty oder VRR / EFA OpenService (privater Hobbyzugang, keine garantierte Produktivverfügbarkeit). Zusätzliche HimSearch-Meldungen für Start und Ziel werden zeitlich und anhand der gelieferten Reisehalte zugeordnet.
- Stationskatalog: Trainline EU / stations, ODbL 1.0; Lizenz und Herkunft liegen zusammen mit dem Katalog unter `public/data`.
- DB-Verbindungen sind über die Fahrplanauskunft enthalten, jedoch keine gesonderte direkte DB- oder VBB/Fahrinfo-Anbindung. Die DB-Prüflinks sind Verweise zur externen Auskunft. EFA-BW und Trainline Partner Solutions bleiben bis zu einem freigegebenen Zugang unverbunden.
- Fehlende Streckengeometrie wird nicht durch eine selbst gezeichnete Verbindung ersetzt. Es gibt keinen erfundenen Ersatzfahrplan.
- Die Echtzeit-/Sperrungsabdeckung bleibt partiell. Fehlende Meldungen bedeuten keine bestätigte Störungsfreiheit. Die konkreten ausgeführten Live-Prüfungen und ihre Grenzen stehen in `QA.md`.

## Veröffentlichungsverhalten

Die GitHub-Pages-Adresse führt zur aktuellen privaten Sites-App weiter. Der Workflow veröffentlicht nur den aus dem Herkunftsmanifest erzeugten Einstieg und einen Ablösungsmechanismus für den früheren Service Worker. Die Anmeldung der privaten App bleibt erforderlich; es gibt keine öffentliche Kopie des Serverdienstes. Der frühere statische Atlas und die Graph-/OSM-Pipeline werden als Quellcode erhalten.

Im Repository-Stamm starten `npm run install:app`, `npm run dev`, `npm run build`, `npm run start` und `npm run test:app` die aktuelle App beziehungsweise ihre Werkzeuge. Die bestehende Graph-Regression bleibt unter `npm test` erhalten.
