# Gemeinsamer RailAtlas-Quellstand

Sites-Version **20**, Quellcommit `9e4953340c2fb3a0afc23beac2275b2e597e6e50`.
**185** Dateien dieses Commits liegen bytegleich unter `sites/railatlas-europa`;
das generierte `tsconfig.tsbuildinfo` ist ausgenommen. Das Herkunftsmanifest
enthält Git-Blobs, SHA-256 und Dateigrößen. Die Paritätsprüfung läuft vor der
Installation in GitHub CI. Der Dokumentationscommit selbst ersetzt keinen
abweichenden App-Quellstand.

| Bestandteil | Sites | Eigenständiger Node-Server | GitHub Pages |
| --- | --- | --- | --- |
| Oberfläche | gemeinsame React-Dateien | dieselben Dateien | dieselben Dateien |
| Styles/Katalog/Leaflet | lokale Assets | lokale Assets | Assets mit Repository-Präfix |
| API | `lib/api.mjs` | derselbe Handler | ausdrücklich eingerichteter eigener Server |
| Anbieterparser | gemeinsame Module | dieselben Module | über den eigenen Server |
| OSM-Netze | gemeinsame API | derselbe API-Pfad | eigene API oder direkter OSM-Abruf |

## Ausführen

Node ab 22.13, pnpm 11.25.0. Im Repository:

```bash
npm run install:app
npm run test:app
npm run build:standalone
npm run start:standalone
```

Danach http://127.0.0.1:3000 öffnen. Der gebaute eigenständige Server benötigt
keinen Sites-/Cloudflare-/ChatGPT-Dienst. Ausgehende Verbindungen zu tatsächlichen
Fahrplan- und Kartendatenquellen bleiben notwendig. Bei eigenem HTTPS-Reverse-Proxy
`PUBLIC_ORIGIN` auf den öffentlichen Ursprung setzen. `HOST=0.0.0.0` erlaubt die
Bindung im eigenen Container; Standard ist lokale Bindung.

## Tatsächlich geprüft

- 72 App-Regressionen, TypeScript, Worker-, Pages- und Standalone-Clientbuild.
- Version 20 wurde nativ veröffentlicht; die vorhandene öffentliche Testfreigabe
  blieb erhalten: https://railatlas-europa.cocoaamber33.chatgpt.site .
- Öffentliche API und eigener Node-HTTP-Pfad: je HTTP 200 und drei Fußweg-Optionen
  für Rohdental → Berliner Zielpunkt bei U Turmstraße am 26.10.2026, erste Reise
  06:53–12:49 Europe/Berlin. Bus 27/20, S5, ICE 553, S7 und echte Quellfußwege.
- Öffentliche API und Node: Tannenweg → Punkt am Bahnhof Hessisch Oldendorf,
  drei Optionen; erste 06:45–07:14. Erster Gehweg 341 m/sechs Minuten, berechneter
  früherer Start für zwei Minuten Reserve, unveränderte Busabfahrt 06:53.
- Gebaute eigenständige JS-/CSS-/Leaflet-Dateien liefern HTTP 200 mit richtigen
  MIME-Typen. Eine neue visuelle Browserabnahme wird damit nicht behauptet.

## Veröffentlichungsgrenzen

Die bestehende Pages-Veröffentlichung entspricht weiterhin Version 12. Sie wird
nicht automatisch durch einen neuen Client ohne eigenen HTTPS-Auskunftsserver
ersetzt. Der Pages-Workflow bleibt manuell. Der Quellstand ist aktuell und
selbständig startbar; ein eigenständiger öffentlicher API-Server wurde hier nicht
angelegt. Keine voreingestellte ChatGPT-API im neuen Pages-Build und keine
Weiterleitung als Ersatzanwendung.

DB wurde vom Worker mit HTTP 403 abgewiesen, während der unabhängige Node-Pfad
für den aufgezeichneten Fall funktioniert. Dieser Zugriffsgrenze wird nicht
über Proxies oder andere Identitäten ausgewichen. EFA-Fußwegoptionen sind eine
eigenständige Abfrage der bereits angebundenen Quelle.

Die visuelle Abnahme der neuen Bedienelemente ist offen. Die zuvor fehlgeschlagene
verwaltete Vorschau und Browser-Sicherheitsgrenze wurden nicht umgangen.
Echtzeit-/Sperrungsabdeckung und europaweite ÖPNV-Abdeckung bleiben partiell.
[Ausweichplanung und nächster Ausbau](routing-resilience.md).
