# RailAtlas Europa

Europäische Reiseplanung für steffen_fun|x mit öffentlicher Testoberfläche und eigenständig startbarem Server. Der frühere feste Demo-Fahrplan wurde vollständig ersetzt.

## Funktionsumfang

- 54.114 katalogisierte Bahnhöfe und Halte aus 38 Ländern, inklusive lokaler Autovervollständigung, Akzentnormalisierung und HN/WÜ-Kürzeln.
- Auswahl per Maus, Touch oder Pfeiltasten/Enter. Lokale Vorschläge erscheinen sofort; ab drei Zeichen ergänzt der Fahrplandienst aktuelle Bahnhöfe und ÖPNV-Haltestellen.
- Browserstandort wird lokal dem nächsten Halt zugeordnet und unmittelbar in Start oder Ziel übernommen. Fünf nahe Halte stehen zur Auswahl. Bei verweigertem Zugriff, Zeitüberschreitung oder fehlender Abdeckung erscheint ein Hinweis; Kartenauswahl bleibt möglich.
- Bis zu fünf Zwischenziele mit Aufenthalten von zehn Minuten bis 24 Stunden. Jede Teilreise wird erst nach tatsächlicher Ankunft und gewähltem Aufenthalt gesucht. Zeitkonflikte, Zugausfälle, falsche Endpunkte und unvollständige Antworten werden verworfen.
- Automatische Stationssuche über ÖBB/Scotty und EFA Deutschland (Region Hannover), mit getrennt auswählbaren ÖBB-, EFA- und VRR/EFA-Auskunftsquellen. Serverabfrage der Fahrplanauskunft für die private Hobby-Nutzung, kein Fahrplan-Zwischenspeicher, begrenzte Antwortzeit und verständlichem Fehlerzustand. Es gibt keinen erfundenen oder hartkodierten Ersatzfahrplan. Die Abdeckung ist je Land und Reisetag unterschiedlich.
- Die Karte zeigt ausschließlich vom Fahrplandienst gelieferte Streckenfragmente (ÖBB GPA / EFA WGS84), einschließlich Bus und Fußwegen. Fehlende Fragmente werden nicht verbunden; bloße Transfer-Luftlinien werden nicht als Weg dargestellt. OSM und optional OpenRailwayMap.
- Bahn, S-Bahn, U-Bahn, Bus, Tram, Fähre und Ersatzbus erhalten eigene Produktkennzeichnungen aus dem ÖBB-Produktprofil. Betreiber, Richtung, Halte, Soll-/Prognosezeiten und Gleis-/Steigänderungen bleiben sichtbar. Nicht bediente Durchfahrts-/Grenzpunkte werden nicht als Fahrplanhalte aufgeführt.
- Meldungen auf Reise-, Abschnitts-, Fahrt-, Fußweg- und Haltebene werden dedupliziert und ihren Gültigkeits-/Ereigniszeiträumen entsprechend angezeigt. Betriebs- und Sperrhinweise bleiben auch bei geschlossenem Reiseverlauf sichtbar. Ausfälle, nicht erreichbare Fahrten und gesperrter Ein-/Ausstieg werden ausgeschlossen. Eine vollständige europaweite Sperrungs- oder Echtzeitabdeckung kann die öffentliche Quelle nicht bestätigen und wird nie behauptet; keine aus Text erratenen Umleitungen. Erneute Suche fragt ohne Fahrplan-Cache neu ab.
- Alle angezeigten Reisezeiten in Europe/Berlin, einschließlich korrektem Tageswechsel und Sommer-/Winterzeit. Die Eingabemaske weist darauf hin.
- Öffentliche Testbereitstellung auf Sites. GitHub enthält dieselbe Oberfläche und dieselbe Anbieter-/Routinglogik für einen eigenen Node-Server; die unabhängige Anwendung benötigt keine ChatGPT-API.
- Unabhängige Kartenebenen für Bahn, S-Bahn, U-Bahn, Tram/Stadtbahn und Bus. Linien und Halte sind einzeln schaltbar, Bahn ist voreingeschaltet. Das Bahnnetz nutzt OpenRailwayMap-Schieneninfrastruktur; OSM-Linienrelationen und Halte werden für kleine sichtbare Ausschnitte ab Zoom 12 über Overpass geladen. Quellenlücken und Fehler werden ausgewiesen. OSM ist kein Echtzeitfahrplan.
- OSM-Halte lassen sich direkt als Start, Ziel oder Zwischenziel übernehmen. Die Fahrplanauskunft muss den Halt weiterhin anhand von Name und Lage bestätigen.

## Daten und Lizenzen

`public/data/stations.json` ist die kompakte, abgeleitete Stationsdatenbank aus [Trainline EU / stations](https://github.com/trainline-eu/stations), unter ODbL 1.0. Die Reihenfolge der Felder ist in `public/data/meta.json` beschrieben. Attributionshinweise, Download und Lizenz stehen in der Website unter „Daten & Hinweise“. Der Katalog enthält auch ÖPNV-Halte und möglicherweise nicht mehr bediente Betriebsstellen. Der Fahrplandienst entscheidet über tatsächlich verfügbare Verbindungen.

Leaflet 1.9.4 liegt lokal unter `public/vendor` inklusive Lizenz. Es werden keine Standortkoordinaten für die Suche an die Fahrplanquelle gesendet; die ausgewählten Bahnhöfe werden bei der Routenanfrage übertragen. Kartenkacheln werden von externen Kartenanbietern geladen.

## Entwicklung und Prüfung

- `node --test tests/*.test.mjs`: Katalogbreite und Ranking, Kürzel und Umlaute, Standortzuordnung, Zeitzonen, aufgezeichnete echte DB-Antworten, Zugausfälle, Endpunktkontrolle und zeitlich erreichbare Zwischenziele.
- `node node_modules/typescript/bin/tsc --noEmit`: Typprüfung.
- `node /root/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/scripts/build-site.mjs`: Sites-Build im vorgesehenen Laufzeitprofil.

Die DB- und ÖBB-Testfixtures sind tatsächlich abgefragte Fahrplanantworten vom 20.10.2026 für Reisen am 21.10.2026. Sie dienen der Parserregression, nicht als Laufzeit-Fallback.

VRR / EFA OpenService: https://www.opendata-oepnv.de/ht/de/api. Der offene Server darf laut Anbieter für Entwicklung, Tests und Hobbyzwecke verwendet werden und kann vom Anbieter für eigene Tests verwendet werden. Ergebnisse und Verfügbarkeit sind eingeschränkt; für einen verlässlichen Produktivzugang ist eine gesonderte Projektfreigabe erforderlich. Keine Serienabfragen und kein Fahrplan-Cache. Explizit nicht im Routing berücksichtigte Störungen führen zum Ausschluss des betroffenen Vorschlags. Die gespeicherte VRR-Testantwort stammt aus einer einzelnen echten Anfrage vom 21.10.2026 für eine Reise am 22.10.2026.

## Eigenständig starten

Node.js ab 22.13 und pnpm 11.25.0. Im Ordner dieser Anwendung:

```bash
pnpm install --frozen-lockfile
npm run build:standalone
npm run start:standalone
```

Danach `http://127.0.0.1:3000` öffnen. Der Node-Server liefert die gebaute Oberfläche und `/api/stations`, `/api/journeys`, `/api/network` aus demselben Prozess. Er verwendet dieselben Anbieterparser und denselben API-Handler wie die Sites-Version. Der Server selbst benötigt nur Node, keine Cloudflare-, ChatGPT- oder Sites-Laufzeit. Ausgehende HTTPS-Verbindungen zu den Fahrplan-/Kartendiensten bleiben erforderlich. `PORT` und `HOST` ändern Port und Bind-Adresse (Standard: 3000 / 127.0.0.1).

Bei einem eigenen HTTPS-Reverse-Proxy `HOST=0.0.0.0` und `PUBLIC_ORIGIN=https://dein-server.example` setzen. `PUBLIC_ORIGIN` gibt den öffentlichen Ursprung für die gleiche CORS-Prüfung vor. TLS wird am Reverse-Proxy terminiert. Für eine separate GitHub-Pages-Oberfläche ist ausschließlich der bestehende GitHub-Ursprung freigegeben.

`npm run build:pages` erzeugt die statische Oberfläche. Sie hat keine voreingestellte ChatGPT-Serveradresse. Für Live-Auskunft in „Live-Auskunft einrichten“ den eigenen HTTPS-Server verbinden; `/api/health` prüft die Kompatibilität. Alternativ beim Build `RAILATLAS_API_ORIGIN` setzen. Die Serveradresse wird nur im eigenen Browser gespeichert; sie enthält keine Zugangsdaten. Ohne Server bleiben Karte, OSM-Netzebenen und lokaler Stationskatalog nutzbar. GitHub Pages allein kann die serverseitige Fahrplanauskunft nicht ausführen.

### Übernahme von Kartenhalten

OSM-Namen und Fahrplannamen können sich durch den Stadtpräfix oder U-/S-Zusätze unterscheiden. Der vorhandene Stationsresolver berücksichtigt diese Abweichung bei Kartenpunkten nur mit passendem Namen und enger räumlicher Übereinstimmung (maximal 250 Meter). Die konkrete Zuordnung wird im Reiseergebnis angezeigt. Kartenpunkte werden weiterhin nicht ungeprüft als bestätigte Anbieterhaltestellen behandelt.

Die unabhängige Kartenabfrage erlaubt zusätzlich zur Verarbeitungszeit die Warteschlange der Quelle. Nach Zeitablauf oder Anbieterfehler wird pausiert; ein Nutzerabbruch bleibt jederzeit möglich. Die neue Routing-/Abbruchlogik ist automatisiert geprüft, der eigenständige Pfad zusätzlich live gegen ÖBB. Die vollständige visuelle OSM-Netzprüfung ist weiterhin offen; Details stehen in `QA.md`.

### Regionale Halte und automatische Auskunft

Die Standardsuche ergänzt ÖBB/Scotty durch die öffentliche EFA-Auskunft unter
https://www.efa.de/efa/. Namensfremde Online-Vorschläge werden mit dem gemeinsamen
Katalogranking gefiltert. Die Suche berücksichtigt auch den von EFA gelieferten
Gemeindenamen. Stationsanfragen sind begrenzt zwischengespeichert, Fahrten werden
immer neu abgefragt. Anbieterfehler bleiben als Fehler erkennbar.

`efaId`, `vrrId` und ÖBB-/EVA-IDs bleiben getrennt. Sobald ein EFA-Halt gewählt ist,
plant die automatische Auskunft über EFA und ordnet den anderen Endpunkt anhand
von Name und Lage zu. Bei einem ÖBB-Kartenhalt ohne eindeutige Stationszuordnung
kann EFA übernehmen. Ausfälle, fehlende Verbindungen und Anbieterfehler lösen
keinen stillen Anbieterwechsel aus. Die Ergebnisquelle und abweichend zugeordnete
Endpunktnamen bleiben sichtbar.

Live nachgewiesen am 24.10.2026 für den 26.10.2026 ab 08:00 Europe/Berlin:
Rohdental → Hessisch Oldendorf Bahnhof (Bus 27, 08:18–08:32) sowie
Heilbronn Finanzamt → Rohdental (09:25–15:17, zuletzt Bus 27).
Die unveränderten ersten Quellverbindungen samt Geometrie und Meldungen liegen
komprimiert als Regressionen vor; Einzelheiten stehen in `tests/fixtures/EFA.md`.
