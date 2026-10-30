# RailAtlas 38 – Startzeitzone in Mexiko und Flughafen-Gegenprobe

Sites-Quellcommit `4163d1d31cb18acda4ed3d2375fbbdeeae129fa7`.
1.027 gespiegelt identische Quelldateien; das generierte `tsconfig.tsbuildinfo`
ist wie bisher vom Herkunftsmanifest ausgenommen.

## Tatsächlich untersuchter Fall

Das gemeldete Bildschirmfoto zeigt Playa del Carmen → CUN ohne Fahrplanantwort.
Der dortige Startpunkt 20.4000, −87.3192 liegt rund 36 km vom hinterlegten
Playa-Navigationszentrum entfernt. Ein Ursprung dieses früheren Treffers wurde
nicht nachgewiesen. Die aktuelle öffentliche Suche liefert den OSM-/Photon-
Stadtpunkt bei 20.6463, −87.0808; Quellkoordinaten werden nicht umgeschrieben.

Öffentliche Fahrplanabfragen für den 31.10.2026 um 09:00 America/Cancun:

- Playa del Carmen (aktueller Stadtpunkt) → Cancún International Airport (CUN):
  Transitous liefert keine Fahrplanverbindung.
- Playa Express – ADO (erfasster OSM-Halt) → Terminal 2 (erfasster Terminalpunkt):
  dieselbe fachlich leere Fahrplanantwort.

Das ist kein Nachweis, dass kein Bus fährt. Der konkrete ADO-Fahrplan ist weiter
nicht als eigener Feed integriert. Der offizielle Anbieterlink bleibt verfügbar;
Endpunktprüfung und fehlende Fußwegbestätigungen werden nicht aufgeweicht.
Die im Bildschirmfoto ausgeschalteten Bus-/Colectivo-Kartenebenen steuern nur
die Anzeige; sie sind kein Verkehrsmittelfilter für die Reiseabfrage.

## Korrektur

Reproduziert: Startauswahl „Playa del Carmen“ ließ bislang America/Mexico_City
stehen. Jetzt haben Anbieterangaben Vorrang. Fehlen sie, können ausdrücklich
benannte bekannte Stadtgebiete in bis zu 60 km Entfernung, Ortszentren in bis
zu 10 km Entfernung sowie Flughäfen/Terminals mit begrenztem Ortskontext die
Startzeitzone setzen. Ferne, ausländische, ungültige oder unbekannte Punkte
bekommen keine pauschale Zeitzone. Koordinaten und Namen bleiben unverändert.

Startauswahl, Karte/Standort mit übernommenem Halt, Start-Ziel-Tausch,
automatisch aufgelöste Texteingaben und Neuplanung verwenden denselben Helfer.
Ziel und Zwischenziel setzen die Startzeitzone nicht. Der bisher eingestellte
Zeitpunkt bleibt bei einem Zeitzonenwechsel erhalten. Eine nach der Startauswahl
manuell gewählte Zeitzone wird beim Suchen nicht wieder überschrieben.

## Prüfung

146 App-Regressionen, TypeScript sowie Worker-, eigenständiger Client- und
GitHub-Pages-Produktionsbuild erfolgreich. Dateiabgleich gegen das
Herkunftsmanifest erfolgreich. Die neue Regression enthält Playa-Stadt und
-Bushalt, Terminal 2, CUN, Kartenkoordinate, den früheren Stadtgebietspunkt,
native Anbieterzeitzone, entfernte Namensgleichheit, ungültige/ausländische
Koordinaten und Tijuana.

Die verwaltete Vorschau startet wegen eines gemeldeten bestehenden
vinext-Entwicklungsprozesses nicht; Stoppen/Neustart über die Vorschauverwaltung
behob dies nicht. Bedienprüfung deshalb an der öffentlichen Sites-Version 38:

- Aus Mexiko-Standardansicht mit America/Mexico_City und 31.10.2026, 09:00
  übernommenes Playa del Carmen setzt America/Cancun und 10:00.
- MEX als Ziel belässt America/Cancun.
- Start/Ziel tauschen setzt America/Mexico_City und 09:00; zurücktauschen setzt
  America/Cancun und 10:00. Start- und Zielnamen bleiben erhalten.
- CUN als Zwischenziel belässt America/Cancun; das Zwischenziel lässt sich entfernen.
- Nachträglich manuell America/Mexico_City gewählt: die echte Suche läuft durch
  und belässt diese Auswahl auch nach der leeren Fahrplanantwort.
- Startfeld geleert und „Playa del Carmen“ ohne Übernahme eines Vorschlags
  eingegeben: die Planung löst den Ort auf, setzt America/Cancun / 10:00 und
  läuft bis zur fachlich leeren Antwort durch; kein Abbruch durch Zeitzonenwechsel.
