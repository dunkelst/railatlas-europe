# Buslinien und Halte: Datenbasis und AGPL-Freigabe

Stand 27.10.2026, Quellversion 27. Die zusätzliche Haltequelle verbessert die
belegte Abdeckung. Vollständige europäische Netz- oder Fahrplanabdeckung ist
weiterhin nicht nachgewiesen.

## Freigegeben und umgesetzt

Der Eigentümer hat AGPL ausdrücklich gegenüber MIT bevorzugt und freigegeben.
Der eigene Programmcode steht unter **AGPL-3.0-only**; vollständiger Standardtext
und Umfang stehen in [LICENSE](../LICENSE) und [LICENSE_SCOPE.md](../LICENSE_SCOPE.md).
Daten und fremde Bibliotheken behalten ihre jeweiligen Bedingungen. Die
Oberfläche verlinkt den vollständigen entsprechenden Quellcode sichtbar.

Der stabile Transitous-Endpunkt `/api/v6/map/stops` ist in das bestehende
Kartenmodell eingebunden. Halte sind für alle fünf bestehenden Verkehrsmittel
einzeln schaltbar und ohne Reise sichtbar. Bus fragt BUS und COACH gemeinsam ab.
GTFS-Kennungen und Originalkoordinaten bleiben erhalten. Bestehende Resolver
prüfen Halte für Start, Ziel und Zwischenziel; fremde IDs werden nicht ungeprüft
als Kennungen anderer Anbieter verwendet. Ein Treffer bestätigt keine Fahrt.

Gleiche Halte verschiedener Feeds werden nach Name und maximal 250 m vereinigt;
Plattformen desselben Feeds bleiben getrennt. Alle Kennungen bleiben verfügbar.
EFA ergänzt echte Liniengeometrie und Halte. Quellenfehler entfernen verfügbare
Daten der anderen Quelle nicht. Größe, Timeout, Retry-After und Cache begrenzen
die Last. Seit Version 25 folgt nach erfolglosen ÖBB-/EFA-Auskunft eine einzelne
begrenzte `/api/v6/plan`-Abfrage. Erfolgreiche alte Quellen benötigen sie nicht.
Keine Serienabfragen oder automatische Folgetage.

Die [API-Bedingungen](https://transitous.org/api/) verlangen ein nichtkommerzielles
Open-Source-Projekt und angemessene Ressourcennutzung. Sichtbare Attribution
verweist auf https://transitous.org/sources/ und OpenStreetMap. Der Dienst bleibt
best effort. AGPL ändert diese API-Bedingungen nicht.

## Echte gemeinsame HTTP-Proben

| Gebiet | Prüfbereich süd,west,nord,ost | BUS und COACH | Ergebnis |
| --- | --- | ---: | --- |
| Heilbronn | 49.138,9.224,49.147,9.243 | 7 | HTTP 200 |
| London | 51.510,-0.124,51.517,-0.111 | 12 | HTTP 200 |
| Amsterdam | 52.372,4.890,52.384,4.908 | 6 | HTTP 200 |
| Prag | 50.085,14.430,50.095,14.444 | 8 | HTTP 200 |

Diese Ergebnisse sind auf der öffentlichen Version-24-API bestätigt. Die erste
Node-Probe lieferte vor Feed-Zusammenführung zehn Prager Einträge.
Frühere reine BUS-Proben lieferten in Amsterdam vier und Prag neun Einträge.
Die App berücksichtigt zusätzlich COACH. Originaldaten und Attribution bleiben
erhalten. Welsede liefert echte EFA-Linien 40/45 und zwei Halte statt vier doppelter
DELFI-/VBN-Einträge. Keine Probe beweist vollständige Länderabdeckung.

## Offene Liniengeometrie

Die experimentelle Transitous-Linienkarte lieferte im Heilbronner Testbereich
47 sichtbare Varianten mit vier Bezeichnungen; alle Pfade trugen
`pathSource=ROUTED`. Diese berechneten Wege werden nicht als originale
Linienführung eingeblendet. Das manuelle Skript
`sites/railatlas-europa/scripts/probe-transitous.mjs` bleibt getrennt von der
Laufzeit und kennzeichnet berechnete Pfade. Keine Luftlinien als Ersatz.

EFA ist regional nützlich, lieferte im Heilbronner Prüfausschnitt jedoch keine
Busklassifikation. OSM bleibt ergänzend; vorherige Overpass-Abfragen liefen in
Timeout. Belastbare europaweite Linien brauchen Original-GTFS-Shapes bzw.
verlässlich erfasste OSM-Routen und eine geeignete Datenversorgung.

## Vorhandene Cachekorrektur

Seit Version 23 führen wesentlich engere Ausschnitte zu neuen Abfragen.
`Ausschnitt neu laden` übergibt `refresh=1` durch den gemeinsamen API- und
OSM-Pfad, weiterhin unter Beachtung der Anbieterpausen. Kleine Bewegungen nutzen
passende Caches. Leere Sichtauswahl bestätigt keine fehlende Bedienung.
109 Regressionen sichern den aktuellen gemeinsamen Stand ab.


## Fahrplananbindung seit Version 25

Die Karte allein reichte für den gemeldeten Fall Heilbronn Friedhof →
Neckargartach Römerstraße nicht. EFA erkennt die realen Haltekennungen, liefert
jedoch keine Reise. Transitous liefert drei echte Optionen, im gemeinsamen
Node-HTTP-Pfad HTTP 200 bestätigt. Beispiel 26.10.2026 ab 20:51: Bus 11 um 21:09,
vier Minuten Quellfußweg, Bus 32 und Ankunft 21:33 Europe/Berlin.
Native IDs bleiben bei ihrer Quelle, andere Halte werden über ihre Koordinaten
angefragt. Endpunkte, aktive Meldungen, Ausfälle und Zeiten sind verbindlich.
Original-GTFS-Shapes sind in `/plan` nicht als solche bestätigt. Fahrzeugpfade
bleiben deshalb offen, geroutete Fußwege werden gezeigt. Die allgemeine
experimentelle Linienkarte bleibt weiterhin außerhalb der öffentlichen App.


## Katalogzuordnung und Stationszugänge seit Version 27

Beim Faro-Fall lag der Katalogpunkt 245 m neben dem Quellweg. Geocoding bestätigt
einen exakt gleich benannten Flughafenhalt 523 m vom Katalogpunkt entfernt.
Eindeutige Katalogzuordnung ohne Anbieter-ID: exakter Name, Länderprüfung und
maximal 800 m. Die Entfernung wird angezeigt. GPS-/Kartenpunkte bleiben strikt.
Bahn-/U-Bahn-Stationszugänge bis 250 m und maximal Quellgehstrecke bleiben als
partielle Quellgeometrie erhalten, mit Meterangabe und unveränderten Originalpunkten.
Keine Verbindung über eine Kartenlücke und keine geänderten Fahrplanzeiten.
Gemeinsamer Node-HTTP-Pfad: 200, drei echte Reisen Faro Airport → Madrid Atocha
am 31.10.2026, erste 10:30–17:13 Europe/Berlin. Konkrete Gehwegfehler werden nicht
mehr von einer allgemeinen Meldung zum Ausfall einer anderen Quelle verdrängt.
