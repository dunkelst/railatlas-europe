# RailAtlas 42 – Tren Maya in der gemeinsamen Reiseplanung

Sites-Quellcommit `448603aae10c99f55822ae2f8578e8bbf2e0f36e`.
1.034 bytegleich gespiegelte Quelldateien, generiertes `tsconfig.tsbuildinfo`
bleibt ausgenommen. 162 Regressionen, TypeScript, Worker-, eigenständiger
Client- und GitHub-Pages-Build erfolgreich.

## Quelle und Stationsidentität

Die offizielle Tren-Maya-Website und ihre FAQ verweisen auf
https://reservas.ventaboletostrenmaya.com.mx/. Die dortige öffentliche, serverseitig
gerenderte Suche unter `/web/portal/horarios` liefert datumsbezogene Fahrpläne
mit Zugnummern, Dauer und Zwischenhalten. RailAtlas verwendet dieselbe anonyme
GET-Abfrage. Es werden keine Buchungen begonnen, keine Sitze reserviert und keine
Anmeldedaten, Sitzungs-Cookies oder `p_auth`-Werte übernommen. Die Zuordnung und
das Reisedatum werden anhand der tatsächlich zurückgegebenen Formularwerte
geprüft; eine leere oder geänderte HTML-Seite wird nicht als Reise übernommen.

Alle 34 Buchungskennungen sind tatsächlichen OSM-Bahnhofsflächen zugeordnet.
Abgerufen wurden begrenzte Photon-Suchen nach Bahnhofsnamen mit `railway=station`;
Quellkoordinaten, Originalname und OSM-Way-Kennung bleiben im Stationskatalog.
Einige Kartenreferenzen der Betreiberwebsite zeigen weit entfernte Ortszentren;
diese werden nicht als Bahnhofspositionen übernommen. Cancún Flughafenareal,
Tren Maya Cancún Aeropuerto, ADO-Terminals, Tulum-Ort, Bahnhof Tulum und Bahnhof
Tulum Aeropuerto bleiben eigenständige Punkte. Quelle und ODbL-Hinweis sind sichtbar.

Die Bahnhöfe stehen in derselben automatischen Suche, als Kartenhalte der
Bahn-Ebene sowie für Start, Ziel, Zwischenziele und Neuplanung bereit.
Eine IATA-Suche wie CUN zeigt das Flughafenareal und den zugehörigen Bahnhof
getrennt, auch wenn zusätzliche Online-Suchdienste ausfallen. Abweichende
Bahnhöfe erfordern eine ausdrückliche Übernahme. Die eigentliche Reisebestätigung
bleibt auf 30 m begrenzt. Nach Übernahme eines Anbietereinstiegs bleiben nur
passende Vorschläge derselben Quelle für die andere Seite stehen.

## Zeit und Quellenvergleich

Die Abfrage verwendet den lokalen Abfahrtstag. Zeitangaben werden mit der
Zeitzone des jeweiligen Quellbahnhofs in UTC umgerechnet. Die gelieferte Dauer
und der zeitliche Verlauf aller Zwischenhalte werden kontrolliert. Für
Cancún → Mérida liefert die Quelle 08:00–10:28 Uhr bei 3 h 28 min; der Wechsel
von UTC−5 nach UTC−6 bleibt korrekt. Die allgemeine Oberfläche verwendet weiter
die vom Nutzer gewählte Anzeigezeitzone.

ADO und Tren Maya werden in der bestehenden Mexiko-Auskunft verglichen.
Explizite native Anbieterauswahlen werden respektiert. Nicht unterstützte
mexikanische Regionen verwenden weiterhin den bisherigen Transitous-Pfad.
Eine erfolglose Quelle kann bestätigte Reisen einer anderen Quelle nicht löschen.
Der Zwischenspeicher enthält nur kurzlebige Quellantworten; jede Eingabe wird
räumlich und zeitlich erneut geprüft. Abbruch, Retry-After und Antwortgrößenlimit
verwenden den gemeinsamen HTTP-Pfad. Kein zusätzlicher Browser oder Dienst ist
für den eigenständigen Betrieb nötig.

## Tatsächliche API-Prüfungen am 30.10.2026

Die gemeinsame `handleApi`-Implementierung bestätigte mit echten Online-Abrufen:

| Abfrage am 31.10.2026 | HTTP / Reisen | Erste gelieferte Fahrt, jeweilige Ortszeit |
| --- | --- | --- |
| Cancún Aeropuerto → Tulum, ab 09:00 | 200 / 5 | Tren Maya 601, 09:00–10:33, 93 min |
| Tulum → Cancún Aeropuerto, ab 12:00 | 200 / 4 | Tren Maya 602, 13:38–15:15, 97 min |
| Mérida Teya → Palenque, ab 05:00 | 200 / 2 | Tren Maya 502, 10:40–18:30, 7 h 50 min, 13 Zwischenhalte |

Die Regression enthält echte, vom Seitenrahmen und Buchungslinks bereinigte
Tabellen für Hin-/Rückfahrt und Cancún → Mérida. Kalender-, Stations-, Dauer-,
Ausfall- und Endpunktabweichungen dürfen keine Reise oder irreführende
Bahnhofsvorschläge erzeugen. API-Caching, ADO-Ausfall, native Stationsidentität,
Kartenhalte ohne externe Netzabfragen, Abbruch und große Antworten sind geprüft.

## Grenzen

Die Quelle liefert Sollfahrpläne für direkte Züge zwischen ausgewählten
Bahnhöfen. Sitzplätze, Echtzeit und aktuelle Störungs-/Sperrmeldungen sind nicht
angebunden und werden als unbestätigt angezeigt. Zwischenhaltzeiten werden als
solche erhalten; getrennte Ankunfts-/Abfahrtszeiten werden nicht erfunden.
Bahnhofszugänge, Transferfahrten und Zuggeometrien werden nicht ergänzt.
Die vorhandene Schienenkarte bleibt eine Infrastrukturebene und ist kein Nachweis
des Fahrwegs einer konkreten Fahrt. Mehrteilige Reisen über ausdrückliche
Zwischenziele verwenden den vorhandenen gemeinsamen Ablauf.

Die verwaltete Vorschau startete nach Entfernen einer veralteten Laufmarkierung;
der Cloud-Browser meldete für die vorgegebene Route `ERR_CONNECTION_REFUSED`.
Die Bedienprüfung erfolgt deshalb am veröffentlichten Stand.

## Veröffentlichte Bedienprüfung

Sites-Version 42 wurde am 30.10.2026 erfolgreich veröffentlicht und über den
regulären öffentlichen Host geprüft. CUN zeigt getrennt Flughafenareal und
Tren Maya Cancún Aeropuerto. Tulum zeigt Bahnhof Tulum, Bahnhof Tulum Aeropuerto
und den Stadtpunkt getrennt. Die Suche vom Flughafenareal zum Stadtpunkt liefert
ADO-Terminals und Tren-Maya-Bahnhöfe nebeneinander mit den tatsächlichen
Abständen. Nach ausdrücklicher Wahl des Tren-Maya-Starts bleibt nur der passende
Tren-Maya-Zielvorschlag stehen.

Nach Übernahme beider Bahnhöfe zeigt die öffentliche gemeinsame Reiseansicht
fünf Züge am 31.10.2026: 09:00–10:33 (601), 10:30–12:03 (401), 11:39–13:16 (301),
15:40–17:13 (603) und 18:20–19:53 (403), Anzeige America/Cancun. Puerto Morelos
09:21 und Playa del Carmen 09:45 sind als gelieferte Haltezeiten aufklappbar.
Die Neuplanung bietet beide Zwischenbahnhöfe an. Übernahme von Puerto Morelos
setzt diesen echten Bahnhof und 09:21 als zu prüfenden Suchbeginn; die erneute
Abfrage liefert fünf Fahrten, erste tatsächliche Abfahrt 09:23, Ankunft 10:33.
Es wird keine Abfahrtszeit aus der Zwischenhaltzeit erfunden.

DE → EN → ES → DE erhält die ausgewählten Bahnhöfe, fünf Reisealternativen und
09:00–10:33. Die neuen Quellen-/Störungshinweise und Halteansichten erscheinen
in der gewählten Sprache. Echtzeit und Sitzplätze werden ausdrücklich als
unbestätigt bezeichnet; ein Streckenverlauf wird nicht ergänzt.
