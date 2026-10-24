# Ausweichsuche und Neuplanung während der Reise

Anforderungen von Steffen vom 24.10.2026 für RailAtlas Europa.

## Gewünschtes Verhalten

Die Planung soll mehrere vollständige, auswählbare Reisen anbieten:

1. Reguläre Weiterfahrt oder Warten bis zur nächsten bestätigten Fahrt.
2. Freiwillige Fußweg-Notlösungen zu einer anderen tatsächlich bedienten Linie.
3. Umwege, einschließlich einer ersten Fahrt vom Ziel weg oder einer Rückfahrt,
   wenn damit ein besserer Anschluss und eine frühere Zielankunft erreichbar sind.

Die Auswahl steuert Karte und Reiseverlauf. Abfahrt, Ankunft, Verkehrsmittel,
Umstiege, Gehzeit, Gehstrecke und Datenabdeckung müssen vergleichbar bleiben.
Die früheste Ankunft ist wichtiger als die geometrisch kürzeste Annäherung.

## Fußweg-Notlösung

- Zuschaltbar, zunächst ausgeschaltet.
- Wählbares Gehbudget von beispielsweise 15, 30 oder 60 Minuten und zusätzlich
  eine Entfernungsgrenze. Der vorbereitete erste Stand verwendet maximal 3 km.
- Rot gestrichelter Verlauf, Fußsymbol und Text „Fußweg-Notlösung“; die Bedeutung
  muss auch ohne Farbwahrnehmung verständlich sein.
- Rot kennzeichnet eine bewusst gewählte Ausweichoption. Es bedeutet keine
  bestätigte Sperrung des Gehwegs.
- Nur ein tatsächlich berechneter Fußweg auf einem geeigneten Wegenetz zählt.
  Keine Luftlinie, erfundene Gehzeit oder aus einem Schienenverlauf abgeleitete
  Fußroute. Quelle und Schätzcharakter bleiben sichtbar.
- Nicht ausschließlich den räumlich nächsten Halt betrachten: andere erreichbare
  Halte und Linien können eine bessere Gesamtreise liefern.
- Die Weiterfahrt muss nach Gehzeit und ausgewiesenem Einstiegspuffer erreichbar
  und von der Auskunft bestätigt sein. OSM-Halte und Kartenlinien belegen keinen
  aktuellen Betrieb.
- Ausfälle, ausdrücklich unberücksichtigte Sperrungen, falsche Endpunkte,
  fehlende Wege und überschrittene Budgets schließen den Vorschlag aus.
- Abbruch, Quellenpausen, maximale Kandidatenzahl und begrenzte Anfragen gelten
  auch für die Ausweichsuche.

## Gegenrichtung und Rückfahrt

Geografische Zielannäherung ist keine Zulassungsbedingung. Ein zeitlich und
räumlich erreichbarer Umstieg bleibt zulässig, auch wenn die erste Fahrt vom
Ziel wegführt. Reale vollständige Routenvorschläge dürfen nicht wegen einer
Rückfahrt verworfen werden.

Eine Kennzeichnung „zunächst vom Ziel weg“ kann aus einem gelieferten Verlauf
abgeleitet werden. Die betriebliche Gegenrichtung eines Zuges darf ohne passende
Linieninformationen nicht behauptet werden. Für die finale Version ist die
gezielte Suche nach weiteren Umstiegspunkten auszubauen; die bloße Zulassung
eines gelieferten Umwegs ist noch keine umfassende Ausweichsuche.

## Bei Ausfall unterwegs

„Ab hier neu planen“ übernimmt einen vom Nutzer gewählten tatsächlichen Halt.
Datum und Abfahrtszeit bleiben sichtbar und korrigierbar. Bereits zurückgelegte
Abschnitte entfallen; verbleibende Zwischenziele samt Aufenthalt und das Endziel
bleiben erhalten. Die neue Abfrage darf reguläre Weiterfahrt, Warten, andere
Linien, Rückfahrt und optional Fußwege vergleichen.

Ein inzwischen ausgefallener gespeicherter Vorschlag darf nicht als gültige
Weiterreise wiederverwendet werden. Eine leere Meldungsliste ist kein Nachweis
eines störungsfreien Betriebs.

## Abnahme

- Ein Gehweg verpasst den Anschluss: Vorschlag verwerfen.
- Gehbudget überschritten, Weg fehlt oder Endpunkt stimmt nicht: keine Notlösung.
- Mehrere geeignete Halte: unterschiedliche bestätigte Anschlussreisen anbieten.
- Synthetisches Testnetz: erst westwärts, dann ostwärts ist früher am Ziel als
  Warten auf eine direkte Ostfahrt; diese Option bleibt auswählbar.
- Ein synthetischer Test wird nicht als realer Fahrplan ausgegeben.
- Ein Ausfall der ersten Rückfahrt entfernt genau diese Alternative.
- Neuplanung behält nur noch offene Zwischenziele und deren Aufenthalte.
- Tageswechsel, Zeitumstellung, Quellen-IDs, fehlende Geometrie, Nutzerabbruch
  und bestehende Bahn-/ÖPNV-Verbindungen bleiben geprüft.

Die Umsetzung erweitert das gemeinsame Stations-, Reise- und API-Modell.
Kein zweiter Planner, keine feste Beispielstrecke und keine ungeprüfte
Zusammensetzung aus Kartenpunkten und Fahrplanfragmenten.

## Tatsächlicher Arbeitsstand beim Ausfall der Arbeitsumgebung

Die folgenden Änderungen waren lokal vorbereitet und mit **70 bestandenen
App-Tests** sowie TypeScript geprüft, sind aber **noch nicht veröffentlicht**:

- Zusatzparameter `walkingBudget: 0 | 15 | 30 | 60` im gemeinsamen API-Handler,
  zunächst nur bei automatischer Auskunft.
- EFA-Koordinatenabfrage liefert vollständige Reisen mit Quellfußwegen; die
  bestehende EFA-/VRR-Auswertung wird weiterverwendet.
- Strenge Prüfung von Endpunkten (30 m), Quellverläufen und Gehbudget; maximal
  drei Abfragen über drei lokale Kalendertage, nur nach tatsächlich leerer
  Verbindungsliste. Keine Datumserweiterung bei Ausfall oder ungültigen Reisen.
- Auswahl zusätzlicher Reisen, rote Fußwege mit Text und Gehstrecke.
- „Ab hier neu planen“ mit gewähltem Reisehalt und verbleibenden Zwischenzielen.
- Regression für eine bessere Ankunft trotz erster Fahrt vom Ziel weg.

Der aufgezeichnete reale EFA-Fall Rohdental → U Turmstraße liefert am
26.10.2026 als erste Fußweg-Option **06:53–12:49 Europe/Berlin**:
Bus 27 → Bus 20 (im Fahrzeug bleiben), S5, ICE 553, Umstieg zu S7,
Berlin Bellevue und 20 Minuten Fußweg (1.179 m) zu einer Adresse wenige Meter
neben dem gewählten Zielpunkt. Insgesamt 29 Minuten zu Fuß, einschließlich
des Umstiegs am Berliner Hauptbahnhof. Drei vollständige Alternativen wurden
im Parser-/API-Test bestätigt. Dies belegt einen letzten Reiseabschnitt zu
Fuß; ein realer erster Fußweg zu einer anderen bedienten Linie wurde damit
noch nicht live nachgewiesen. Das synthetische Gegenrichtungsbeispiel ist
ebenfalls kein Live-Fahrplan.

### Vor Veröffentlichung noch erledigen

1. Arbeitsverzeichnis wiederherstellen und ungesicherte Änderungen zuerst
   sichern; nicht mit einem älteren Quellstand überschreiben.
2. Gehbudget bei mehreren Zwischenzielen eindeutig als Gesamtbudget behandeln
   oder in der Oberfläche ausdrücklich je Teilstrecke kennzeichnen.
3. Den späteren S51-Vorschlag der neuen EFA-Antwort prüfen: Die Quelle enthält
   einen ausdrücklichen Hinweis auf Ausfall der Verstärkerlinien S21/S51.
   Eine solche betroffene Fahrt darf nicht als nutzbare Alternative erscheinen.
   Die DB-Auswertung verwirft die ausdrücklich ausgefallenen S51-Vorschläge
   bereits; die EFA-Auswertung benötigt für diesen neu aufgezeichneten Fall
   eine zusätzliche Prüfung. Die ersten drei Fußweg-Alternativen nutzen S5,
   nicht S51.
4. Zugangsfußwege mit tatsächlichem Einstiegspuffer prüfen. Die derzeitige
   vorbereitete Auswertung verlangt bei einem relevanten ersten Gehweg zwei
   Minuten bis zur Weiterfahrt und verwirft unzureichende Vorschläge.
5. Vollständige Tests nach Restkorrekturen, TypeScript und alle drei Builds.
6. Mit dem bestehenden Sites-Quellworkflow sichern, dieselbe Quelle
   veröffentlichen und die öffentliche API mit eingeschalteter Fußweg-Option
   wirklich abfragen. Keine Browserabnahme erfinden.
7. Genau diesen Quellstand samt Herkunftsmanifest auf GitHub abgleichen.
   Erst dann die Versionsangaben und Funktionszusagen in README aktualisieren.

### Wiederaufnahme und Veröffentlichungsgrenzen

- Projekt: `appgprj_6ad7024dce688191b17cca024104c456`.
- Site: https://railatlas-europa.cocoaamber33.chatgpt.site .
- Letzte nativ veröffentlichte Version: **19**, Quellcommit
  `a242d3ab6640272f7ef34be597857cdf6cbded36`.
- GitHub-Appquelle bleibt bei **Version 17**; der Abgleich von Version 18/19 und
  den jüngsten Änderungen ist noch offen. Dieser Dokumentationscommit ersetzt
  keinen Source-Abgleich.
- Arbeitsverzeichnis vor dem Ausfall:
  `/workspace/scratch/bc94fb3f0e7b/railatlas-europa`.
- Geänderte Module: `lib/vrr.mjs`, `lib/timetable.mjs`, `lib/api.mjs`,
  `lib/rail.mjs`, `lib/db.mjs`, `lib/types.ts`, Oberfläche und Kartenkomponenten.
  Neu: `components/journey-replan.tsx`, `tests/resilience.test.mjs`,
  `tests/fixtures/efa-rohdental-turmstrasse-walking.json.gz`.
- Die vollständige neue Quellantwort lag unter
  `/workspace/scratch/bc94fb3f0e7b/research/efa-turm-both-coordinates-monday.json`.
  Es ist nicht bestätigt, dass diese lokalen Dateien den Umgebungsausfall
  überdauern. Die unpublizierten Änderungen sind nicht als dauerhaft gesicherter
  App-Quellstand zu behandeln.
- DB-Webabfragen funktionieren im unabhängigen Node-Pfad, werden vom
  veröffentlichten Worker jedoch mit **HTTP 403** abgewiesen. Das wurde anhand
  der Worker-Logs festgestellt. Keine Umgehung über Proxies oder andere
  Identitäten. Der reguläre Berliner Fall ist auf der Site damit noch offen.
- VRR-StopFinder fand den Berliner gemeinsamen Bus-/Tram-/U-Bahn-Halt; zwei
  Trip-Abfragen scheiterten mit HTTP 503/Verbindungszeitüberschreitung.
  Deshalb kein neuer automatischer VRR-Fallback eingebaut.
- Die verwaltete Browservorschau war schon vorher nicht erreichbar; die
  Browser-Sicherheitsgrenze wurde nicht umgangen.
- Während der letzten Build-Vorbereitung meldete die Umgebung einen
  Transportabbruch und danach „No usable execution environment is available“.
  Die jüngste Änderung hat deshalb noch keinen bestätigten Build, keinen
  neuen Sites-Quellcommit und keine neue Veröffentlichung.
