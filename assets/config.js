// ─────────────────────────────────────────────────────────────
//  Supabase-Zugang fürs Voting (siehe README → "Voting einrichten").
//  Leer lassen = Demo-Modus: Stimmen werden nur lokal im Browser gezählt.
//  Der "anon"-Key ist öffentlich gedacht und darf hier stehen.
// ─────────────────────────────────────────────────────────────
window.MS_CONFIG = {
  supabaseUrl: "https://vgrrxpsnhpgbzrauwxeb.supabase.co",      // z. B. "https://abcd1234.supabase.co"
  supabaseAnonKey: "sb_publishable_n71qmfNH4Igwz2Hw3VRG4A_0GEprLYK",  // "Publishable key" (sb_publishable_…) oder alter "anon"-Key
};
