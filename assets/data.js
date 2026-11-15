// ─────────────────────────────────────────────────────────────
//  Alle Inhalte der Seite. Neues Event = neuen Eintrag oben einfügen.
//  "id" ist gleichzeitig der Schlüssel fürs Voting (QR-Code-Link).
// ─────────────────────────────────────────────────────────────
window.MS_DATA = {
  instagram: "https://www.instagram.com/musikscout.berlin/",
  email: "hallo@musikscout.berlin", // TODO: echte Adresse eintragen

  events: [
    {
      id: "2026-11-24",
      edition: "#01",
      date: "2026-11-24",
      weekday: "TUE",
      venue: "Madame Claude",
      address: "Lübbener Str. 19, 10997 Berlin",
      time: "7 PM – 2 AM",
      tickets: "", // optional: Link zu Tickets/RSVP
      live: [
        { name: "Tontom", link: "" },
        { name: "Stirling Trig", link: "" },
        { name: "De Luce", link: "" },
      ],
      dj: { name: "Raphaël Barninka", from: "11 PM", link: "" },
      winner: "", // nach dem Abend eintragen, erscheint dann im Archiv
    },
  ],
};
