# RailAtlas Europa

[**RailAtlas öffnen**](https://railatlas-europa.cocoaamber33.chatgpt.site) · [Quellstand und Abgleich](docs/sites-source-sync.md)

Der gemeinsame Stand entspricht Sites-Version **14**, Quellcommit `31171b052fd0f815f6eddf40f3014cb8f7ca6219`. Die Anwendung enthält 54.114 Katalogeinträge aus 38 Ländern, Bahnhofssuche, Standort-/Kartenauswahl, Zwischenziele mit Aufenthalt und echte europäische Fahrplanabfragen. Die eigenständig startbare Ausgabe verwendet keinen ChatGPT-Server.

## Netzebenen

Bahn, S-Bahn, U-Bahn, Tram/Stadtbahn und Bus haben getrennte Schalter für Linien und Halte. Bahn ist voreingeschaltet. Das Bahnnetz zeigt OpenRailwayMap-Schieneninfrastruktur; die übrigen Linien sowie Halte kommen aus OSM für kleine sichtbare Ausschnitte ab Zoom 12. Haltestellen können als Start, Ziel oder Zwischenziel übernommen werden. Die Fahrplanauskunft muss sie danach anhand von Name und Lage bestätigen.

OSM ist kein Fahrplan und bestätigt keinen aktuellen Betrieb. Fehlende Geometrie bleibt offen. S-Bahn setzt eine entsprechende Routenkennzeichnung voraus; gemeinsame Bahnhöfe können mehreren Ebenen angehören. Anbieterfehler bleiben sichtbar und führen zu einer Abfragepause.

## Eigenstaendig starten

Node.js ab 22.13 und pnpm 11.25.0. Der Bau benötigt die im Lockfile festgelegten Abhängigkeiten; der gebaute Server selbst benötigt nur Node.

```bash
npm run install:app
npm run build:standalone
npm run start:standalone
```

Danach **http://127.0.0.1:3000** öffnen. Oberfläche und alle APIs laufen aus demselben Prozess. Die Anbieterparser und der API-Handler sind dieselben wie auf Sites; es gibt keine zweite Routinglogik und keinen Rückfall auf eine ChatGPT-Seite.

`PORT` und `HOST` ändern Port und Bind-Adresse. Beim eigenen HTTPS-Reverse-Proxy `HOST=0.0.0.0` und `PUBLIC_ORIGIN=https://dein-server.example` setzen. TLS übernimmt der Reverse-Proxy. Ausgehende HTTPS-Verbindungen zu ÖBB/VRR und Kartendiensten bleiben erforderlich.

## GitHub Pages

`npm run build:pages` erzeugt dieselbe Oberfläche als statische Ausgabe. Es ist **keine ChatGPT-Serveradresse voreingestellt**. Für Live-Auskunft den eigenen HTTPS-Server in „Live-Auskunft einrichten“ verbinden oder beim Bau `RAILATLAS_API_ORIGIN` setzen. Karte, OSM-Netzebenen und der lokale Bahnhofskatalog funktionieren ohne Auskunftsserver. Pages kann die serverseitigen Anbieterabfragen selbst nicht ausführen.

Die bestehende [Pages-Veröffentlichung](https://dunkelst.github.io/railatlas-europe/) wurde bei diesem Source-Abgleich bewusst nicht ersetzt und entspricht noch Version 12 mit der damaligen gemeinsamen API. Der Pages-Workflow ist jetzt manuell und verlangt die eigene Serveradresse, damit beim Abgleich keine bestehende Live-Auskunft durch eine unkonfigurierte Veröffentlichung ersetzt wird. Aktueller Abnahmeort ist der oben verlinkte RailAtlas. Ein eigenständiger öffentlicher Auskunftsserver wurde hier nicht angelegt.

## Prüfung und aktuelle Grenzen

- **42 App-Regressionen**, TypeScript sowie Worker-, Pages- und eigenständiger Clientbuild bestanden.
- Neuer echter lokaler HTTP-Servertest einschließlich Dateien, Health, CORS, JSON-, Datums- und Größenfehlern.
- Veröffentlichte ÖBB-Auskunft: Wien Karlsplatz → Stephansplatz am 24.10.2026, U1 18:27–18:29, Wiener Linien, einschließlich eines gelieferten Bauhinweises.
- Die neue Kartenoberfläche ist funktional eingebaut. Ihre vollständige visuelle Live-Abnahme ist offen: CSS-Anfragen werden der Prüfumgebung mit HTTP 403 / Cloudflare 1010 verweigert; die CSS-Dateien sind im Paket vorhanden. Neue Overpass-Livedaten waren hier noch nicht erfolgreich bestätigt. Quellenfehler werden nicht mit Beispieldaten verdeckt.
- Sperrungs-/Echtzeitabdeckung bleibt partiell. VRR / EFA ist ein Testzugang ohne garantierte Verfügbarkeit. EFA-BW, direkter DB-/VBB-Zugang und Trainline Partner Solutions sind nicht angeschlossen.
- [Gemeinsamer Prüfstand](sites/railatlas-europa/QA.md) · [Fortführungsstand](docs/continuation-2026-10-24.md)

`node tools/verify-sites-source.mjs` prüft die 161 übernommenen Dateien gegen das Herkunftsmanifest. `npm run test:app` führt die aktuellen App-Regressionen aus. Die bestehende OSM-/Graph-Pipeline, ihre Daten und Regressionen bleiben erhalten; `npm test` führt deren Node-/Python-Prüfungen aus. Stationskatalog: Trainline EU / stations, ODbL 1.0; Lizenzen liegen unter `sites/railatlas-europa/public`.
