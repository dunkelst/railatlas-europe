# Ausweichsuche und Neuplanung während der Reise

Verbindliche Anforderungen von Steffen vom 24.10.2026; Stand 25.10.2026.

## In Version 20 umgesetzt

- Freiwillige Fußweg-Notlösungen im automatischen Modus, zunächst ausgeschaltet.
  15/30/60 Minuten und höchstens 3 km je Teilstrecke, einschließlich der Fußwege
  innerhalb der jeweiligen Reise. Fehlende oder unplausible Wege werden nicht
  als passende Notlösung ausgegeben.
- Bis zu drei zusätzliche vollständige EFA-Reisen innerhalb der bestehenden
  Vergleichsauswahl; Linienfolge, Ankunft, Umstiege und Gehzeit bleiben sichtbar.
- Fußwege dieser Reisen rot gestrichelt, mit Fußsymbol und Text. Rot bedeutet
  Ausweichoption, keine bestätigte Sperrung des Fußwegs. Keine reine Farbcodierung.
- Quellgehwege statt Luftlinien, 30-m-Endpunktkontrolle und eigene Koordinaten-IDs
  für Adressen. Ein Kartensymbol allein bestätigt keine funktionierende Linie.
- Früherer Start eines anfänglichen Gehwegs aus unveränderter Quellgehzeit für
  mindestens zwei Minuten Reserve vor Einstieg, ausdrücklich als berechnet
  gekennzeichnet. Quelle und ursprüngliche Fußwegzeiten bleiben im Ergebnis
  erhalten; keine geänderten Fahrzeugzeiten und kein Start vor der Anfragezeit.
- Nutzerabbruch, tatsächliche Ausfälle, informative-only-Status, unplausible
  Anschlüsse und ausdrücklich nicht berücksichtigte Störungen bleiben verbindlich.
  Nur wirklich leere Antworten erlauben die beiden folgenden Kalendertage.
- „Ab hier neu planen“ übernimmt einen gewählten Reisehalt. Gefahrene Teile
  entfallen; offene Zwischenziele mit Aufenthalt und das Endziel bleiben.
  Tatsächlicher Halt und Abfahrtszeit müssen sichtbar geprüft werden.

## Nachgewiesen

72 App-Regressionen, TypeScript und alle drei Builds bestanden. Version 20 mit
Quelle `9e4953340c2fb3a0afc23beac2275b2e597e6e50` ist nativ veröffentlicht.
Öffentliche API und unabhängiger Node-HTTP-Pfad bestätigen je drei Optionen:

- Rohdental → gewählter Punkt nahe U Turmstraße am 26.10.2026, erste Reise
  06:53–12:49 Europe/Berlin. Bus 27/20, S5, ICE 553, S7 und Quellfußwege;
  29 Minuten zu Fuß insgesamt. Der aktuelle Live-Fußweg aus Bellevue liegt
  bei rund 1,2 km/20 Minuten; Quellverläufe können sich zwischen Abfragen ändern.
- Tannenweg → Punkt am Bahnhof Hessisch Oldendorf, 06:45–07:14. Anfangs
  341 m/sechs Minuten zu Fuß, dann zwei Minuten Reserve für Bus 27 um 06:53.

S51 ist in der aufgezeichneten Antwort unmöglich und als ausgefallen markiert.
Auch Statuslisten und die tatsächliche informative-only-Schreibweise werden
geprüft; Hinweise verworfener Reisen bleiben erhalten. Die Figur „erst zurück,
trotzdem früher ankommen“ ist durch ein künstliches Testnetz belegt, ausdrücklich
kein zusätzlicher Live-Fahrplan. 65 m Endpunktabweichung wird abgewiesen.

## Für die finale Ausweichplanung noch auszubauen

1. Verschiedene erreichbare Halte und Linien gezielt untersuchen, statt allein
   auf die von einer Auskunft gelieferten Näherungsalternativen angewiesen zu sein.
2. Weitere Umstiegspunkte einschließlich Rückfahrt und anfänglicher Bewegung vom
   Ziel weg suchen. Geografische Zielannäherung darf keine Zulassungsbedingung
   werden. Entscheidend sind vollständige bestätigte Reisen und bessere Ankunft.
3. Solche Alternativen ausdrücklich erkennbar und einblendbar machen. Aus einer
   geografischen Richtung darf ohne Liniendaten keine betriebliche Gegenrichtung
   behauptet werden.
4. Eine übergreifende Budgetoptimierung über alle Zwischenziele ergänzen, wenn sie
   benötigt wird. Die aktuelle Oberfläche nennt bewusst das Budget je Teilstrecke.
5. Weitere zulässig nutzbare Fahrplanquellen und reale Störungsfälle prüfen.
   Europaweite vollständige Live-Abdeckung ist nicht bestätigt.

Eine Notlösung darf reguläre Optionen nicht stillschweigend ersetzen. Fußwege,
Umstiege, Wartezeiten und früheste Ankunft bleiben vergleichbar. Ein gespeicherter
inzwischen ausgefallener Vorschlag ist keine gültige Weiterreise. Eine leere
Meldungsliste beweist keinen störungsfreien Betrieb.

## Betriebsgrenzen

Die öffentliche Testfreigabe bleibt erhalten. DB-Webanfragen wurden vom Worker
mit HTTP 403 abgewiesen; der unabhängige Node-Pfad funktioniert für den früher
aufgezeichneten Fall. Kein Proxy- oder Identitätswechsel zur Umgehung. Die
zusätzliche Fußweg-Abfrage nutzt die bereits angebundene EFA-Quelle.

Neue visuelle Browserabnahme offen; die bekannte Vorschau-/Sicherheitsgrenze
wurde nicht umgangen. Die Zugänglichkeit jedes Fußwegs ist nicht live bestätigt.
GitHub-Appquelle entspricht Version 20; die bisherige Pages-Veröffentlichung
bleibt bis zur Einrichtung eines eigenen HTTPS-Auskunftsservers auf Version 12.

Der ältere Umgebungsausfall ist überwunden. Die aktuelle Quelle ist gesichert;
der damalige Dokumentationscheckpoint wird nicht als App-Veröffentlichung gezählt.
