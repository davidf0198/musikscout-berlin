# musik scout · Berlin

Website für **musik scout**, eine Live-Musik-Reihe in Berlin: drei Live-Acts, ein DJ, und das Publikum stimmt per QR-Code über den Favoriten des Abends ab.

Reines HTML/CSS/JS, kein Build-Schritt. Läuft auf jedem statischen Hosting (GitHub Pages, Netlify, Vercel, IONOS Deploy Now …).

## Seiten

| Datei | Wofür |
|---|---|
| `index.html` | One-Pager: nächster Abend, Konzept, Archiv mit Gewinnern, Bewerbung „Play at musik scout“ |
| `vote.html` | Abstimmungsseite fürs Handy (wird über den QR-Code geöffnet) |
| `results.html` | Live-Ergebnis für Beamer/Screen am Abend, inkl. QR-Code. `?hide=1` versteckt die Zahlen bis zur Auflösung |

Sprache: Englisch als Standard, Umschalter EN/DE oben rechts. Alle Texte stehen in `assets/i18n.js`.

## Inhalte pflegen

Alles in **`assets/data.js`**:
- Neues Event → neuen Eintrag in `events` anlegen (Datum, Venue, Line-up, DJ, optional Ticket-Link).
- Nach dem Abend → `winner` eintragen. Das Event rutscht automatisch ins Archiv.
- Instagram-Link und E-Mail für Bewerbungen ebenfalls dort.

## Voting

Ohne Einrichtung läuft das Voting im **Demo-Modus**: Stimmen werden nur im eigenen Browser gezählt. Das reicht zum Ausprobieren.

Für echte Abende (kostenlos, ca. 10 Minuten):
1. Auf [supabase.com](https://supabase.com) ein kostenloses Projekt anlegen.
2. **SQL Editor** → Inhalt von `supabase/schema.sql` einfügen → **Run**.
3. **Project Settings → API**: „Project URL“ und „anon public“-Key in `assets/config.js` eintragen.

Am Abend:
- Abstimmung öffnen: im SQL Editor `update voting_events set is_open = true where event_id = '2026-11-24';`
- `results.html` auf den Beamer, der QR-Code führt zu `vote.html?e=2026-11-24`.
- Am Ende `is_open = false` setzen.

Für jedes neue Event in Supabase eine Zeile anlegen (siehe Ende von `schema.sql`). Die Act-Namen müssen genau wie in `data.js` geschrieben sein.

Pro Handy ist eine Stimme möglich (Geräte-ID + Sperre in der Datenbank). Wer seine Browserdaten löscht, kann erneut abstimmen. Für einen Abend in der Bar ist das ein vernünftiger Kompromiss.

## Bewerbungen

Das Formular öffnet aktuell das Mailprogramm mit allen Angaben (kein Server nötig). Später kann es auf Formspree, Netlify Forms o. Ä. umgestellt werden.

## Lokal ansehen

```
python3 -m http.server
```
→ http://localhost:8000

## Ideen für später
- Eigene Domain (z. B. musikscout.berlin)
- Newsletter-Anmeldung
- Fotos/Aftermovie pro Abend im Archiv
- Kleiner Admin-Button statt SQL zum Öffnen/Schließen des Votings
