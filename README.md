# RailAtlas Europa

[**RailAtlas öffnen**](https://railatlas-europa.cocoaamber33.chatgpt.site) · [Quellstand und Abgleich](docs/sites-source-sync.md)

Der gemeinsame Quellstand entspricht Sites-Version **27**, Quellcommit `2ac3e41f0a72fdc25e28b8d1ea56f672a47e7952`. Er enthält 54.114 Katalogeinträge aus 38 Ländern, Bahnhofssuche, Standort-/Kartenauswahl, Zwischenziele mit Aufenthalt und echte europäische Fahrplanabfragen. Die eigenständig startbare Ausgabe verwendet keinen ChatGPT-Server.

## Version 27: Katalogzuordnung und Stationszugänge

Faro Airport → Madrid Atocha scheiterte an einem 245 m unbestätigten Startweg
sowie an 44–62 m Differenz zwischen Bahnsteigpunkt und Stationszugang in Sevilla.
Die Quelle war erreichbar; die bisherige Sammelmeldung verdeckte die Ursachen.

Kataloghalte ohne Anbieterkennung werden nun einmal beim Anbieter aufgelöst:
exakter Name, passende explizite Länderangaben und höchstens 800 m Abstand.
Mehrdeutige Treffer werden abgelehnt. Für Faro wird der echte Flughafenhalt
523 m vom Katalogpunkt gewählt und die Zuordnung im Ergebnis sichtbar benannt.
Individuelle Koordinaten, GPS und bekannte Anbieterkennungen werden nicht versetzt.

Bei nativen Bahn-/U-Bahn-Halten bleiben gelieferte Stationszugänge mit höchstens
250 m Abweichung und höchstens der Quellgehstrecke als **partieller Verlauf**
erhalten. Entfernung wird gezeigt, Originalpunkte und Quellzeiten bleiben gleich,
Kartenlücken offen. Die 30-m-Kontrolle für Koordinaten und Bus-/Tramhalte gilt weiter.
Nicht bestätigte Fußwege bekommen eine konkrete Meldung, auch wenn eine andere
Quelle ausfällt. Optionaler Lookup-Ausfall erhält sichere Koordinatenrouten;
Anbieterpausen, Retry-After und Abbruch gelten.

**109 Tests, TypeScript und drei Builds bestanden.** Echter gemeinsamer
Node-HTTP-Server: HTTP 200 mit drei Reisen für 31.10.2026 ab 09:00 Europe/Berlin.
Erste Reise 10:30–17:13 Berlin, FlixBus 1794 / Bus EA / AVE über Sevilla.
Die Zeitbasis bleibt Europe/Berlin; die Anfrage entspricht 08:00 in Faro.
Version 27 ist veröffentlicht: Die öffentliche API und der Browser bestätigen
drei Alternativen, den 523-m-Zuordnungshinweis und den 62-m-Stationszugang.
Auch Heilbronn Friedhof → Neckargartach Römerstraße liefert weiter drei Reisen.
Beide GitHub-Prüfungen sind erfolgreich; 200 App-Dateien sind bytegleich.
[Prüfprotokoll mit Bildschirmfotos](docs/qa/railatlas-v27.md).

## Seit Version 26: Verbindungssuche für die neuen Kartenhalte

Die letzte Erweiterung verband Transitous mit der Karte; die Fahrtsuche
verwendete weiterhin nur die bisherigen Auskünfte. Heilbronn Friedhof →
Neckargartach Römerstraße scheiterte trotz ausgewählter Halte. Die automatische
Suche fragt jetzt nach erfolgloser ÖBB-/EFA-Auskunft einmal den stabilen
Transitous-Fahrplan ab. Native IDs bleiben bei ihrer Quelle; andere Halte werden
über Koordinaten mit 30-m-Endpunktkontrolle geprüft. Kein neuer Reiseablauf.

Der gemeinsame eigenständige Node-HTTP-Server bestätigt HTTP 200 und drei
vollständige Optionen für den 26.10.2026 ab 20:51 Europe/Berlin: darunter
Bus 11 ab 21:09, vier Minuten Quellfußweg, Bus 32 und Ankunft um 21:33.
Auch ein erster Fußweg mit Bus 32 sowie eine spätere Bus-31-Alternative sind
enthalten. Ausfälle, Zeitkonflikte, falsche Endpunkte und verlängerte Quellkalender
werden verworfen. Unbestätigte Fahrzeuggeometrien werden nicht gezeichnet;
Quellfußwege bleiben sichtbar. Attribution steht direkt im Reiseergebnis.

**103 Tests, TypeScript und alle drei Builds bestanden.** Erfolgreiche bisherige
Quellen lösen keine weitere Anfrage aus. Cache, vier MiB Antwortgrenze,
22 Sekunden Timeout, Anbieterpause und Abbruch begrenzen den Zusatzabruf.
Keine Serienabfragen oder automatische Folgetagssuche. Der Stand ist gespeichert;
Version 26 ist nativ veröffentlicht und im Browser erfolgreich geprüft.
[Prüfprotokoll mit Bildschirmfoto](docs/qa/railatlas-v26.md).

## Seit Version 24: AGPLv3 und breitere Kartenhalte

Der eigene Programmcode steht nach ausdrücklicher Freigabe unter
**AGPL-3.0-only**. [Lizenztext](LICENSE) und [Lizenzumfang](LICENSE_SCOPE.md)
liegen bei; Fremddaten und Bibliotheken behalten ihre bisherigen Bedingungen.
Die Oberfläche verlinkt den vollständigen entsprechenden Quellcode sichtbar.

Der stabile Transitous-/MOTIS-Endpunkt `/api/v6/map/stops` ergänzt das gemeinsame
Kartenmodell. Bus umfasst BUS und COACH; alle fünf Verkehrsmittel bleiben einzeln
schaltbar. Halte funktionieren unabhängig von einer Fahrtsuche. Originalkennungen
bleiben erhalten und werden für Start, Ziel und Zwischenziel durch die vorhandenen
Anbieterresolver geprüft. Ein Kartenhalt bestätigt noch keine verfügbare Fahrt.
Gleiche Halte verschiedener Feeds werden zusammengeführt; Plattformen desselben
Feeds bleiben getrennt. Quellkoordinaten und sämtliche Kennungen bleiben erhalten.

Die veröffentlichte gemeinsame HTTP-API liefert Bus-/Fernbushalte in Heilbronn (7),
London (12), Amsterdam (6) und Prag (8), jeweils HTTP 200 nach Zusammenführung
überlappender Feeds. In Welsede ergänzt EFA
weiterhin die tatsächlichen Linien 40/45; vier DELFI-/VBN-Einträge werden als zwei
Halte mit allen Originalkennungen dargestellt. Quellenausfälle lassen vorhandene
Halte bestehen. **97 Regressionen, TypeScript und alle drei Builds bestanden.**
Version 24 ist auf der bestehenden öffentlichen Site veröffentlicht. Beide
GitHub-Prüfläufe sind erfolgreich. Im Browser sind die Halteanzeige ohne Reise
und die Übernahme als Start, Ziel und Zwischenziel praktisch bestätigt.
[Prüfprotokoll mit Bildschirmfoto](docs/qa/railatlas-v24.md).

Die breitere Haltequelle beseitigt keine vollständige europäische Datenlücke.
EFA bleibt für echte Liniengeometrien angebunden; experimentelle berechnete
Transitous-Linienwege werden nicht eingeblendet. Öffentliche API-Nutzung bleibt
nichtkommerziell, ressourcenschonend und unter den Anbieterbedingungen.
[Quellen und offene Linienabdeckung](docs/transit-network-coverage.md).

## Seit Version 23: korrekte Zoom- und Neuladen-Abfragen

Wesentlich engere Ausschnitte fragen die Quelle erneut ab. **Ausschnitt neu laden**
umgeht die gemeinsamen Daten-Caches unter Beachtung der Anbieterpausen. Kleine
Bewegungen verwenden passende Cacheantworten. Fehlende Netzdaten werden nicht
als fehlende Bedienung ausgegeben.

## Seit Version 22: konsistente Darstellung und sichtbare Netzdaten

Automatische Auskunft, Fußweg-Option und Neuplanung verwenden die dunklen
Seitenleistenfarben. Auskunftswahl, Sortierung und die neuen Einstellungen
teilen dieselben Auswahlfeldregeln. Das helle Kartenpanel erhält passende
native Schalter. Aktive Fußweg-Notlösungen bleiben durch Text und rote
Gehwegspuren auf Karte und Reiseliste erkennbar.

Zähler und gezeichnete Ebenen verwenden denselben **sichtbaren Kartenausschnitt**.
Daten des größeren Lade-/Cachebereichs erhöhen die Anzeige außerhalb der Karte
nicht mehr. Quelle, Einschränkungen der Linienauswahl und Ladefehler stehen
getrennt. Einschränkungen werden als Warnung neben einer erfolgreichen
Datenabfrage gezeigt. Die reine Halteauswahl zeigt keine alte Linienwarnung.

**82 App-Tests, TypeScript und alle drei Builds bestanden.** Die echte
Node- und öffentliche API-Prüfung rund um Neudenau zeigt die wichtige Grenze: zwölf Halte und Linie 835 im größeren
Ladebereich, vier Halte und keine gelieferte Linie im geprüften sichtbaren
Ausschnitt. Die Quellenlücke bleibt offen. Die Browser-Erweiterung war in dieser
Sitzung nicht verfügbar; eine neue visuelle Browserabnahme wird nicht behauptet.
Seite, neue App-Styles und Leaflet-CSS liefern inzwischen HTTP 200; die neuen
Stilregeln sind im tatsächlich ausgelieferten Stylesheet enthalten.

## Seit Version 21: Busnetz ohne geplante Reise

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


- **88 App-Regressionen**, TypeScript sowie Worker-, Pages- und eigenständiger Clientbuild bestanden.
- Neuer echter lokaler HTTP-Servertest einschließlich Dateien, Health, CORS, JSON-, Datums- und Größenfehlern.
- Veröffentlichte ÖBB-Auskunft: Wien Karlsplatz → Stephansplatz am 24.10.2026, U1 18:27–18:29, Wiener Linien, einschließlich eines gelieferten Bauhinweises.
- Die vollständige visuelle Live-Abnahme ist offen. Frühere Prüfungen trafen auf eine CSS-Sicherheitsgrenze; aktuell war die Browser-Erweiterung nicht verfügbar. Neue EFA-Netzdaten sind live bestätigt, Overpass-Livedaten weiterhin nicht. Quellenfehler werden nicht mit Beispieldaten verdeckt.
- Sperrungs-/Echtzeitabdeckung bleibt partiell. VRR / EFA ist ein Testzugang ohne garantierte Verfügbarkeit. Der direkte DB-Web-Fallback ist eingebaut, wurde auf dem Worker jedoch mit HTTP 403 blockiert. EFA-BW, direkter VBB-Zugang und Trainline Partner Solutions sind nicht angeschlossen.
- [Gemeinsamer Prüfstand](sites/railatlas-europa/QA.md) · [Fortführungsstand](docs/continuation-2026-10-24.md)

`node tools/verify-sites-source.mjs` prüft die 193 übernommenen Dateien gegen das Herkunftsmanifest. `npm run test:app` führt die aktuellen App-Regressionen aus. Die bestehende OSM-/Graph-Pipeline, ihre Daten und Regressionen bleiben erhalten; `npm test` führt deren Node-/Python-Prüfungen aus. Stationskatalog: Trainline EU / stations, ODbL 1.0; Lizenzen liegen unter `sites/railatlas-europa/public`.



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

