# RailAtlas 40 – ADO-Fahrpläne und Mexiko-Netzübersicht

Sites-Quellcommit `814dc23f7d7ae6888cdd00fa399ec6fcf095891d`.
1.030 gespiegelte Quelldateien; `tsconfig.tsbuildinfo` bleibt ausgenommen.

## Reproduzierter Fall und Korrektur

Im Originaltab des Nutzers bestätigt: Cancún International Airport (CUN) →
Tulum, 30.10.2026, America/Cancun. Die gesetzten Bus-/Colectivo-Schalter zeigen
wegen der gemeinsamen Kartenübersicht unter Zoom 12 keine Details. Der Tulum-
Stadtpunkt hat die irreführende Photon-Adresslokalität „Manuel Antonio Ay“.
Transitous bestätigt für die Strecke keine Reise. Diese Abdeckungslücke war
bereits bekannt und wird nicht mehr als Lösung des Anbieterproblems behandelt.

Die automatische Auskunft fragt nun für bestätigte Suchorte rund um Cancún,
Playa del Carmen und Tulum zuerst ADO / Distribusion ab. Der öffentliche GET-
Endpunkt hinter der ADO-eigenen Website liefert echte, datumsbezogene Verbindungen
ohne Anmeldung, Token oder Cookie. Der öffentliche ADO-Retailer-Code ist ein
Suchparameter; keine fremden Zugangsdaten wurden übernommen. Preise und Verkauf
werden nicht in RailAtlas implementiert. Native Transitous-Auswahlen und andere
mexikanische Regionen behalten den bisherigen Auskunftspfad.

Die Eingaben bleiben bis zur ausdrücklichen Übernahme tatsächlicher Anbieterhalte
erhalten. Abweichungen zu konkreten Punkten bleiben auf 800 m begrenzt; für Stadt-
oder Flughafenareale sind Kandidaten im selben bestätigten Anbietersuchgebiet bis
5 km zulässig. Die eigentliche Bestätigung bleibt auf 30 m begrenzt. Keine
Verbindung oder Zugangsgeometrie wird ergänzt, um einen anderen Halt zu kaschieren.
Ausgebuchte, mistimte, vergangene, getrennte oder unlesbare Vorschläge fallen
heraus. Lokale Anbieterzeiten werden mit der gelieferten Zeitzone in UTC
umgerechnet; die Anzeige nutzt weiter America/Cancun. Fehlende Fahrweggeometrie
und unbestätigte Echtzeit-/Störungsabdeckung sind am Ergebnis sichtbar.

## Tatsächliche Quellen- und Browserprüfung

- Die offizielle ADO-Seite verlinkt die echte Suche mit Abfahrtsgebiet MXCUNCA,
  Zielstadt MXTUL und wählbarem Reisedatum. Beide wurden in der Bedienoberfläche
  bis zu echten Abfahrten geprüft; es wurde keine Buchung begonnen.
- Ein direkter öffentlicher ADO-Abruf für 31.10.2026 lieferte 18 Verbindungen über
  die drei Terminals. Die Originalantwort mit Suchprovenienz ist die Regression
  `tests/fixtures/ado-cancun-tulum.json.gz`.
- Der eigene Anwendungscode bestätigte live sechs Reisen von Terminal 2 nach
  ADO Tulum. Erste Reise 12:00–14:20 America/Cancun, 2 h 20 min.
- Öffentliche Sites-Version 40: CUN und Tulum aus den Vorschlägen gewählt;
  31.10.2026, 09:00. ADO liefert echte andere Halte: Terminal 2 (147 m),
  Terminal 3 (682 m), Terminal 4 (890 m) und ADO Tulum (244 m). Die Ortspunkte
  wurden bis zur jeweiligen ausdrücklichen Übernahme nicht verschoben.
- Nach Übernahme von Terminal 2 bleibt die Zielalternative sichtbar. Nach
  Zielübernahme und erneuter Suche zeigt die gemeinsame Reiseansicht sechs
  Busreisen: 12:00–14:20, 13:20–15:55, 14:40–17:00, 16:00–18:20,
  17:50–20:10 und 20:20–22:40 America/Cancun. Quelle ADO / Distribusion,
  keine erfundene Streckenlinie oder Fußwegverbindung.

## Karten und Daten

Mexiko nutzt ab Zoom 9 eine begrenzte Übersicht aus bereits vorliegenden
OSM-/GTFS-Daten. Es gibt keine großen Overpass-, EFA- oder Transitous-Abfragen.
Die explizite Region bleibt im Küstenausschnitt erhalten. Das feste Prüfbild
[19.9,-88,21.5,-86.3] enthält 2 Bus- und 39 Colectivo-Verläufe sowie 478 Bus-
und 158 Colectivo-Halte, rund 738 kB JSON; null externe Abfragen. Der tatsächliche
engere Reiseausschnitt zeigt 39 Colectivo-Verläufe, 158 Colectivo- und 321 Bushalte;
regionale ADO-Fahrwege sind in den Kartendaten nicht geliefert. Originale
Geometriefragmente und Quellkennungen bleiben erhalten.

Die veraltete lokale vinext-Laufmarkierung wurde bei gestoppter Vorschau entfernt.
Danach meldet die verwaltete Vorschau einen gesunden Start; die Cloud-Browserroute
meldet weiter ERR_CONNECTION_REFUSED. Die Bedienprüfung erfolgte deshalb an der
öffentlichen Veröffentlichung.

## Prüfung und verbleibende Bahn-Anbindung

155 Regressionen, TypeScript, Worker-, eigenständiger Client- und GitHub-Pages-
Build sowie vollständiger Manifestabgleich erfolgreich. Neue Prüfungen decken
die echte ADO-Antwort, explizite Endpunkte, Zeit-/Verfügbarkeitsprüfung, Quellenwahl,
Cache-Neuvalidierung, Abbruch und Retry-After ab. Dazu Übersicht ohne externe
Anfragen, Küstenregion, feste externe Abfragegrenzen und Tulum-Ortsidentität.

Eine Schienenkarte bestätigt weiterhin keine Bahnreise. Die offizielle
Tren-Maya-Website verweist auf https://reservas.ventaboletostrenmaya.com.mx/.
Dort ist eine öffentliche datumsbezogene Fahrplansuche erreichbar; für
Cancún Aeropuerto (22) → Tulum (25), 31.10.2026, wurden fünf Züge geliefert
(601, 401, 301, 603, 403). Dafür gibt es in Version 40 noch keinen angebundenen
RailAtlas-Parser. Zugang zu den tatsächlichen Bahnhöfen und verlässliche
Zeitinterpretation müssen zusammen mit dieser Quelle umgesetzt werden.
