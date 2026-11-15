# musik scout · Berlin

Website für **musik scout**, eine Live-Musik-Reihe in Berlin: drei Live-Acts, ein DJ, und das Publikum stimmt per QR-Code über den Favoriten des Abends ab.

Reines HTML/CSS/JS, kein Build-Schritt. Läuft auf jedem statischen Hosting (aktuell GitHub Pages). Events und Stimmen liegen in einer kostenlosen Supabase-Datenbank.

## Seiten

| Seite | Wofür |
|---|---|
| `index.html` | One-Pager: nächster Abend, Konzept, Archiv mit Gewinnern, Bewerbung „Play at musik scout“ |
| `vote.html` | Abstimmung fürs Handy (über den QR-Code). Danach: nächster Termin + Instagram |
| `results.html` | Live-Ergebnis für den Beamer, mit QR-Code. `?hide=1` versteckt die Zahlen bis zur Auflösung |
| `qr.html` | Druckbares A4-Plakat mit QR-Code |
| `backstage-b0ivr8/` | **Admin-Bereich** (geheimer Link + Login) |

Alle Seiten nehmen `?e=EVENT-ID` (z. B. `?e=2026-11-24`), sonst automatisch das nächste Event.
Sprache: Englisch als Standard, Umschalter EN/DE. Texte in `assets/i18n.js`.

## Admin-Bereich (Backstage)

Erreichbar nur über den direkten Link `…/backstage-b0ivr8/`, nirgends auf der Seite verlinkt. Geschützt wird er aber durch den **Login**, nicht durch den Link. Das Repo ist öffentlich, der Ordnername ist also für Neugierige auffindbar. Ordner umbenennen geht jederzeit.

Dort kann man:
- Events anlegen und bearbeiten (Datum, Location, Line-up, DJ, Ticket-Link)
- Voting öffnen und schließen
- Live-Ergebnis sehen, Gewinner speichern (erscheint dann im Archiv), Test-Stimmen zurücksetzen
- Beamer-Ansicht öffnen, QR-Plakat drucken, Voting-Link kopieren

## Einrichtung (einmalig, ca. 10 Minuten, kostenlos)

Ohne Einrichtung läuft alles im **Demo-Modus**: Events kommen aus `assets/data.js`, Änderungen und Stimmen bleiben nur im eigenen Browser. Im Backstage funktioniert dann jede E-Mail und jedes Passwort.

1. Auf [supabase.com](https://supabase.com) ein kostenloses Projekt anlegen (Region Frankfurt).
2. **SQL Editor** → Inhalt von `supabase/schema.sql` einfügen → **Run**.
3. **Authentication → Users → Add user**: E-Mail + Passwort für den Admin (Auto Confirm an).
4. **Authentication → Sign In / Providers**: „Allow new users to sign up“ **ausschalten**.
5. Im SQL Editor: `insert into admins (user_id) select id from auth.users where email = 'deine@mail.de';`
6. **Project Settings → API**: „Project URL“ und „anon public“-Key in `assets/config.js` eintragen, committen.

Der anon-Key ist öffentlich gedacht. Schreiben dürfen nur eingeloggte Admins (durch Regeln in der Datenbank abgesichert).

## Am Abend

1. Backstage → Event → **Voting öffnen**
2. `results.html` auf den Beamer, QR-Plakate an die Bar
3. Am Ende **Voting schließen**, Gewinner speichern

Pro Handy ist eine Stimme möglich (Geräte-ID + Sperre in der Datenbank). Wer seine Browserdaten löscht, kann erneut abstimmen. Für einen Abend in der Bar ist das ein vernünftiger Kompromiss.

## Sonstiges

- Instagram-Link und Bewerbungs-E-Mail: `assets/data.js`
- Das Bewerbungsformular öffnet aktuell das Mailprogramm (kein Server nötig).
- Lokal ansehen: `python3 -m http.server` → http://localhost:8000
- Ideen und Planung: [`ROADMAP.md`](ROADMAP.md)
