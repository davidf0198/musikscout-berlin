// Voting-Logik: Supabase (über REST, ohne SDK) oder Demo-Modus im Browser.
(function () {
  const C = window.MS_CONFIG || {};
  const DEMO = !C.supabaseUrl || !C.supabaseAnonKey;
  const H = DEMO ? {} : { apikey: C.supabaseAnonKey, Authorization: "Bearer " + C.supabaseAnonKey, "Content-Type": "application/json" };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  function deviceId() {
    let id = store.get("ms-device");
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
      store.set("ms-device", id);
    }
    return id;
  }

  // Welches Event? ?e=YYYY-MM-DD, sonst das nächste/heutige aus data.js
  function currentEvent() {
    const id = new URLSearchParams(location.search).get("e");
    const evs = [...window.MS_DATA.events].sort((a, b) => a.date.localeCompare(b.date));
    if (id) return evs.find((e) => e.id === id) || null;
    const today = new Date().toISOString().slice(0, 10);
    return evs.find((e) => e.date >= today) || evs[evs.length - 1] || null;
  }

  async function rpc(fn, args) {
    const r = await fetch(`${C.supabaseUrl}/rest/v1/rpc/${fn}`, { method: "POST", headers: H, body: JSON.stringify(args) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  window.MS_VOTE = {
    DEMO,
    currentEvent,
    hasVoted: (ev) => store.get("ms-voted-" + ev.id) === "1",

    async isOpen(ev) {
      if (DEMO) return true;
      return !!(await rpc("voting_is_open", { p_event: ev.id }));
    },

    // Rückgabe: "ok" | "already" | "closed"
    async cast(ev, act) {
      if (DEMO) {
        if (this.hasVoted(ev)) return "already";
        const k = "ms-demo-" + ev.id;
        const counts = JSON.parse(store.get(k) || "{}");
        counts[act] = (counts[act] || 0) + 1;
        store.set(k, JSON.stringify(counts));
        store.set("ms-voted-" + ev.id, "1");
        return "ok";
      }
      const res = await rpc("cast_vote", { p_event: ev.id, p_act: act, p_device: deviceId() });
      if (res === "ok" || res === "already") store.set("ms-voted-" + ev.id, "1");
      return res;
    },

    // Rückgabe: { "Act": count, ... }
    async results(ev) {
      if (DEMO) return JSON.parse(store.get("ms-demo-" + ev.id) || "{}");
      const rows = await rpc("vote_results", { p_event: ev.id });
      const out = {};
      rows.forEach((r) => (out[r.act] = Number(r.votes)));
      return out;
    },
  };
})();
