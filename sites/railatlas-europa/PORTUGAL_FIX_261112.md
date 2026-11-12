# Portugal: Halte finden und auswählen

Ausgangs-Freeze: Sites 45, Commit `124278b26b868ddd52799f96e544d385a0b60ca1`.
GitHub-Ausgangsstand separat auf `freeze/261112-current` gesichert; historisch
bestätigte Version 12 auf `freeze/261112-v12-verified`. Kein Funktions-Freeze
der neuen Korrektur und keine Aussage über vollständige Portugal-Abdeckung.

## Reproduzierte Ursachen

- Grundkatalog: nur 47 portugiesische Einträge. Er ist kein vollständiges ÖPNV-Netz.
- Im Ausgangsstand sind Bus, S-Bahn, Metro und Tram auf der Karte ausgeschaltet;
  allgemeine Halte werden erst ab Zoom 12 geladen.
- Die europäische Namenssuche verwendet die vorhandene Transitous-GTFS-Suche
  bisher nicht. Die Live-Abfrage liefert `pt-Metro-Lisboa_MP`, Marquês de Pombal,
  einschließlich Originalkoordinaten und `Europe/Lisbon`; die bisherige Suche
  findet diesen Halt in der Probe nicht.
- Vorhandene Halte eines Verkehrsmittels verhindern die Karten-Ergänzung für
  andere fehlende Verkehrsmittel. In zentralen Lissabonner Ausschnitten liefert
  die GTFS-Karte Bus/Metro, aber keine Tramhalte.
- Standortübernahme in Europa verwendet bisher nur den kleinen Grundkatalog.

## Korrektur im bestehenden Pfad

Alle fünf europäischen Halteebenen voreingeschaltet; direkter Zoomknopf
„Halte hier anzeigen“. Europäische Namenssuche nutzt auch die vorhandene
GTFS-Suche und erhält deren Kennungen. Fehlende Kartenebenen werden einzeln
ergänzt, ohne vorhandene Halte zu entfernen. Quellenfehler bleiben sichtbar.
Standort-/Kartenpunktübernahme verwendet dieselbe bereits vorhandene lokale
Netzsuche wie Mexiko; bei fehlenden Halten bleibt ein expliziter Koordinatenpunkt.
Portugiesische Zeitzonen sind wählbar; native Quellzeitzone bzw. ein bestätigter
portugiesischer Festland-Katalogpunkt kann die Startzeitzone übernehmen.

## Grenzen und Nachweise

Live im bisherigen Sites-Browser: im Lissabonner Ausschnitt 8 Bahn-, 22 S-Bahn-,
43 Metro-, 15 Tram- und 1.628 Bushalte. Der Ausschnitt enthält auch angrenzende
Netze; das bestätigt insbesondere keine vollständige Carris-Tramabdeckung.
Zentrale Ausschnitte ohne Tram zeigen die noch fehlende Datenabdeckung.
Die ergänzende OSM-Quelle war in der Probe nicht verfügbar. Fehlende Halte
werden nicht erfunden; die Warnung bleibt bei nutzbaren anderen Halten sichtbar.

Die verwaltete Vorschau zeigt die UI-Korrektur, meldet aber Fehler bei externen
Quellen. Sie ist kein Live-Fahrplannachweis. Echte Geräte-GPS-Freigabe wurde
nicht angefordert. Abschließende Prüfung erfolgt auf der veröffentlichten App.

Die kleine neue Geocode-Fixture enthält zwei öffentliche Quelltreffer vom
12.11.2026. Die beiden Ergänzungs-/Ausfalltests benutzen ausdrücklich
kontrollierte OSM-Testobjekte, keine behaupteten Live-Halte.

Quellenbedingungen: https://transitous.org/api/ und
https://transitous.org/sources/; OSM-Daten unter ODbL mit Attribution.

Validierung vor dem Speichern: 173/173 Node-Tests, TypeScript und Sites-,
GitHub-Pages- sowie Standalone-Produktionsbuild erfolgreich.
