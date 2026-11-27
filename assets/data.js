// ─────────────────────────────────────────────────────────────
//  Grundeinstellungen der Seite (Links).
//  Events werden im Admin-Bereich (Backstage) gepflegt und in Supabase
//  gespeichert. Die Events hier unten sind nur Beispieldaten für den
//  Demo-Modus (wenn assets/config.js leer ist).
// ─────────────────────────────────────────────────────────────
window.MS_DATA = {
  instagram: "https://www.instagram.com/musikscout.berlin/",
  instagramHandle: "@musikscout.berlin",
  paypal: "https://www.paypal.com/qrcodes/p2pqrc/2Q7FT9G8RT8H4",

  events: [
    {
      id: "2026-11-24",
      edition: "#01",
      date: "2026-11-24",
      venue: "Madame Claude",
      address: "Lübbener Str. 19, 10997 Berlin",
      time: "7 PM – 2 AM",
      tickets: "",
      poster: "assets/events/2026-11-24/poster.jpg",
      live: [
        { name: "Tontom", link: "", photo: "assets/events/2026-11-24/tontom.jpg" },
        { name: "Stirling Trig", link: "", photo: "assets/events/2026-11-24/stirling-trig.jpg" },
        { name: "Cal De Luce", link: "", photo: "assets/events/2026-11-24/cal-de-luce.jpg" },
      ],
      dj: { name: "Raphaël Barninka", from: "11 PM", link: "", photo: "assets/events/2026-11-24/raphael-barninka.jpg" },
      genres: ["rap", "jazz", "indie"],
      is_open: false,
      spin_result: "",
    },
  ],
};
