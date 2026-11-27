# Ideen & Planung

Sammlung für spätere Ausbaustufen. Noch nichts davon ist umgesetzt, solange es nicht abgehakt ist.

## Verstecktes Minigame (Easter Egg)
- Unauffällig in die Seite eingebaut, soll nicht als Spiel erkennbar sein (z. B. Plattenteller-Logo „scratchen“/drehen, der Lime-Punkt lässt sich fangen, bestimmte Klickfolge auf die Ringe).
- Belohnung: 10 % auf Getränke oder Eintritt bzw. direkter Link zu einem vergünstigten Ticket.
- Achtung: Ein Code, der nur im Browser steckt, lässt sich im Quelltext finden. Besser: Einmal-Codes aus der Datenbank, die an der Bar/Kasse oder im Ticketshop geprüft werden, oder ein versteckter Rabattlink beim Ticketanbieter mit Kontingent.

## Das Spiel (Genre-Voting + Glücksrad)
- [x] Gäste stimmen per QR für ein Genre (Standard: Rap / Jazz / Indie) für den nächsten Abend
- [x] Handy zeigt danach ein „Ticket“ mit Genre + Code und laufender Uhr
- [x] Glücksrad auf dem Beamer (`spin.html`), Ergebnis erscheint live auf allen Tickets (Gewinn = Freigetränk)
- [ ] **Offen:** Zusätzlicher kurzer Fragebogen beim Abstimmen? (optional, noch nicht entschieden: z. B. Instagram-Name freiwillig oder „Wie hast du von uns erfahren?“)

## Voting / QR (frühere Version, ersetzt durch das Spiel)
- [x] Abstimmungsseite `vote.html` (eigene Seite, nicht im Hauptmenü)
- [x] Live-Ergebnis `results.html` mit automatisch erzeugtem QR-Code pro Event
- [x] Nach dem Abstimmen: nächsten Termin und Instagram zeigen (holt Besucher auf die Seite)
- [x] Druckbare QR-Seite (A4) pro Event

## Verwaltung für Nicht-Techniker
- [x] Admin-Bereich mit Login unter geheimem Link: Event anlegen (Datum, Line-up, DJ, Tickets), Voting öffnen/schließen, Gewinner eintragen, QR drucken
- [x] Events aus der Datenbank statt aus `assets/data.js`

## Community-Bereich (Zukunft, grobe Idee)
- Login für Besucher:innen mit eigenem Profil („Portfolio“ der besuchten Abende).
- Teilnahme-Nachweis: Wer ein Ticket gebucht hat (online) oder vor Ort kauft, bekommt einen Code. Damit fügt man den Abend seinem Profil hinzu.
- Nur mit Nachweis: Fotos vom Abend hochladen. Fotos erscheinen nach Freigabe im Admin-Bereich in der Event-Galerie und sind für andere sichtbar.
- Offizielle Fotos vom Veranstalter zusätzlich im selben Bereich.
- Später denkbar: Voting nur für verifizierte Gäste, Stammgast-Vorteile (passt zum Easter-Egg-Rabatt).
- Technisch: Supabase Auth + Storage für Fotos, Moderation über den Admin-Bereich. Datenschutz/Bildrechte beachten (Einwilligung, Löschmöglichkeit).

## Für Künstler:innen
- [x] Bereich nach Flyer „Looking for artists/DJs“: Follow + DM mit Genre/Videos/EPK
- [ ] Live-Videos der Abende einbinden, sobald vorhanden (Platzhalter „Live sessions“ ist schon da)

## Sonstiges
- [ ] Eigene Domain (.de bei INWX/netcup, ca. 5–6 €/Jahr)
- [ ] Newsletter
- [ ] Fotos/Aftermovie pro Abend im Archiv
