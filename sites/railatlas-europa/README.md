# RailAtlas Europa

## AGPLv3 und internationale Kartenhalte (26.10.2026)

Der selbst erstellte Programmcode steht mit Freigabe des Eigentümers unter
**AGPL-3.0-only**. LICENSE und LICENSE_SCOPE.md erklären den Umfang. Der
Quellcode-Link ist direkt im Kopf der App sichtbar; der vollständige Lizenztext
wird mitgeliefert. Fremde Bibliotheken, Karten und Daten behalten ihre Lizenzen.

Der gemeinsame Kartenabruf verwendet jetzt die stabile Transitous/MOTIS-
Haltestellenschnittstelle für alle vorhandenen Verkehrsmittel. Bus umfasst auch
Fernbus. Native GTFS-Quellkennungen und Koordinaten bleiben erhalten; sie werden
nicht als DB-/EFA-Kennungen ausgegeben. Start, Ziel und Zwischenziel verwenden
die bestehende Namens-/Lageprüfung innerhalb eines kleinen Stationskomplexes.

Regionale EFA-Linien und -Halte ergänzen diese Daten. Übereinstimmende Halte
werden anhand von Name und Lage zusammengeführt; unbekannte zusätzliche Halte
bleiben erhalten. Ein Ausfall der Linienquelle entfernt keine gelieferten
Transitous-Halte. Die tatsächlichen Quellen und Attribution sind sichtbar.
Antworten sind auf vier MiB begrenzt; Anbieterpausen beachten Retry-After.

Der echte Node-HTTP-Pfad bestätigt im jeweiligen Testausschnitt sieben Bus-/
Fernbushalte in Heilbronn, zwölf in London, sechs in Amsterdam und zehn in Prag.
Das ist keine Zusage vollständiger Länderabdeckung oder bestätigter Fahrten.
Die experimentellen berechneten Transitous-Linienwege sind weiter ausgeschaltet.
Öffentliche API-Nutzung bleibt auf das nichtkommerzielle Projekt beschränkt.

## Netzabruf und europäische Abdeckung (26.10.2026)

Wesentliches Heranzoomen fragt einen engeren Ausschnitt neu ab. Eine grobe,
unvollständige Netzauswahl wird dabei nicht weiter aus dem Cache übernommen.
`Ausschnitt neu laden` erneuert den gemeinsamen Kartenabruf tatsächlich;
Anbieterpausen bleiben erhalten. Fehlende Netzdaten bestätigen keine fehlende
Busbedienung. Die regionale EFA-Abdeckung und die Verfügbarkeit öffentlicher
Overpass-Dienste genügen weiterhin nicht für ein verlässliches europäisches Netz.

`scripts/probe-transitous.mjs` prüft eine mögliche gemeinsame GTFS-Datenquelle
manuell und mit begrenzten Antworten. Es ist **kein öffentlicher App-Anschluss**.
Bushalte sind in vier Ländern live bestätigt; die experimentellen Heilbronner
Linienwege sind berechnet und werden entsprechend gekennzeichnet. Vor einer
öffentlichen Anbindung verlangt die API eine geeignete Open-Source-Lizenz für
das Projekt. Die Freigabe für AGPLv3 wurde inzwischen erteilt; der stabile
Haltestellenabruf ist oben beschrieben. Beispiele für die separate manuelle Probe:

```bash
node scripts/probe-transitous.mjs 49.138,9.224,49.147,9.243 /tmp/heilbronn-stops.json
```

Quellen und Bedingungen: https://transitous.org/api/ und
https://transitous.org/sources/. Keine Serienabfragen und kein Ersatz fehlender
Quellgeometrie durch Luftlinien. `--routes` ist ein ausdrücklicher, größerer
Prototypabruf des experimentellen Linienendpunkts, kein Laufzeit-Fallback.

## Konsistente Darstellung (26.10.2026)

Automatische Auskunft, Fußweg-Einstellung und Neuplanung folgen der dunklen
Seitenleiste; ihre Auswahlfelder verwenden dieselben Regeln wie Auskunft und
Sortierung. Die helle Kartensteuerung verwendet passende native Schalter.
Fußweg-Notlösungen bleiben durch Text und rote gestrichelte Verläufe erkennbar.

Netzzähler und gezeichnete Ebenen verwenden denselben **sichtbaren Ausschnitt**.
Der größere Ladebereich bleibt im Cache, damit kleine Kartenbewegungen keine
erneute Quellabfrage erfordern. Quelle, Einschränkungen der Linienauswahl und
Ladefehler erscheinen getrennt. Eine gelieferte Linie außerhalb des sichtbaren
Bereichs wird dort nicht mitgezählt. Datenlücken bleiben ausdrücklich offen.

## Allgemeine Buslinien und Halte (26.10.2026)

Die vorhandenen Netzschalter laden Linien und Halte für den sichtbaren
Kartenausschnitt **auch ohne geplante Reise**, ab Zoom 12. Die allgemeine
Netzabfrage verwendet die Karten-/Haltestellen-/Linienfunktionen der bereits
angebundenen EFA-Auskunft; bei fehlenden Daten bleibt OSM/Overpass als weitere
Quelle erhalten. Die Ergebnisquelle steht auf der Karte. Es wird keine Reise
berechnet, um das Netz einzublenden.

Kleine Kartenbewegungen verwenden stabile Ausschnitte und kurzzeitig bereits
geladene Daten. Beim Nachladen und bei Fehlern bleiben vorhandene Netzdaten
sichtbar. Nur Halte zu aktivieren benötigt keine Liniengeometrie. EFA-Halte
behalten ihre Anbieterkennung für Start, Ziel und Zwischenziel.

Die Linienauswahl bleibt begrenzt und wird bei größeren Ausschnitten als
unvollständig gekennzeichnet. Es gibt keine Zusage einer vollständigen
europaweiten Abdeckung oder aktuellen Bedienung. Der gemeldete Ausschnitt
Welsede liefert live Bus 40/45 sowie Mitte und Hanebülten, unabhängig von einer
Reise. Die Overpass-Quelle war bei dieser Prüfung nicht rechtzeitig erreichbar.

## Ausweichoptionen und Neuplanung (25.10.2026)

In der automatischen Auskunft lassen sich zusätzliche **Fußweg-Notlösungen**
einschalten: 15, 30 oder 60 Minuten zu Fuß und höchstens 3 km **je Teilstrecke**.
Die Vorschläge sind vollständige Reisen der EFA-Auskunft, mit tatsächlichen
Fußwegverläufen und erreichbarer Weiterfahrt. Bis zu drei zusätzliche Optionen
erscheinen in der bestehenden Auswahl. Fußwege dieser Optionen sind rot
gestrichelt und zusätzlich als „Fußweg-Notlösung“ beschriftet. Reguläre
Verbindungen bleiben weiterhin vergleichbar.

Start und Ziel werden bei der Koordinatenabfrage innerhalb von 30 Metern
geprüft. Eine nahe Adresse aus der Quelle wird ausdrücklich benannt und nicht
als bestätigte Haltestellen-ID ausgegeben. Fehlende Wege, Budgetüberschreitung,
Ausfälle und Zeitkonflikte ergeben keine nutzbare Notlösung. Bei einem relevanten
ersten Fußweg wird anhand seiner unveränderten Quellgehzeit ein früherer Start
mit mindestens zwei Minuten Reserve zum Einstieg berechnet. Diese Zeiten werden
als berechnet bezeichnet; die Zeiten öffentlicher Verkehrsmittel bleiben
unverändert. Ein Start vor dem angefragten Zeitpunkt ist ausgeschlossen.

„Bei Ausfall: ab einem Halt neu planen“ übernimmt einen ausgewählten Reisehalt.
Bereits gefahrene Abschnitte entfallen, offene Zwischenziele mit Aufenthalten
bleiben erhalten. Datum und Uhrzeit sind anschließend zu prüfen und die Reise
wird über den gemeinsamen API-Pfad neu abgefragt.

Fahrten, die zunächst vom Ziel wegführen, werden nicht geografisch herausgefiltert.
Ein Testnetz belegt die frühere Ankunft nach anfänglicher Rückfahrt. Eine eigene
umfassende Suche über weitere Umstiegspunkte in ganz Europa ist damit noch nicht
implementiert. Die Anbieterabdeckung bleibt regional unterschiedlich.

Die DB-Auskunft wurde vom veröffentlichten Worker mit HTTP 403 abgewiesen.
Der unabhängige Node-Pfad funktioniert für den aufgezeichneten Berliner Fall;
dies ist keine Zusage, dass der normale DB-Fallback auf Sites erreichbar ist.
Es wird keine Sperre umgangen. Die zusätzliche EFA-Fußwegoption ist eine eigene
zulässige Abfrage bei der bereits angebundenen Auskunft.

Parametergrundlage für EFA-Nähe-/Fußwegsuche: [Mentz-Dokumentation über MobiData BW](https://www.mobidata-bw.de/data/Dokumentation-EFA_JSON_Schnittstelle_V2.pdf),
Abschnitte 6.8.6 und 6.9. Keine neuen Zugänge wurden beantragt.

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
- Unabhängige Kartenebenen für Bahn, S-Bahn, U-Bahn, Tram/Stadtbahn und Bus. Linien und Halte sind einzeln schaltbar, Bahn ist voreingeschaltet. Das Bahnnetz nutzt OpenRailwayMap-Schieneninfrastruktur; für kleine sichtbare Ausschnitte ab Zoom 12 liefern die EFA-Kartenfunktionen und ergänzend OSM/Overpass Linien und Halte. Quellenlücken und Fehler werden ausgewiesen. Das Netz ist kein Echtzeitfahrplan.
- Kartenhalte lassen sich direkt als Start, Ziel oder Zwischenziel übernehmen. EFA-Halte behalten ihre Anbieterkennung; OSM-Halte muss die Fahrplanauskunft weiterhin anhand von Name und Lage bestätigen.

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

`npm run build:pages` erzeugt die statische Oberfläche. Sie hat keine voreingestellte ChatGPT-Serveradresse. Für Live-Auskunft in „Live-Auskunft einrichten“ den eigenen HTTPS-Server verbinden; `/api/health` prüft die Kompatibilität. Alternativ beim Build `RAILATLAS_API_ORIGIN` setzen. Die Serveradresse wird nur im eigenen Browser gespeichert; sie enthält keine Zugangsdaten. Ohne Server bleiben Karte, Netzebenen bei erlaubtem Direktzugriff auf deren Quelle und lokaler Stationskatalog nutzbar. GitHub Pages allein kann die serverseitige Fahrplanauskunft nicht ausführen.

### Übernahme von Kartenhalten

OSM-Namen und Fahrplannamen können sich durch den Stadtpräfix oder U-/S-Zusätze unterscheiden. Der vorhandene Stationsresolver berücksichtigt diese Abweichung bei Kartenpunkten nur mit passendem Namen und enger räumlicher Übereinstimmung (maximal 250 Meter). Die konkrete Zuordnung wird im Reiseergebnis angezeigt. Kartenpunkte werden weiterhin nicht ungeprüft als bestätigte Anbieterhaltestellen behandelt.

Die unabhängige Kartenabfrage erlaubt zusätzlich zur Verarbeitungszeit die Warteschlange der Quelle. Nach Zeitablauf oder Anbieterfehler wird pausiert; ein Nutzerabbruch bleibt jederzeit möglich. Die neue Routing-/Abbruchlogik ist automatisiert geprüft, der eigenständige Pfad zusätzlich live gegen ÖBB. Die vollständige visuelle OSM-Netzprüfung ist weiterhin offen; Details stehen in `QA.md`.

### Regionale Halte und automatische Auskunft

Die Standardsuche ergänzt ÖBB/Scotty durch die öffentliche EFA-Auskunft unter
https://www.efa.de/efa/. Namensfremde Online-Vorschläge werden mit dem gemeinsamen
Katalogranking gefiltert. Die Suche berücksichtigt auch den von EFA gelieferten
Gemeindenamen. Stationsanfragen sind begrenzt zwischengespeichert, Fahrten werden
immer neu abgefragt. Anbieterfehler bleiben als Fehler erkennbar.

`efaId`, `vrrId` und ÖBB-/EVA-IDs bleiben getrennt. Die Automatik vergleicht vollständige Verbindungen aus ÖBB und EFA. Wenn keine
nutzbare Verbindung bestätigt wird, kann die ergänzende DB-Auskunft übernehmen.
Endpunkte werden jeweils anhand von Name und Lage eindeutig zugeordnet. Bei einem ÖBB-Kartenhalt ohne eindeutige Stationszuordnung
kann EFA übernehmen. Ausfälle und gesperrte Halte schließen den betreffenden Vorschlag aus. Andere
Auskunftsquellen müssen eine Alternative unabhängig davon positiv bestätigen. Die Ergebnisquelle und abweichend zugeordnete
Endpunktnamen bleiben sichtbar.

Live nachgewiesen am 24.10.2026 für den 26.10.2026 ab 08:00 Europe/Berlin:
Rohdental → Hessisch Oldendorf Bahnhof (Bus 27, 08:18–08:32) sowie
Heilbronn Finanzamt → Rohdental (09:25–15:17, zuletzt Bus 27).
Die unveränderten ersten Quellverbindungen samt Geometrie und Meldungen liegen
komprimiert als Regressionen vor; Einzelheiten stehen in `tests/fixtures/EFA.md`.


### Automatische multimodale Planung

Die Hauptansicht plant Bus, Bahn, S-/U-Bahn, Tram und Fußwege gemeinsam.
ÖBB und EFA liefern vollständige Reisealternativen; der gemeinsame Handler
vergleicht diese, ohne Abschnitte fremder Vorschläge zusammenzusetzen.
Die Anbieterwahl bleibt in den erweiterten Einstellungen erhalten.

Bei einer direkten Reise sind die gelieferten Alternativen mit Zeiten,
Linienfolge, Umstiegen und Gehzeit auswählbar. Eine andere Auswahl ändert
Karte und Reiseverlauf. Die Sortierung nach frühester Ankunft, weniger
Umstiegen oder weniger Fußwegen wirkt auf die verfügbaren Verbindungen.
Unbekannte Gehzeit wird ausdrücklich offen gelassen. Zwischenziele mit
Aufenthalt bleiben als aufeinanderfolgende Teilreisen erhalten.

Die automatische Suche ergänzt die Fahrplankataloge mit OSM-Bushalten über
Photon. Die API erlaubt Suchvorschläge unter angemessener Last; deshalb werden
Anfragen verzögert, begrenzt und Stationsantworten maximal einen Tag gehalten.
Anbieterfehler führen zu einer Pause. Keine Nominatim-Autovervollständigung,
keine Serienabfragen und kein Fahrplanersatz durch OSM.
Quellen: https://github.com/komoot/photon und dessen docs/api-v1.md.
Ein gefundener OSM-Halt ist noch kein Nachweis seiner Fahrplanabdeckung.

Echte Suchantworten aus Großbritannien, den Niederlanden, Norwegen, Tschechien,
Frankreich, Spanien und der Schweiz liegen als Parserregression vor.
Die Zürcher Busverbindung Milchbuck → Bucheggplatz wurde von den bisherigen
Fahrplanquellen nicht bestätigt; daraus wird keine nutzbare Fahrt erfunden.
EFA-Produktklasse 97 wird als Durchbindung behandelt: bei „nicht umsteigen“
bleibt man im Fahrzeug, die folgende Buslinie zählt nicht als neuer Umstieg.


### Späte Abfahrt und ergänzende DB-Auskunft

Die DB-Auskunft ergänzt automatisch fehlende Verbindungen, wenn die beiden
bisherigen Auskünfte keine nutzbare Reise bestätigen. Zugeordnete Halte bleiben
im eigenen Namensraum (`dbStopId`, `db:`); lokale sechsstellige Schlüssel werden
nicht als EVA-Kennungen an andere Anbieter weitergereicht. U-/S-Kennzeichnung,
Straßenabkürzungen und Ortszusätze werden nur mit enger räumlicher Übereinstimmung
(maximal 250 Meter) und passender Verkehrsmittelzuordnung abgeglichen.

Liefert die DB eine tatsächlich leere Verbindungsliste, werden höchstens die
beiden nächsten Kalendertage ab Mitternacht geprüft. Die Datumsschritte benutzen
Europe/Berlin und beachten die Zeitumstellung. Anbieterfehler lösen keine solche
Suche aus. Ein späterer Abfahrtstag erscheint ausdrücklich am Ergebnis.
DB-Suchergebnisse werden weder als Fahrplan-Cache noch als Beispiel-Fallback gespeichert.

Die gewählte DB-Verbindung wird erneut mit verfügbarer Quellgeometrie abgefragt.
Ausfälle, falsche Endpunkte, fehlende Daten und unplausible Anschlüsse bleiben
Ausschlussgründe. Die ausgefallenen S51-Vorschläge der echten Testantwort werden
verworfen; ihre Meldungen bleiben entsprechend als Ausschlussgründe sichtbar.
Für die anderen Alternativen kann die Quelle noch keine Geometrie liefern.

Live nachgewiesen: Rohdental → U Turmstraße (Berlin), für den 24.10.2026 ab
23:17 Uhr angefragt, bestätigte Verbindung am Montag, 26.10.2026, 06:53–12:34:
Bus 27 / Bus 20 / Fußweg / S5 / ICE 553 / Fußweg / Bus 245. Ein früherer Vorschlag
mit S51 fällt laut Quelle aus und wird nicht als nutzbare Verbindung ausgegeben.
Die tatsächlichen DB- und EFA-Antworten liegen als Regressionen unter `tests/fixtures`.
Der öffentliche DB-Webservice ist nicht als garantierte API zugesichert. Die
Abfrageformate wurden mit dem öffentlichen db-vendo-client verglichen:
https://github.com/public-transport/db-vendo-client/tree/main/p/dbweb.
