# Gemeinsamer RailAtlas-Quellstand

Sites-Version **15**, Quellcommit `bcc597d12e51b92b3c50a416a6747a1befb43185`. **161** Dateien aus diesem Commit liegen bytegleich unter `sites/railatlas-europa`; das generierte `tsconfig.tsbuildinfo` ist ausgenommen. Das Herkunftsmanifest enthält alle SHA-256-Prüfsummen und Git-Blobs. Die GitHub-Paritätsprüfung läuft vor der Installation.

| Bestandteil | Sites | Eigenständiger Node-Server | GitHub Pages |
| --- | --- | --- | --- |
| Oberfläche | gemeinsame React-Dateien | dieselben Dateien | dieselben Dateien |
| Styles/Katalog/Leaflet | lokale Assets | lokale Assets | Assets mit Repository-Präfix |
| API | `lib/api.mjs` | derselbe Handler | eigener Server, ausdrücklich konfiguriert |
| Anbieterparser | gemeinsame Module | dieselben Module | über den eigenen Server |
| OSM-Netzebenen | API zur OSM-Quelle | derselbe API-Pfad | eigene API oder direkter OSM-Abruf |

## Eigenständig ausführen

```bash
npm run install:app
npm run test:app
npm run build:standalone
npm run start:standalone
```

Danach http://127.0.0.1:3000 öffnen. Node ab 22.13, pnpm 11.25.0. Für den eigenständigen Server sind keine Sites-/Cloudflare-/ChatGPT-Dienste erforderlich. Er nutzt nur die Anbieter- und Kartendatenquellen. Bei HTTPS über einen eigenen Reverse-Proxy `PUBLIC_ORIGIN` auf den öffentlichen Ursprung setzen; `HOST=0.0.0.0` erlaubt Bindung im eigenen Container/Host. Standard ist lokale Bindung.

## Veröffentlichung

Sites wurde nativ als Version 14 bestätigt. Aktuelle Arbeit an den unabhängigen Kartenebenen wird dort abgenommen. GitHub erhält denselben Quellstand, jedoch keinen Verweis als Ersatzanwendung. `npm run build:pages` hat keine fest eingebaute ChatGPT-API.

Die bisherige Pages-Veröffentlichung wird in diesem Schritt erhalten. Eine neue Pages-Veröffentlichung wird manuell mit einer eigenen Serveradresse gestartet. GitHub Pages selbst kann keinen Node-/Worker-Server ausführen. Die Serveradresse ist keine Zugangsinformation; es werden keine Zugangsdaten veröffentlicht.

## Abgleich

1. Gemeinsame Quellen prüfen, alle benötigten Ausgaben bauen und Sites veröffentlichen.
2. Getrackte Dateien desselben Commits übernehmen; Buildausgaben, Laufzeitdaten und Zugangsdaten ausschließen.
3. Herkunftsmanifest und Versionsangabe aktualisieren.
4. Paritätsprüfung, App-Tests, Typprüfung und unabhängigen Build ausführen.
5. Verifizierte Live-Ergebnisse und offene Grenzen getrennt dokumentieren.

Die neue Kartenprüfung ist wegen blockierter CSS und bisher fehlgeschlagener Overpass-Abrufe unvollständig. Dieser Source-Abgleich behauptet keine bestandene visuelle Abnahme der Netzebenen oder ein bereits vorhandenes eigenes öffentliches API-Hosting.

## Aktuelle Fortsetzung

46 App-Tests, TypeScript und drei Builds bestanden. Die Zuordnung von OSM-Kartennamen zu ÖBB-/VRR-Halten ist enger geprüft, einschließlich des echten aufgezeichneten VRR-Namens mit U-Zusatz und des Stations-/Bahnsteigabstands. Ein Live-ÖBB-Test des unabhängigen Node-Pfads mit simulierten Kartennamen funktioniert. Die unabhängige Ausgabe liefert ihre tatsächlichen Styles und Leaflet-Dateien korrekt über HTTP aus. Ein neuer OSM-Netzdownload und die visuelle Live-Abnahme sind weiterhin nicht bestätigt. Der Overpass-Abruf berücksichtigt jetzt Wartezeit und Verarbeitung getrennt von einem bewussten Nutzerabbruch.
