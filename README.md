# RailAtlas Europa

[**RailAtlas öffnen**](https://railatlas-europa.cocoaamber33.chatgpt.site) · [Quellstand und Abgleich](docs/sites-source-sync.md)

Der gemeinsame Stand entspricht Sites-Version **21**, Quellcommit `6e7635875f32a0dc037d1fd9038b0661f8ee289e`. Die Anwendung enthält 54.114 Katalogeinträge aus 38 Ländern, Bahnhofssuche, Standort-/Kartenauswahl, Zwischenziele mit Aufenthalt und echte europäische Fahrplanabfragen. Die eigenständig startbare Ausgabe verwendet keinen ChatGPT-Server.

## Neu in Version 21: Busnetz ohne geplante Reise

**Bus → Linien / Halte** zeigt ab Zoom 12 das allgemeine Netz im sichtbaren
Kartenausschnitt. Dafür wird keine Reise berechnet. Die Kartenfunktionen der
bereits angebundenen EFA-Auskunft liefern Halte, Linienzuordnung und tatsächliche
Liniengeometrie; OSM/Overpass bleibt eine ergänzende Quelle. Die Quelle steht
beim Netz. EFA-Halte behalten ihre Kennung für Start, Ziel und Zwischenziel.

Der gemeldete Ausschnitt Welsede liefert live die Buslinien **40 und 45** sowie
**Mitte und Hanebülten**, im erweiterten Clientausschnitt auch **Jägereiche**.
Stabile Ausschnitte, begrenzte Caches und verzögerte Abfragen vermeiden neue
Quellabfragen bei jeder kleinen Bewegung. Geladene Daten bleiben beim Nachladen
und bei Fehlern sichtbar. Nur Halte zu aktivieren benötigt keine Liniengeometrie.

**80 App-Tests, TypeScript und alle drei Builds bestanden.** Der echte
unabhängige Node-HTTP-Pfad und die öffentliche Version-21-API bestätigen
`/api/network` mit HTTP 200 ohne Fahrtsuche. Auch das ausgelieferte HTML
enthält den Hinweis auf das allgemeine Netz. Die visuelle Browserabnahme ist offen: Die Erweiterung war in
dieser Sitzung nicht verfügbar. Linienauswahl und europäische Abdeckung bleiben
partiell; eine Netzlinie bestätigt keinen aktuellen Betrieb. Die bisherige
Overpass-Quelle war bei einer kleinen Diagnoseabfrage nicht rechtzeitig erreichbar.

## Seit Version 20: Ausweichen und unterwegs neu planen

In der automatischen Auskunft lassen sich **Fußweg-Notlösungen** einschalten:
15, 30 oder 60 Minuten und maximal 3 km **je Teilstrecke**. Zusätzliche vollständige
Reisen erscheinen in der bestehenden Auswahl. Ihre Fußwege sind rot gestrichelt
und mit Text sowie Gehzeit/-strecke gekennzeichnet. Die Quelle berechnet die Wege;
Endpunkte müssen innerhalb von 30 Metern liegen. Fehlende Wege, Ausfälle und
Zeitkonflikte bleiben Ausschlussgründe.

Ein erster Gehweg wird mit unveränderter Quellgehzeit früher eingeplant, wenn
sonst die zwei Minuten Reserve zum Einstieg fehlen. Berechnete Fußwegzeiten sind
gekennzeichnet; Bus- und Zugzeiten bleiben unverändert. Die angefragte früheste
Abfahrt wird eingehalten. Das Menü **„Bei Ausfall: ab einem Halt neu planen“**
übernimmt einen Reisehalt und behält offene Zwischenziele samt Aufenthalt.

Live auf Version 20 und über den unabhängigen Node-HTTP-Pfad bestätigt:

- Rohdental → gewählter Berliner Punkt nahe U Turmstraße, 26.10.2026,
  **06:53–12:49**, drei auswählbare Fußweg-Optionen. Erster Vorschlag:
  Bus 27/20, S5, ICE 553, S7 und Fußwege; 29 Minuten zu Fuß insgesamt.
- Tannenweg → Punkt am Bahnhof Hessisch Oldendorf, 26.10.2026,
  **06:45–07:14**, drei Optionen. Erster Gehweg 341 m/sechs Minuten,
  zwei Minuten Reserve, Bus 27 unverändert um 06:53, danach Quellfußweg.

Beide öffentlichen API-Aufrufe lieferten HTTP 200. S51 wurde nicht als nutzbare
Alternative ausgegeben. Statuslisten und die tatsächlich gelieferte
informative-only-Kennzeichnung werden berücksichtigt; Ausschlusshinweise bleiben
sichtbar. **72 App-Tests, TypeScript und alle drei Builds bestanden.**

Anfängliche Fahrten vom Ziel weg werden nicht geografisch verworfen; ein
künstliches Testnetz belegt deren frühere Ankunft. Die gezielte eigene Suche über
weitere Umstiegspunkte ist noch auszubauen. Vollständige europäische Abdeckung
und eine neue visuelle Browserabnahme sind nicht bestätigt. Die DB-403-Grenze
wird nicht umgangen. [Ausbau und Grenzen](docs/routing-resilience.md).

## Automatische Reiseplanung mit Bus, Bahn und Nahverkehr

Start, Ziel und Zeit genügen; die Hauptansicht vergleicht vollständige ÖBB-/EFA-
Verbindungen automatisch. Mehrere verfügbare Alternativen zeigen Linienfolge,
Umstiege, Gehzeit und Abfahrt/Ankunft. Auswahl und Sortierung nach frühester
Ankunft, weniger Umstiegen oder weniger Fußwegen steuern Karte und Reiseverlauf.
Die manuelle Anbieterwahl bleibt in den erweiterten Einstellungen verfügbar.
Zwischenziele mit Aufenthalt bleiben erhalten.

Die allgemeine Bushaltestellensuche ergänzt die Kataloge durch OSM/Photon.
Echte Suchantworten aus GB, NL, NO, CZ, FR, ES und CH sind geprüft. Ein OSM-Halt
bestätigt noch keinen verfügbaren Fahrplan: Zürich Milchbuck → Bucheggplatz
wurde von den bisherigen Quellen nicht bestätigt und bleibt eine Datenlücke.
Die reale EFA-Durchbindung Bus 27 → 20 wird als „im Fahrzeug bleiben“ behandelt,
mit korrekter Umstiegszählung.

## Regionale Halte und automatische Auskunft

Die Standardsuche kombiniert ÖBB/Scotty und EFA Deutschland (Region Hannover).
Dadurch wird auch **Rohdental (Hessisch Oldendorf)** gefunden. Verbindungen mit
ausgewählten EFA-Halten werden über EFA geplant; Anbieter-IDs bleiben getrennt.
ÖBB, EFA und der bestehende VRR-Testzugang sind weiterhin einzeln wählbar.

Live über den gemeinsamen eigenständigen API-Pfad geprüft: **Heilbronn Finanzamt
→ Rohdental am 26.10.2026, 09:25–15:17**, S4 / Fußweg / RE 8 / ICE 682 / RE2 /
RB77 / Bus 27, mit Quellgeometrie und Betriebshinweisen. Keine Fahrplan-Fixture
wird als Laufzeitersatz verwendet.

## Netzebenen

Bahn, S-Bahn, U-Bahn, Tram/Stadtbahn und Bus haben getrennte Schalter für Linien und Halte. Bahn ist voreingeschaltet. Das Bahnnetz zeigt OpenRailwayMap-Schieneninfrastruktur; Linien und Halte kommen aus EFA-Kartenfunktionen und ergänzend OSM/Overpass für kleine sichtbare Ausschnitte ab Zoom 12. Haltestellen können als Start, Ziel oder Zwischenziel übernommen werden. EFA-Kennungen bleiben erhalten; OSM-Halte muss die Fahrplanauskunft anhand von Name und Lage bestätigen.

OSM ist kein Fahrplan und bestätigt keinen aktuellen Betrieb. Fehlende Geometrie bleibt offen. S-Bahn setzt eine entsprechende Routenkennzeichnung voraus; gemeinsame Bahnhöfe können mehreren Ebenen angehören. Anbieterfehler bleiben sichtbar und führen zu einer Abfragepause.

## Eigenstaendig starten

Node.js ab 22.13 und pnpm 11.25.0. Der Bau benötigt die im Lockfile festgelegten Abhängigkeiten; der gebaute Server selbst benötigt nur Node.

```bash
npm run install:app
npm run build:standalone
npm run start:standalone
```

Danach **http://127.0.0.1:3000** öffnen. Oberfläche und alle APIs laufen aus demselben Prozess. Die Anbieterparser und der API-Handler sind dieselben wie auf Sites; es gibt keine zweite Routinglogik und keinen Rückfall auf eine ChatGPT-Seite.

`PORT` und `HOST` ändern Port und Bind-Adresse. Beim eigenen HTTPS-Reverse-Proxy `HOST=0.0.0.0` und `PUBLIC_ORIGIN=https://dein-server.example` setzen. TLS übernimmt der Reverse-Proxy. Ausgehende HTTPS-Verbindungen zu ÖBB/EFA/VRR und Kartendiensten bleiben erforderlich.

## GitHub Pages

`npm run build:pages` erzeugt dieselbe Oberfläche als statische Ausgabe. Es ist **keine ChatGPT-Serveradresse voreingestellt**. Für Live-Auskunft den eigenen HTTPS-Server in „Live-Auskunft einrichten“ verbinden oder beim Bau `RAILATLAS_API_ORIGIN` setzen. Karte und lokaler Bahnhofskatalog funktionieren ohne Auskunftsserver; direkte Netzabfragen setzen die Browserfreigabe der jeweiligen Quelle voraus. Pages kann die serverseitigen Anbieterabfragen selbst nicht ausführen.

Die bestehende [Pages-Veröffentlichung](https://dunkelst.github.io/railatlas-europe/) wurde bei diesem Source-Abgleich bewusst nicht ersetzt und entspricht noch Version 12 mit der damaligen gemeinsamen API. Der Pages-Workflow ist jetzt manuell und verlangt die eigene Serveradresse, damit beim Abgleich keine bestehende Live-Auskunft durch eine unkonfigurierte Veröffentlichung ersetzt wird. Aktueller Abnahmeort ist der oben verlinkte RailAtlas. Ein eigenständiger öffentlicher Auskunftsserver wurde hier nicht angelegt.

## Prüfung und aktuelle Grenzen

- Kartenhalte mit kurzen Namen werden innerhalb eines kleinen Stationskomplexes anhand von Name und Lage zugeordnet. Stadtpräfix und U-/S-Zusätze dürfen abweichen; andere Halte werden nicht ungeprüft übernommen.
- Neuer Live-Test über den eigenständigen Node-Pfad: „Karlsplatz“ → „Stephansplatz“ mit live geladenen ÖBB-Koordinaten liefert U1, 24.10.2026, 19:57–19:59. Die Eingaben simulieren das Kartenformat; sie sind kein neuer OSM-Netzdownload.
- Der gebaute eigenständige Server liefert App-CSS, Leaflet-CSS und Leaflet-JS mit HTTP 200, korrekten MIME-Typen und bytegleichem Inhalt. Die externe visuelle Abnahme bleibt offen.


- **80 App-Regressionen**, TypeScript sowie Worker-, Pages- und eigenständiger Clientbuild bestanden.
- Neuer echter lokaler HTTP-Servertest einschließlich Dateien, Health, CORS, JSON-, Datums- und Größenfehlern.
- Veröffentlichte ÖBB-Auskunft: Wien Karlsplatz → Stephansplatz am 24.10.2026, U1 18:27–18:29, Wiener Linien, einschließlich eines gelieferten Bauhinweises.
- Die vollständige visuelle Live-Abnahme ist offen. Frühere Prüfungen trafen auf eine CSS-Sicherheitsgrenze; aktuell war die Browser-Erweiterung nicht verfügbar. Neue EFA-Netzdaten sind live bestätigt, Overpass-Livedaten weiterhin nicht. Quellenfehler werden nicht mit Beispieldaten verdeckt.
- Sperrungs-/Echtzeitabdeckung bleibt partiell. VRR / EFA ist ein Testzugang ohne garantierte Verfügbarkeit. Der direkte DB-Web-Fallback ist eingebaut, wurde auf dem Worker jedoch mit HTTP 403 blockiert. EFA-BW, direkter VBB-Zugang und Trainline Partner Solutions sind nicht angeschlossen.
- [Gemeinsamer Prüfstand](sites/railatlas-europa/QA.md) · [Fortführungsstand](docs/continuation-2026-10-24.md)

`node tools/verify-sites-source.mjs` prüft die 189 übernommenen Dateien gegen das Herkunftsmanifest. `npm run test:app` führt die aktuellen App-Regressionen aus. Die bestehende OSM-/Graph-Pipeline, ihre Daten und Regressionen bleiben erhalten; `npm test` führt deren Node-/Python-Prüfungen aus. Stationskatalog: Trainline EU / stations, ODbL 1.0; Lizenzen liegen unter `sites/railatlas-europa/public`.



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

