# RailAtlas 37 – Deutsch, Englisch und Spanisch

Veröffentlichter Sites-Quellstand `7684cffd0630511fc888a24136c5e001bbd035d2`.
Die GitHub-Ausgabe übernimmt dieselben 1.027 Quelldateien; nur das generierte
`tsconfig.tsbuildinfo` ist wie bisher vom Herkunftsmanifest ausgenommen.

Die Kopfzeile bietet Deutsch, English und Español unabhängig von der Region.
Eine gewählte Sprache bleibt browserlokal erhalten; ein gültiges `lang` im URL
hat beim Öffnen Vorrang. Nicht unterstützte Werte fallen auf eine gespeicherte
Sprache beziehungsweise Deutsch zurück. Umschalten benötigt keinen Seitenwechsel
und erhält Ziele, Zwischenziele, Aufenthalte, Zeitzone und vorhandene Ergebnisse.

373 eigene Oberflächentexte enthalten englische und spanische Übersetzungen:
Planer, Suche, Kartenebenen und deren Aktionen, Netzmeldungen, Reiseverlauf,
Neuplanung, Datenhinweise und eigene Fehler. Datum, Länder und Zahlen nutzen
Intl mit der gewählten Sprache; die ausdrücklich gewählte Reisezeitzone bleibt
erhalten. Fahrzeiten erscheinen weiterhin im 24-Stunden-Format. Tatsächliche
Orts-, Halte-, Linien- und Betreibernamen werden nicht umgeschrieben. Originale
Verkehrsmeldungen der Anbieter bleiben erhalten und sind entsprechend markiert.
Eine vollständige automatische Übersetzung beliebiger Fremdmeldungen wird
nicht behauptet.

## Automatische Prüfung

- 145 App-Regressionen erfolgreich, davon fünf neue Sprachprüfungen.
- TypeScript erfolgreich.
- Worker-, eigenständiger Client- und GitHub-Pages-Produktionsbuild erfolgreich.
- Vollständiger Dateiabgleich gegen das Herkunftsmanifest erfolgreich.
- Die Sprachtests prüfen ungültige Präferenzen, URL-/Speicherpriorität,
  Wert- und Namenerhalt in dynamischen Meldungen, zusammengesetzte Netztexte,
  Platzhalterkonsistenz und unveränderte Reisezeitpunkte bei Locale-Wechsel.

## Praktische öffentliche Browserprüfung

Die interne Vorschau meldete eine laufende Adresse, war im Testbrowser jedoch
mit `ERR_CONNECTION_REFUSED` nicht erreichbar. Die Bedienprüfung erfolgte an der
öffentlichen Veröffentlichung im selben Durchlauf:

- Deutsch → Englisch → Spanisch und zurück: Menüs, Eingabebezeichnungen,
  Kartenebenen, Zoom-Aktionen und Dokumenttitel wechseln.
- Heilbronn Hbf → Würzburg Hbf: echte öffentliche Fahrplanabfrage, 29.10.2026,
  RE8 20:48–22:20 Europe/Berlin. Das Ergebnis blieb beim Sprachwechsel erhalten;
  der spanische Verlauf zeigt 1 h 32 min, unveränderte Halte und Gleis 3.
- CUN-Suche unter spanischer Oberfläche: Cancún International Airport (CUN),
  Land México, übersetzte Gebiet-/Zugangshinweise. Die Übernahme bleibt beim
  Wechsel zurück auf Deutsch erhalten; America/Cancun bleibt gewählt.
- Erneutes Öffnen der öffentlichen Basisadresse ohne `lang` bestätigt die zuvor
  gewählte spanische Oberfläche samt `html lang=es` und spanischem Dokumenttitel.
- Endfassung 37: schneller Regionswechsel nach erneutem Laden lässt beide
  Reiseeingaben leer, anstatt verspätet Heilbronn/Würzburg zurückzusetzen. Die
  Regionsprüfung verhindert nur diese veraltete Initialisierung.

Die mexikanische Fahrplanabdeckung und insbesondere die fehlende interne
ADO-Flughafenbus-Anbindung bleiben die in Version 34 dokumentierten Grenzen.
Die Sprachwahl ändert weder Quellen noch Endpunkt-, Störungs- oder Gehwegprüfungen.
