// Datenschicht: Supabase (über REST, ohne SDK) oder Demo-Modus im Browser.
// Demo-Modus = config.js leer. Dann kommen Events aus data.js und alles
// (Stimmen, Admin-Änderungen) wird nur lokal in diesem Browser gespeichert.
(function () {
  const C = window.MS_CONFIG || {};
  const DEMO = !C.supabaseUrl || !C.supabaseAnonKey;
  const URL_ = (C.supabaseUrl || "").replace(/\/$/, "");
  const DEFAULT_GENRES = ["rap", "jazz", "indie"];

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  const WD = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = () => {
    const d = new Date(); d.setHours(d.getHours() - 6); // Abend zählt bis 6 Uhr früh noch als "heute"
    return d.toISOString().slice(0, 10);
  };

  // DB-Zeile ↔ Event-Objekt der Seite
  const fromRow = (r) => ({
    id: r.id, edition: r.edition || "", date: String(r.date).slice(0, 10), venue: r.venue || "",
    address: r.address || "", time: r.time_label || r.time || "", tickets: r.tickets || "", poster: r.poster || "",
    live: Array.isArray(r.live) ? r.live : [], dj: r.dj && r.dj.name ? r.dj : null,
    genres: Array.isArray(r.genres) && r.genres.length ? r.genres : DEFAULT_GENRES.slice(),
    is_open: !!r.is_open, spin_result: r.spin_result || "",
  });
  const toRow = (e) => ({
    id: e.id, edition: e.edition || "", date: e.date, venue: e.venue || "", address: e.address || "",
    time_label: e.time || "", tickets: e.tickets || "", poster: e.poster || "", live: e.live || [],
    dj: e.dj && e.dj.name ? e.dj : null, genres: e.genres && e.genres.length ? e.genres : DEFAULT_GENRES,
    is_open: !!e.is_open, spin_result: e.spin_result || "",
  });
  const decorate = (e) => Object.assign(e, { weekday: WD[new Date(e.date + "T12:00:00").getDay()] });

  // ── REST ──
  function headers(auth) {
    // Ohne Login reicht der apikey-Header (funktioniert mit "publishable" und altem "anon"-Key).
    const s = auth ? ls.get("ms-session", null) : null;
    const h = { apikey: C.supabaseAnonKey, "Content-Type": "application/json" };
    if (s) h.Authorization = "Bearer " + s.access_token;
    return h;
  }
  async function req(path, opts = {}, auth = false) {
    const r = await fetch(URL_ + path, Object.assign({ headers: headers(auth) }, opts));
    if (r.status === 401 && auth) { ls.set("ms-session", null); throw new Error("SESSION"); }
    if (!r.ok) throw new Error(await r.text());
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }
  const rpc = (fn, args) => req(`/rest/v1/rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });

  // ── Demo-Speicher ──
  function demoEvents() {
    let evs = ls.get("ms-demo-events-v2", null);
    if (!evs) {
      evs = (window.MS_DATA ? window.MS_DATA.events : []).map((e) => ({ ...e }));
      ls.set("ms-demo-events-v2", evs);
    }
    return evs;
  }

  function deviceId() {
    let id = ls.get("ms-device", null);
    if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); ls.set("ms-device", id); }
    return id;
  }
  const randCode = () => Math.random().toString(16).slice(2, 6).toUpperCase();

  const DB = {
    DEMO,
    today,
    DEFAULT_GENRES,

    async listEvents() {
      const rows = DEMO ? demoEvents().map((e) => fromRow({ ...e, time_label: e.time })) : (await req("/rest/v1/events?select=*&order=date.asc")).map(fromRow);
      return rows.map(decorate).sort((a, b) => a.date.localeCompare(b.date));
    },

    async getEvent(id) {
      return (await this.listEvents()).find((e) => e.id === id) || null;
    },

    // ?e=ID oder das nächste/heutige Event
    async currentEvent() {
      const evs = await this.listEvents();
      const id = new URLSearchParams(location.search).get("e");
      if (id) return evs.find((e) => e.id === id) || null;
      return evs.find((e) => e.date >= today()) || evs[evs.length - 1] || null;
    },

    // ── Genre-Spiel ──
    // Eigene Stimme: { genre, code } oder null
    async myVote(ev) {
      const local = ls.get("ms-vote-" + ev.id, null);
      if (local || DEMO) return local;
      const r = await rpc("my_vote", { p_event: ev.id, p_device: deviceId() }).catch(() => null);
      if (r && r.genre) ls.set("ms-vote-" + ev.id, r);
      return r && r.genre ? r : null;
    },

    // Rückgabe: { status: "ok" | "already" | "closed", genre?, code? }
    async cast(ev, genre) {
      if (DEMO) {
        const mine = ls.get("ms-vote-" + ev.id, null);
        if (mine) return { status: "already", ...mine };
        const fresh = demoEvents().find((e) => e.id === ev.id);
        if (!fresh || !fresh.is_open) return { status: "closed" };
        const k = "ms-demo-votes-" + ev.id, c = ls.get(k, {});
        c[genre] = (c[genre] || 0) + 1; ls.set(k, c);
        const v = { genre, code: randCode() };
        ls.set("ms-vote-" + ev.id, v);
        return { status: "ok", ...v };
      }
      const res = await rpc("cast_vote", { p_event: ev.id, p_genre: genre, p_device: deviceId() });
      if (res && res.genre) ls.set("ms-vote-" + ev.id, { genre: res.genre, code: res.code });
      return res;
    },

    async results(ev) { // { genre: count }
      if (DEMO) return ls.get("ms-demo-votes-" + ev.id, {});
      const out = {};
      (await rpc("vote_results", { p_event: ev.id })).forEach((r) => (out[r.genre] = Number(r.votes)));
      return out;
    },

    // ── Admin ──
    session: () => (DEMO ? ls.get("ms-demo-session", null) : ls.get("ms-session", null)),

    async signIn(email, password) {
      if (DEMO) { ls.set("ms-demo-session", { email }); return true; }
      const r = await fetch(URL_ + "/auth/v1/token?grant_type=password", {
        method: "POST", headers: { apikey: C.supabaseAnonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) return false;
      const s = await r.json();
      ls.set("ms-session", { access_token: s.access_token, email: s.user && s.user.email, exp: Date.now() + (s.expires_in || 3600) * 1000 });
      const ok = await req("/rest/v1/rpc/is_admin", { method: "POST", body: "{}" }, true).catch(() => false);
      if (!ok) { ls.set("ms-session", null); return false; }
      return true;
    },

    isAdmin() {
      if (DEMO) return !!ls.get("ms-demo-session", null);
      const s = ls.get("ms-session", null);
      return !!(s && (!s.exp || s.exp > Date.now()));
    },

    signOut() { ls.set("ms-session", null); ls.set("ms-demo-session", null); },

    async saveEvent(ev, oldId) {
      if (DEMO) {
        const evs = demoEvents().filter((e) => e.id !== (oldId || ev.id));
        const { weekday, ...clean } = ev;
        evs.push(clean); ls.set("ms-demo-events-v2", evs); return;
      }
      await req("/rest/v1/events", {
        method: "POST", body: JSON.stringify(toRow(ev)),
        headers: Object.assign(headers(true), { Prefer: "resolution=merge-duplicates,return=minimal" }),
      }, true);
    },

    async updateEvent(id, patch) { // erlaubt: is_open, spin_result
      const row = {};
      if ("is_open" in patch) row.is_open = patch.is_open;
      if ("spin_result" in patch) row.spin_result = patch.spin_result;
      if (DEMO) {
        ls.set("ms-demo-events-v2", demoEvents().map((e) => (e.id === id ? { ...e, ...row } : e))); return;
      }
      await req(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(row) }, true);
    },

    async deleteEvent(id) {
      if (DEMO) { ls.set("ms-demo-events-v2", demoEvents().filter((e) => e.id !== id)); return; }
      await req(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }, true);
    },

    async resetVotes(id) {
      if (DEMO) { ls.set("ms-demo-votes-" + id, {}); ls.set("ms-vote-" + id, null); return; }
      await req(`/rest/v1/votes?event_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }, true);
    },
  };

  window.MS_DB = DB;
})();
