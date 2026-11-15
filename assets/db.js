// Datenschicht: Supabase (über REST, ohne SDK) oder Demo-Modus im Browser.
// Demo-Modus = config.js leer. Dann kommen Events aus data.js und alles
// (Stimmen, Admin-Änderungen) wird nur lokal in diesem Browser gespeichert.
(function () {
  const C = window.MS_CONFIG || {};
  const DEMO = !C.supabaseUrl || !C.supabaseAnonKey;
  const URL_ = (C.supabaseUrl || "").replace(/\/$/, "");

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const ss = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  const WD = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = () => {
    const d = new Date(); d.setHours(d.getHours() - 6); // Abend zählt bis 6 Uhr früh noch als "heute"
    return d.toISOString().slice(0, 10);
  };

  // DB-Zeile ↔ Event-Objekt der Seite
  const fromRow = (r) => ({
    id: r.id, edition: r.edition || "", date: String(r.date).slice(0, 10), venue: r.venue || "",
    address: r.address || "", time: r.time_label || "", tickets: r.tickets || "",
    live: Array.isArray(r.live) ? r.live : [], dj: r.dj && r.dj.name ? r.dj : null,
    winner: r.winner || "", is_open: !!r.is_open,
  });
  const toRow = (e) => ({
    id: e.id, edition: e.edition || "", date: e.date, venue: e.venue || "", address: e.address || "",
    time_label: e.time || "", tickets: e.tickets || "", live: e.live || [],
    dj: e.dj && e.dj.name ? e.dj : null, winner: e.winner || "", is_open: !!e.is_open,
  });
  const decorate = (e) => Object.assign(e, { weekday: WD[new Date(e.date + "T12:00:00").getDay()] });

  // ── REST ──
  function headers(auth) {
    const s = auth ? ss.get("ms-session") : null;
    return {
      apikey: C.supabaseAnonKey,
      Authorization: "Bearer " + (s ? s.access_token : C.supabaseAnonKey),
      "Content-Type": "application/json",
    };
  }
  async function req(path, opts = {}, auth = false) {
    const r = await fetch(URL_ + path, Object.assign({ headers: headers(auth) }, opts));
    if (r.status === 401 && auth) { ss.set("ms-session", null); throw new Error("SESSION"); }
    if (!r.ok) throw new Error(await r.text());
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }
  const rpc = (fn, args) => req(`/rest/v1/rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });

  // ── Demo-Speicher ──
  function demoEvents() {
    let evs = ls.get("ms-demo-events", null);
    if (!evs) {
      evs = (window.MS_DATA ? window.MS_DATA.events : []).map((e) => ({ ...e, is_open: true }));
      ls.set("ms-demo-events", evs);
    }
    return evs;
  }

  function deviceId() {
    let id = ls.get("ms-device", null);
    if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); ls.set("ms-device", id); }
    return id;
  }

  const DB = {
    DEMO,
    today,

    async listEvents() {
      const rows = DEMO ? demoEvents().map((e) => ({ ...e })) : (await req("/rest/v1/events?select=*&order=date.asc")).map(fromRow);
      return rows.map(decorate).sort((a, b) => a.date.localeCompare(b.date));
    },

    // ?e=ID oder das nächste/heutige Event
    async currentEvent() {
      const evs = await this.listEvents();
      const id = new URLSearchParams(location.search).get("e");
      if (id) return evs.find((e) => e.id === id) || null;
      return evs.find((e) => e.date >= today()) || evs[evs.length - 1] || null;
    },

    // ── Voting ──
    hasVoted: (ev) => ls.get("ms-voted-" + ev.id, false) === true,

    async cast(ev, act) { // "ok" | "already" | "closed"
      if (DEMO) {
        if (this.hasVoted(ev)) return "already";
        const fresh = demoEvents().find((e) => e.id === ev.id);
        if (!fresh || !fresh.is_open) return "closed";
        const k = "ms-demo-votes-" + ev.id, c = ls.get(k, {});
        c[act] = (c[act] || 0) + 1; ls.set(k, c);
        ls.set("ms-voted-" + ev.id, true);
        return "ok";
      }
      const res = await rpc("cast_vote", { p_event: ev.id, p_act: act, p_device: deviceId() });
      if (res === "ok" || res === "already") ls.set("ms-voted-" + ev.id, true);
      return res;
    },

    async results(ev) { // { act: count }
      if (DEMO) return ls.get("ms-demo-votes-" + ev.id, {});
      const out = {};
      (await rpc("vote_results", { p_event: ev.id })).forEach((r) => (out[r.act] = Number(r.votes)));
      return out;
    },

    // ── Admin ──
    session: () => (DEMO ? ss.get("ms-demo-session") : ss.get("ms-session")),

    async signIn(email, password) {
      if (DEMO) { ss.set("ms-demo-session", { email }); return true; }
      const r = await fetch(URL_ + "/auth/v1/token?grant_type=password", {
        method: "POST", headers: { apikey: C.supabaseAnonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) return false;
      const s = await r.json();
      ss.set("ms-session", { access_token: s.access_token, email: s.user && s.user.email });
      const ok = await req("/rest/v1/rpc/is_admin", { method: "POST", body: "{}" }, true).catch(() => false);
      if (!ok) { ss.set("ms-session", null); return false; }
      return true;
    },

    signOut() { ss.set("ms-session", null); ss.set("ms-demo-session", null); },

    async saveEvent(ev, oldId) {
      if (DEMO) {
        const evs = demoEvents().filter((e) => e.id !== (oldId || ev.id));
        const { weekday, ...clean } = ev;
        evs.push(clean); ls.set("ms-demo-events", evs); return;
      }
      if (oldId && oldId !== ev.id) await req(`/rest/v1/events?id=eq.${encodeURIComponent(oldId)}`, { method: "DELETE" }, true);
      await req("/rest/v1/events", {
        method: "POST", body: JSON.stringify(toRow(ev)),
        headers: Object.assign(headers(true), { Prefer: "resolution=merge-duplicates,return=minimal" }),
      }, true);
    },

    async updateEvent(id, patch) {
      if (DEMO) {
        const evs = demoEvents().map((e) => (e.id === id ? { ...e, ...patch } : e));
        ls.set("ms-demo-events", evs); return;
      }
      const row = {};
      if ("is_open" in patch) row.is_open = patch.is_open;
      if ("winner" in patch) row.winner = patch.winner;
      await req(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(row) }, true);
    },

    async deleteEvent(id) {
      if (DEMO) { ls.set("ms-demo-events", demoEvents().filter((e) => e.id !== id)); return; }
      await req(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }, true);
    },

    async resetVotes(id) {
      if (DEMO) { ls.set("ms-demo-votes-" + id, {}); return; }
      await req(`/rest/v1/votes?event_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }, true);
    },
  };

  window.MS_DB = DB;
})();
