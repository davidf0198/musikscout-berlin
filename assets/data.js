// ─────────────────────────────────────────────────────────────
//  Grundeinstellungen der Seite (Instagram, E-Mail).
//  Events werden im Admin-Bereich gepflegt und in Supabase gespeichert.
//  Die Events hier unten sind nur Beispieldaten für den Demo-Modus
//  (solange assets/config.js noch leer ist).
// ─────────────────────────────────────────────────────────────
window.MS_DATA = {
  instagram: "https://www.instagram.com/musikscout.berlin/",
  email: "hallo@musikscout.berlin", // TODO: echte Adresse eintragen

  events: [
    {
      id: "2026-11-24",
      edition: "#01",
      date: "2026-11-24",
      venue: "Madame Claude",
      address: "Lübbener Str. 19, 10997 Berlin",
      time: "7 PM – 2 AM",
      tickets: "",
      live: [
        { name: "Tontom", link: "" },
        { name: "Stirling Trig", link: "" },
        { name: "De Luce", link: "" },
      ],
      dj: { name: "Raphaël Barninka", from: "11 PM", link: "" },
      winner: "",
    },
  ],
};
