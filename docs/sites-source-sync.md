# Gemeinsamer RailAtlas-Quellstand

Sites-Version **17**, Quellcommit `c77852ce8782fb3b2b0c5d66e05b553b9172ee5a`. **173** Dateien aus diesem Commit liegen bytegleich unter `sites/railatlas-europa`; das generierte `tsconfig.tsbuildinfo` ist ausgenommen. Das Herkunftsmanifest enthält alle SHA-256-Prüfsummen und Git-Blobs. Die GitHub-Paritätsprüfung läuft vor der Installation.

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

Sites wurde nativ als Version 16 bestätigt. Aktuelle Arbeit an den unabhängigen Kartenebenen wird dort abgenommen. GitHub erhält denselben Quellstand, jedoch keinen Verweis als Ersatzanwendung. `npm run build:pages` hat keine fest eingebaute ChatGPT-API.

Die bisherige Pages-Veröffentlichung wird in diesem Schritt erhalten. Eine neue Pages-Veröffentlichung wird manuell mit einer eigenen Serveradresse gestartet. GitHub Pages selbst kann keinen Node-/Worker-Server ausführen. Die Serveradresse ist keine Zugangsinformation; es werden keine Zugangsdaten veröffentlicht.

## Abgleich

1. Gemeinsame Quellen prüfen, alle benötigten Ausgaben bauen und Sites veröffentlichen.
2. Getrackte Dateien desselben Commits übernehmen; Buildausgaben, Laufzeitdaten und Zugangsdaten ausschließen.
3. Herkunftsmanifest und Versionsangabe aktualisieren.
4. Paritätsprüfung, App-Tests, Typprüfung und unabhängigen Build ausführen.
5. Verifizierte Live-Ergebnisse und offene Grenzen getrennt dokumentieren.

Die neue Kartenprüfung ist wegen blockierter CSS und bisher fehlgeschlagener Overpass-Abrufe unvollständig. Dieser Source-Abgleich behauptet keine bestandene visuelle Abnahme der Netzebenen oder ein bereits vorhandenes eigenes öffentliches API-Hosting.

## Aktuelle Fortsetzung

58 App-Tests, TypeScript und drei Builds bestanden. Die Zuordnung von OSM-Kartennamen zu ÖBB-/VRR-Halten ist enger geprüft, einschließlich des echten aufgezeichneten VRR-Namens mit U-Zusatz und des Stations-/Bahnsteigabstands. Ein Live-ÖBB-Test des unabhängigen Node-Pfads mit simulierten Kartennamen funktioniert. Die unabhängige Ausgabe liefert ihre tatsächlichen Styles und Leaflet-Dateien korrekt über HTTP aus. Ein neuer OSM-Netzdownload und die visuelle Live-Abnahme sind weiterhin nicht bestätigt. Der Overpass-Abruf berücksichtigt jetzt Wartezeit und Verarbeitung getrennt von einem bewussten Nutzerabbruch.



## Regionale EFA-Halte

Die Standardsuche verwendet jetzt ÖBB und die tatsächliche öffentliche EFA-
Instanz unter https://www.efa.de/efa/. Rohdental wird mit DHID de:03252:2320
gefunden. Die gleiche Auswahl steuert die Routenplanung in Sites und Node;
ein gemischter ÖBB-/EFA-Endpunkt wird anhand von Name und Lage neu zugeordnet.
ÖBB-Ausfälle und fehlende Fahrten bewirken keinen stillen Quellenwechsel.
Die echte Verbindung Heilbronn Finanzamt → Rohdental für 26.10.2026,
09:25–15:17, endet mit Bus 27. Alle sieben Abschnitte haben Quellgeometrie.
58 App-Tests und drei Builds sind bestanden. Die neue Browserprüfung der
verwalteten Vorschau scheitert an ERR_CONNECTION_REFUSED; die API-Prüfung ist
live erfolgreich. Kein Overpass-Livenachweis wird dadurch behauptet.


Nach Veröffentlichung von Version 16 wurden die öffentlichen Endpunkte der Site
live geprüft: Suche nach Rohdental und Heilbronn Finanzamt sowie die automatische
Route mit gemischtem ÖBB-Start und EFA-Ziel lieferten HTTP 200. Ergebnis:
26.10.2026, 09:25–15:17 Europe/Berlin, sieben Abschnitte bis Bus 27,
vollständige Quellgeometrie und vier Betriebshinweise. Die Namenszuordnung des
ÖBB-Starts zum EFA-Halt erscheint im Ergebnis. Die Browserprüfung bleibt offen;
die verwaltete Vorschau ist nicht erreichbar und eine spätere Tab-Übergabe wurde
durch die Browser-Sicherheitsrichtlinie blockiert.



## Automatische multimodale Fortsetzung (Version 17)

58 App-Tests, TypeScript, Sites-, Pages- und eigenständiger Clientbuild bestanden.
Die Suche verwendet ÖBB, EFA und einen begrenzten OSM/Photon-Haltestellenabruf.
Der gemeinsame Handler vergleicht vollständige Fahrten aus den angebundenen
Auskünften. Die Quellen werden für eine Verbindung nicht aus Einzelabschnitten
zusammengesetzt. Bis zu sechs verfügbare Alternativen lassen sich anhand von
Ankunft, Umstiegen oder Gehzeit ordnen; fehlende Gehzeit bleibt offen.

Der Live-Node-Pfad bestätigt internationale Halte und mehrere EFA-Verbindungen
Rohdental → Heilbronn Finanzamt am 26.10.2026. „Nicht umsteigen“ (EFA-Klasse 97)
zählt nicht als zusätzliche Fahrt oder als weiterer Umstieg.
OSM-Daten belegen keine Bedienung. Die getestete Zürcher Busverbindung ist eine
nachgewiesene Fahrplanlücke; eine europaweit vollständige Betreiberabdeckung
wird nicht behauptet. Die neue visuelle Browserabnahme bleibt technisch offen.


Die Veröffentlichung von Version 17 ist nativ bestätigt. Die öffentlichen
Site-Endpunkte liefern live HTTP 200 für Cibeles/Madrid, Aldwych/London,
Rohdental und Heilbronn Finanzamt. Die automatische Rohdental-Reise für
26.10.2026 ab 06:00 Europe/Berlin liefert drei echte Verbindungen; die erste
fährt 06:53–13:43 mit Bus 27 → Bus 20 (im Fahrzeug bleiben), S5, ICE 785,
RE 8, Fußweg und S4, vier Umstiege. Es wurde keine manuelle Auskunft vorgegeben.
