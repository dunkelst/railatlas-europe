# Buslinien und Halte: Datenbasis und Freigabe

Stand 26.10.2026. Die europaweite Anzeige ist weiterhin nicht verlässlich
abgedeckt. Die Korrektur von Darstellung und Cache darf nicht als vollständige
Datengrundlage ausgegeben werden.

## Belegter Fehler und aktuelle Reparatur

Der Kartenabruf konnte eine unvollständige große Antwort beim Heranzoomen
weiter aus dem Cache übernehmen. Der Rat zum Heranzoomen war dann wirkungslos.
Außerdem umging der bisherige Neuladen-Knopf nur die lokale Entscheidung,
nicht den Cache der gemeinsamen API. Jetzt gelten Maßstabsgrenzen für die
Wiederverwendung. `refresh=1` erneuert den Abruf; Anbieterpausen bleiben gültig.
Kleine Bewegungen werden weiterhin aus passenden bereits geladenen Daten bedient.

Echter unabhängiger HTTP-Server: weiter Welsede-Ausschnitt 13 Bushalte,
enger Ausschnitt zwei Halte nach einer erneuten Quellenanfrage. Derselbe enge
Ausschnitt wird wiederverwendet. Explizites Neuladen verursacht einen dritten
Quellenaufruf. Alle Antworten HTTP 200. Die öffentliche Version-23-API bestätigt ebenfalls
13 bzw. zwei Halte, die exakten engeren Grenzen und einen neuen Abrufzeitpunkt
bei explizitem Neuladen. Offline-Regressionen sichern zusätzlich
Zoomwechsel, gemeinsamen API-Pfad und unabhängigen OSM-Cache ab.

## Quellenprüfung

| Quelle | Tatsächlicher Nachweis | Grenze |
| --- | --- | --- |
| EFA-Karte | Welsede 40/45 und örtliche Halte | Im kleinen Heilbronner Prüfbereich nur drei Schienenhalte, keine Busklassifikation |
| Öffentliche Overpass-Instanz | Vorherige kleine echte Anfrage und Worker-Abruf liefen in Timeout | Keine garantierte Anwendungsverfügbarkeit; keine gesperrte Hauptinstanz als Umgehung |
| Transitous `/api/v6/map/stops` | BUS-Halte in vier Ländern, siehe Tabelle | Offene Feeds bleiben unterschiedlich vollständig; geeignete Open-Source-Projektlizenz nötig |
| Transitous experimentelle Linienkarte | 47 sichtbare Heilbronner Varianten, vier Bezeichnungen | Sämtliche Wege `ROUTED`, keine bestätigten Original-Linienverläufe; große Antwort |

Die experimentellen Linienwege stammen aus der Quelle, sind jedoch berechnet.
Sie dürfen nicht als belegte originale Buslinienführung ausgegeben werden.
Fehlende Geometrie wird auch im Prototyp nicht durch Stations-Luftlinien ersetzt.

## Leichte manuelle Haltestellenproben

Alle Antworten am 26.10.2026 von der dokumentierten Produktionsadresse
`https://api.transitous.org`, mit Projektname, Version und Kontakt-URL im
User-Agent. Keine /plan-Anfragen, kein Scraping und kein laufender öffentlicher
Anschluss dieser Quelle.

| Gebiet | Prüfbereich süd,west,nord,ost | Bushalte | Beispiel |
| --- | --- | ---: | --- |
| Heilbronn | 49.138,9.224,49.147,9.243 | 7 | Karmeliterstraße, Schillerstraße |
| London | 51.510,-0.124,51.517,-0.111 | 12 | Lancaster Place, Savoy Street |
| Amsterdam | 52.372,4.890,52.384,4.908 | 4 | Prins Hendrikkade, Dam |
| Prag | 50.085,14.430,50.095,14.444 | 9 | Florenc, Bílá labuť |

Das manuell startbare Probeskript ist in
`sites/railatlas-europa/scripts/probe-transitous.mjs` enthalten. Es verwendet den
bestehenden Polyline- und Ausschnittscode, begrenzt Antworten und bezeichnet
berechnete Linien ausdrücklich als solche. Es wird von keiner App-Route geladen.
Echte kleine Regressionsevidenz und Quellenhinweise liegen in `tests/fixtures`.
Keine der Proben beweist vollständige Länder- oder Fahrplanabdeckung.

## Konkreter Lizenzvorschlag, noch nicht freigegeben

Vorgeschlagen ist die **MIT-Lizenz für den selbst erstellten RailAtlas-
Programmcode**. Ihre Bedingungen stehen vollständig bei der
[Open Source Initiative](https://opensource.org/license/mit).
Sie erlaubt anderen Nutzung, Änderung und Weitergabe, auch kommerziell,
unter Erhalt des Copyright- und Lizenzhinweises. Das ist ein weitergehendes Recht
als der bisher erlaubte öffentliche Testbetrieb.

Daten, Stationskatalog, Karten, fremde Bibliotheken und Marken bleiben unter ihren
jeweiligen bestehenden Bedingungen. Die MIT-Freigabe für eigenen Programmcode
würde weder diese Daten umlizenzieren noch die nichtkommerzielle Transitous-API
für kommerzielle Nutzung freigeben.

Es wurde **keine LICENSE-Datei ergänzt und keine Lizenz erteilt**. Der Eigentümer
muss diesen Vorschlag erst freigeben. Das öffentliche Repository besitzt aktuell
keine erkannte Open-Source-Lizenz.

Die [Transitous-API-Bedingungen](https://transitous.org/api/) verlangen ein
nichtkommerzielles Open-Source-Projekt und angemessene Ressourcennutzung; leichte
Prototypentests vor der Lizenzierung sind ausdrücklich erlaubt. Attribution zu
https://transitous.org/sources/ sowie zu OpenStreetMap gehört zu einer späteren
sichtbaren Anbindung. Der Dienst bleibt best effort.

## Nächster sachlicher Schritt

Nach Lizenzfreigabe den stabilen Transitous-Haltestellenabruf an das gemeinsame
Kartenmodell anbinden, Quellkennungen erhalten und Start/Ziel/Zwischenziel über
den bestehenden Resolver prüfen. Die bestätigte breitere Halteabdeckung kann
sofort genutzt werden. Linienpfade bleiben eine eigene offene Aufgabe: bevorzugt
Original-GTFS-Shapes bzw. verlässlich erfasste OSM-Routen; berechnete Wege nur mit
klarer Kennzeichnung und ausdrücklicher eigener Anzeigeoption. Eine umfassende
Netzkarte braucht eine passende Datenbasis, nicht nur weitere Einzelabfragen.
