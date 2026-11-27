// Backstage: manage events, run the game, handle requests. English by default, German toggle.
(function () {
  const DB = window.MS_DB, app = document.getElementById("app");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (iso) => iso.split("-").reverse().join(".");
  const site = (p) => new URL("../" + p, location.href).href;

  // ── Texts ──
  const TX = {
    en: {
      manage: "Management", email: "Email", password: "Password", signin: "Sign in", loginFail: "Login failed or no admin access.",
      demoLogin: "Demo mode: Supabase is not connected. Any email and password work; changes stay in this browser only.",
      demoNote: "Demo mode: changes are only saved in this browser. Connect Supabase for real events (see README).",
      website: "Website ↗", logout: "Sign out", tabEvents: "Events", tabRequests: "Requests",
      upcoming: "Upcoming events", past: "Past events", newEvent: "+ New event", noUpcoming: "No upcoming events yet.", none: "None yet.",
      noLineup: "No line-up yet", wheel: "Wheel", gameOpen: "Game open", gameClosed: "Game closed",
      openVote: "Open voting", closeVote: "Close voting", results: "Results", hideResults: "Hide results",
      beamerVotes: "Screen: votes ↗", beamerWheel: "Screen: wheel ↗", printQr: "Print QR ↗", copyLink: "Copy voting link",
      edit: "Edit", del: "Delete", votesTotal: "votes in total", viaInsta: "tapped “Follow on Instagram” first",
      spinPick: "Wheel result …", spinSave: "Save wheel result", refresh: "Refresh", reset: "Reset votes",
      signedInAs: "Signed in as", relogin: "Please sign in again", error: "Error – not saved", saved: "Saved", deleted: "Deleted",
      opened: "Voting opened", closed: "Voting closed", copied: "Link copied", resetDone: "Reset",
      confirmReset: "Delete all votes and the wheel result for this event?", confirmDelete: "Really delete the event on {d}? Its votes are deleted too.",
      back: "← Back", editEvent: "Edit event", newTitle: "New event", whenWhere: "When & where", date: "Date *", edition: "Edition",
      venue: "Venue *", address: "Address", time: "Time", tickets: "Ticket link (optional)", poster: "Poster URL (optional)",
      dateLocked: "The date can’t be changed later because the QR link depends on it. If needed, delete the event and create it again.",
      game: "The game", genres: "Genres to choose from (comma separated)", genresHint: "Order = position on the wheel (first genre on top). Don’t change after voting has opened.",
      liveActs: "Live acts", addAct: "+ Add act", name: "Name", link: "Link (Instagram, Spotify …)", photo: "Photo URL (optional)",
      dj: "DJ (optional)", from: "From", save: "Save", cancel: "Cancel",
      open: "Open", reqTitle: "Requests", reqEmpty: "No requests yet.", all: "All", artist: "Artist / DJ", venueK: "Venue",
      st_new: "New", st_contacted: "Contacted", st_booked: "Booked", st_archived: "Archived",
      files: "Files", notes: "Internal notes", saveNotes: "Save notes", reply: "Reply by email", confirmReqDelete: "Delete this request?",
      capacity: "Capacity", tech: "Equipment", dates: "Dates", type: "Type", fileDemo: "(not available in demo mode)",
    },
    de: {
      manage: "Verwaltung", email: "E-Mail", password: "Passwort", signin: "Anmelden", loginFail: "Login fehlgeschlagen oder kein Admin-Zugang.",
      demoLogin: "Demo-Modus: Supabase ist nicht verbunden. Beliebige E-Mail und beliebiges Passwort funktionieren, Änderungen bleiben nur in diesem Browser.",
      demoNote: "Demo-Modus: Änderungen werden nur in diesem Browser gespeichert. Für echte Events Supabase verbinden (siehe README).",
      website: "Website ↗", logout: "Abmelden", tabEvents: "Events", tabRequests: "Anfragen",
      upcoming: "Kommende Events", past: "Vergangene Events", newEvent: "+ Neues Event", noUpcoming: "Noch keine kommenden Events.", none: "Noch keine.",
      noLineup: "Noch kein Line-up", wheel: "Rad", gameOpen: "Spiel läuft", gameClosed: "Spiel zu",
      openVote: "Abstimmung öffnen", closeVote: "Abstimmung schließen", results: "Ergebnis", hideResults: "Ergebnis ausblenden",
      beamerVotes: "Beamer: Stimmen ↗", beamerWheel: "Beamer: Rad ↗", printQr: "QR drucken ↗", copyLink: "Abstimm-Link kopieren",
      edit: "Bearbeiten", del: "Löschen", votesTotal: "Stimmen gesamt", viaInsta: "haben vorher auf „Instagram folgen“ getippt",
      spinPick: "Rad-Ergebnis …", spinSave: "Rad-Ergebnis speichern", refresh: "Aktualisieren", reset: "Stimmen zurücksetzen",
      signedInAs: "Angemeldet als", relogin: "Bitte neu anmelden", error: "Fehler – nicht gespeichert", saved: "Gespeichert", deleted: "Gelöscht",
      opened: "Abstimmung geöffnet", closed: "Abstimmung geschlossen", copied: "Link kopiert", resetDone: "Zurückgesetzt",
      confirmReset: "Alle Stimmen und das Rad-Ergebnis für dieses Event löschen?", confirmDelete: "Event am {d} wirklich löschen? Die Stimmen werden mitgelöscht.",
      back: "← Zurück", editEvent: "Event bearbeiten", newTitle: "Neues Event", whenWhere: "Wann & wo", date: "Datum *", edition: "Ausgabe",
      venue: "Location *", address: "Adresse", time: "Uhrzeit", tickets: "Ticket-Link (optional)", poster: "Poster-URL (optional)",
      dateLocked: "Das Datum kann nachträglich nicht geändert werden, weil der QR-Link daran hängt. Falls nötig: Event löschen und neu anlegen.",
      game: "Das Spiel", genres: "Genres zur Auswahl (mit Komma getrennt)", genresHint: "Reihenfolge = Position auf dem Rad (erstes Genre oben). Nach dem Öffnen der Abstimmung nicht mehr ändern.",
      liveActs: "Live-Acts", addAct: "+ Act hinzufügen", name: "Name", link: "Link (Instagram, Spotify …)", photo: "Foto-URL (optional)",
      dj: "DJ (optional)", from: "Ab", save: "Speichern", cancel: "Abbrechen",
      open: "Offen", reqTitle: "Anfragen", reqEmpty: "Noch keine Anfragen.", all: "Alle", artist: "Artist / DJ", venueK: "Location",
      st_new: "Neu", st_contacted: "Kontaktiert", st_booked: "Gebucht", st_archived: "Archiviert",
      files: "Dateien", notes: "Interne Notizen", saveNotes: "Notizen speichern", reply: "Per E-Mail antworten", confirmReqDelete: "Diese Anfrage löschen?",
      capacity: "Kapazität", tech: "Technik", dates: "Termine", type: "Art", fileDemo: "(im Demo-Modus nicht verfügbar)",
    },
  };
  let lang = localStorage.getItem("ms-lang") === "de" ? "de" : "en";
  const T = (k, v) => { let s = TX[lang][k] || TX.en[k] || k; if (v) for (const x in v) s = s.replace("{" + x + "}", v[x]); return s; };
  const langSwitch = () => `<div class="lang mono"><button data-setlang="en" aria-pressed="${lang === "en"}">EN</button><span class="dim">/</span><button data-setlang="de" aria-pressed="${lang === "de"}">DE</button></div>`;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-setlang]"); if (!b) return;
    lang = b.dataset.setlang; try { localStorage.setItem("ms-lang", lang); } catch (x) {}
    document.documentElement.lang = lang; rerender();
  });

  let events = [], openResults = {}, results = {}, stats = {}, view = "list", editing = null, tab = "events";
  let requests = [], reqFilter = "open";

  function toast(msg) {
    const el = document.createElement("div"); el.className = "toast"; el.textContent = msg;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2200);
  }
  async function guard(fn) {
    try { await fn(); }
    catch (e) {
      if (e.message === "SESSION") { toast(T("relogin")); renderLogin(); return; }
      console.error(e); toast(T("error"));
    }
  }
  function rerender() { if (!DB.isAdmin()) return renderLogin(); view === "edit" ? renderEditor() : tab === "requests" ? renderRequests() : renderList(); }

  // ── Login ──
  function renderLogin() {
    app.innerHTML = `
      <div class="login"><form id="login">
        <div style="display:flex;justify-content:space-between;align-items:center"><img src="../assets/logo.svg" alt="">${langSwitch()}</div>
        <div class="mono lime">Backstage</div>
        <h1>musik scout<br>${T("manage")}</h1>
        <label class="field"><span class="mono dim">${T("email")}</span><input name="email" type="email" required autocomplete="username"></label>
        <label class="field"><span class="mono dim">${T("password")}</span><input name="pw" type="password" required autocomplete="current-password"></label>
        <button class="btn primary" style="justify-content:center">${T("signin")}</button>
        <div class="err" id="err"></div>
        ${DB.DEMO ? `<div class="demo-note">${T("demoLogin")}</div>` : ""}
      </form></div>`;
    document.getElementById("login").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      document.getElementById("err").textContent = "";
      const ok = await DB.signIn(f.get("email"), f.get("pw")).catch(() => false);
      if (ok) { await load(); } else document.getElementById("err").textContent = T("loginFail");
    });
  }

  // ── Data ──
  async function load() {
    await guard(async () => {
      events = await DB.listEvents();
      requests = await DB.listRequests().catch(() => []);
      for (const id of Object.keys(openResults)) {
        const ev = events.find((e) => e.id === id); if (!ev) continue;
        results[id] = await DB.results(ev);
        stats[id] = await DB.voteStats(ev).catch(() => null);
      }
      rerender();
    });
  }

  function topBar(withTabs = true) {
    const nNew = requests.filter((r) => r.status === "new").length;
    return `<div class="a-top">
      <div class="brand"><img src="../assets/logo-static.svg" alt=""> musik scout <span class="mono">Backstage</span></div>
      ${withTabs ? `<div class="a-tabs mono"><button data-tab="events" aria-pressed="${tab === "events"}">${T("tabEvents")}</button><button data-tab="requests" aria-pressed="${tab === "requests"}">${T("tabRequests")}${nNew ? ` <span class="count">${nNew}</span>` : ""}</button></div>` : ""}
      <div class="cta-row" style="margin:0;align-items:center">${langSwitch()}<a class="btn sm ghost" href="../index.html" target="_blank">${T("website")}</a>${withTabs ? `<button class="btn sm" id="logout">${T("logout")}</button>` : `<button class="btn sm" id="back">${T("back")}</button>`}</div>
    </div>`;
  }

  // ── Events list ──
  function evCard(e) {
    const isOpen = e.is_open, showRes = openResults[e.id], r = results[e.id] || {}, st = stats[e.id];
    const total = e.genres.reduce((s, g) => s + (r[g] || 0), 0);
    const max = Math.max(0, ...e.genres.map((g) => r[g] || 0));
    return `<article class="ev" data-id="${esc(e.id)}">
      <div class="ev-main">
        <div><div class="mono lime">${esc(e.weekday)} ${esc(e.edition)}</div><div class="ev-date">${fmt(e.date).slice(0, 5)}</div><div class="mono dim">${e.date.slice(0, 4)}</div></div>
        <div>
          <div class="mono dim">${esc(e.venue)} · ${esc(e.time)}</div>
          <div class="ev-acts">${e.live.map((a) => esc(a.name)).join(" · ") || `<span class='dim'>${T("noLineup")}</span>`}</div>
          ${e.dj ? `<div class="mono dim">DJ: ${esc(e.dj.name)}</div>` : ""}
          <div class="mono dim" style="margin-top:6px">${e.genres.map(esc).join(" · ")}${e.spin_result ? ` · ${T("wheel")}: <span class="lime">${esc(e.spin_result)}</span>` : ""}</div>
        </div>
        <span class="badge ${isOpen ? "open" : ""}">${isOpen ? T("gameOpen") : T("gameClosed")}</span>
      </div>
      <div class="ev-actions">
        <button class="btn sm ${isOpen ? "" : "primary"}" data-act="toggle">${isOpen ? T("closeVote") : T("openVote")}</button>
        <button class="btn sm ghost" data-act="results">${showRes ? T("hideResults") : T("results")}</button>
        <a class="btn sm ghost" href="${site("results.html?e=" + encodeURIComponent(e.id))}" target="_blank">${T("beamerVotes")}</a>
        <a class="btn sm ghost" href="${site("spin.html?e=" + encodeURIComponent(e.id))}" target="_blank">${T("beamerWheel")}</a>
        <a class="btn sm ghost" href="${site("qr.html?e=" + encodeURIComponent(e.id))}" target="_blank">${T("printQr")}</a>
        <button class="btn sm ghost" data-act="copy">${T("copyLink")}</button>
        <span class="spacer"></span>
        <button class="btn sm ghost" data-act="edit">${T("edit")}</button>
        <button class="btn sm ghost danger" data-act="delete">${T("del")}</button>
      </div>
      ${showRes ? `<div class="ev-res">
        ${e.genres.map((g) => { const n = r[g] || 0; return `<div class="res-row ${n && n === max ? "lead" : ""}"><b>${esc(g)}</b><div class="bar"><i style="width:${total ? (n / max) * 100 : 0}%"></i></div><span class="mono">${n} · ${total ? Math.round((n / total) * 100) : 0}%</span></div>`; }).join("")}
        <div class="mono dim">${total} ${T("votesTotal")}${st && st.total ? ` · ${st.insta} (${Math.round((st.insta / st.total) * 100)}%) ${T("viaInsta")}` : ""}</div>
        <div class="win-row">
          <select data-role="spin"><option value="">${T("spinPick")}</option>${e.genres.map((g) => `<option ${e.spin_result === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select>
          <button class="btn sm primary" data-act="spin">${T("spinSave")}</button>
          <button class="btn sm ghost" data-act="refresh">${T("refresh")}</button>
          <button class="btn sm ghost danger" data-act="reset">${T("reset")}</button>
        </div>
      </div>` : ""}
    </article>`;
  }

  function renderList() {
    view = "list"; tab = "events";
    const today = DB.today();
    const up = events.filter((e) => e.date >= today), past = events.filter((e) => e.date < today).reverse();
    const s = DB.session() || {};
    app.innerHTML = `${topBar()}
      <div class="a-wrap">
        ${DB.DEMO ? `<div class="demo-note">${T("demoNote")}</div>` : ""}
        <div class="a-head"><h2>${T("upcoming")}</h2><button class="btn primary" id="new">${T("newEvent")}</button></div>
        <div class="ev-list">${up.map(evCard).join("") || `<p class="dim">${T("noUpcoming")}</p>`}</div>
        <div class="a-head"><h2>${T("past")}</h2></div>
        <div class="ev-list">${past.map(evCard).join("") || `<p class="dim">${T("none")}</p>`}</div>
        <p class="mono dim" style="margin-top:40px;font-size:.7rem">${T("signedInAs")} ${esc(s.email || "")}</p>
      </div>`;
    document.getElementById("new").onclick = () => { editing = null; renderEditor(); };
  }

  // ── Requests ──
  function reqCard(r) {
    const d = r.details || {}, isA = r.kind === "artist";
    const info = isA
      ? [[T("type"), { live: "Live act", dj: "DJ", both: "Live + DJ" }[d.acttype] || d.acttype], ["Genre", r.genre], ["City", r.city]]
      : [[T("type"), d.venuetype], [T("address"), r.city], [T("capacity"), d.capacity], [T("tech"), d.tech], [T("dates"), d.dates], ["Tel", r.phone]];
    const links = String(r.links || "").split(/\s+/).filter((x) => /^https?:\/\//.test(x));
    return `<article class="ev req" data-rid="${esc(r.id)}">
      <div class="ev-main" style="grid-template-columns:1fr auto">
        <div>
          <div class="mono lime">${isA ? T("artist") : T("venueK")} · ${new Date(r.created_at).toLocaleString(lang === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}</div>
          <div class="ev-acts" style="font-size:1.4rem">${esc(r.name)}</div>
          <div class="mono dim">${esc(r.contact)}${r.contact ? " · " : ""}<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>${r.instagram ? ` · <a href="https://instagram.com/${esc(r.instagram.replace(/^@/, ""))}" target="_blank" rel="noopener">${esc(r.instagram)}</a>` : ""}</div>
        </div>
        <select data-role="status">${["new", "contacted", "booked", "archived"].map((s) => `<option value="${s}" ${r.status === s ? "selected" : ""}>${T("st_" + s)}</option>`).join("")}</select>
      </div>
      <div class="ev-res">
        <div class="req-info">${info.filter(([, v]) => v).map(([k, v]) => `<div><span class="mono dim">${esc(k)}</span><div>${esc(v)}</div></div>`).join("")}</div>
        ${r.message ? `<p class="req-msg">${esc(r.message)}</p>` : ""}
        ${links.length ? `<div class="req-links">${links.map((l) => `<a href="${esc(l)}" target="_blank" rel="noopener">${esc(l.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60))}</a>`).join("")}</div>` : ""}
        ${(r.files || []).length ? `<div><span class="mono dim">${T("files")}</span><div class="req-links">${r.files.map((p) => `<button class="linklike" data-file="${esc(p)}">${esc(p.split("/").pop())}</button>`).join("")}${DB.DEMO ? ` <span class="dim">${T("fileDemo")}</span>` : ""}</div></div>` : ""}
        <label class="field"><span class="mono dim">${T("notes")}</span><textarea data-role="notes" rows="2">${esc(r.notes)}</textarea></label>
        <div class="win-row">
          <button class="btn sm ghost" data-ract="notes">${T("saveNotes")}</button>
          <a class="btn sm ghost" href="mailto:${esc(r.email)}?subject=${encodeURIComponent("musik scout – " + r.name)}">${T("reply")}</a>
          <span class="spacer" style="flex:1"></span>
          <button class="btn sm ghost danger" data-ract="delete">${T("del")}</button>
        </div>
      </div>
    </article>`;
  }

  function renderRequests() {
    view = "list"; tab = "requests";
    const list = requests.filter((r) => reqFilter === "all" ? true : reqFilter === "open" ? r.status !== "archived" : r.kind === reqFilter);
    app.innerHTML = `${topBar()}
      <div class="a-wrap">
        <div class="a-head"><h2>${T("reqTitle")}</h2>
          <div class="a-tabs mono small">${[["open", T("open")], ["artist", T("artist")], ["venue", T("venueK")], ["all", T("all")]].map(([k, l]) => `<button data-rfilter="${k}" aria-pressed="${reqFilter === k}">${l}</button>`).join("")}</div>
        </div>
        <div class="ev-list">${list.map(reqCard).join("") || `<p class="dim">${T("reqEmpty")}</p>`}</div>
      </div>`;
  }

  app.addEventListener("change", (ev) => {
    const sel = ev.target.closest("[data-role=status]"); if (!sel) return;
    const id = sel.closest(".req").dataset.rid;
    guard(async () => { await DB.updateRequest(id, { status: sel.value }); requests.find((r) => r.id === id).status = sel.value; toast(T("saved")); rerender(); });
  });

  app.addEventListener("click", (ev) => {
    if (ev.target.id === "logout") { DB.signOut(); renderLogin(); return; }
    if (ev.target.id === "back") { editing = null; view = "list"; rerender(); return; }
    const tb = ev.target.closest("[data-tab]"); if (tb) { tab = tb.dataset.tab; view = "list"; rerender(); return; }
    const rf = ev.target.closest("[data-rfilter]"); if (rf) { reqFilter = rf.dataset.rfilter; renderRequests(); return; }

    const fileBtn = ev.target.closest("[data-file]");
    if (fileBtn) { guard(async () => { const u = await DB.fileUrl(fileBtn.dataset.file); if (u) window.open(u, "_blank", "noopener"); }); return; }
    const rb = ev.target.closest("[data-ract]");
    if (rb) {
      const card = rb.closest(".req"), id = card.dataset.rid;
      if (rb.dataset.ract === "notes") guard(async () => { const n = card.querySelector("[data-role=notes]").value; await DB.updateRequest(id, { notes: n }); requests.find((r) => r.id === id).notes = n; toast(T("saved")); });
      if (rb.dataset.ract === "delete" && confirm(T("confirmReqDelete"))) guard(async () => { await DB.deleteRequest(id); requests = requests.filter((r) => r.id !== id); toast(T("deleted")); rerender(); });
      return;
    }

    const btn = ev.target.closest("[data-act]"); if (!btn || view !== "list") return;
    const card = btn.closest(".ev"), id = card && card.dataset.id, e = events.find((x) => x.id === id);
    if (!e) return;
    const act = btn.dataset.act;
    if (act === "toggle") guard(async () => { await DB.updateEvent(id, { is_open: !e.is_open }); toast(e.is_open ? T("closed") : T("opened")); await load(); });
    if (act === "results") { if (openResults[id]) delete openResults[id]; else openResults[id] = true; load(); }
    if (act === "refresh") load();
    if (act === "spin") guard(async () => { await DB.updateEvent(id, { spin_result: card.querySelector("[data-role=spin]").value }); toast(T("saved")); await load(); });
    if (act === "reset" && confirm(T("confirmReset"))) guard(async () => { await DB.resetVotes(id); await DB.updateEvent(id, { spin_result: "" }); toast(T("resetDone")); await load(); });
    if (act === "delete" && confirm(T("confirmDelete", { d: fmt(e.date) }))) guard(async () => { await DB.deleteEvent(id); toast(T("deleted")); await load(); });
    if (act === "edit") { editing = e; renderEditor(); }
    if (act === "copy") { navigator.clipboard.writeText(site("vote.html?e=" + encodeURIComponent(id))).then(() => toast(T("copied"))); }
  });

  // ── Editor ──
  function actRow(a = {}) {
    return `<div class="act-row"><input name="act_name" placeholder="${T("name")}" value="${esc(a.name)}"><input name="act_link" placeholder="${T("link")}" value="${esc(a.link)}"><input name="act_photo" placeholder="${T("photo")}" value="${esc(a.photo)}"><button type="button" class="btn sm ghost danger" data-rm>✕</button></div>`;
  }

  function renderEditor() {
    view = "edit";
    const e = editing || { date: "", edition: "", venue: "Madame Claude", address: "Lübbener Str. 19, 10997 Berlin", time: "7 PM – 2 AM", tickets: "", poster: "", genres: DB.DEFAULT_GENRES, live: [{}, {}, {}], dj: { name: "", from: "11 PM", link: "", photo: "" } };
    const nextNo = "#" + String(events.length + 1).padStart(2, "0");
    app.innerHTML = `${topBar(false)}
      <div class="a-wrap">
        <form class="editor" id="ed">
          <h2>${editing ? T("editEvent") : T("newTitle")}</h2>
          <fieldset><legend>${T("whenWhere")}</legend>
            <div class="grid2">
              <label class="field"><span class="mono dim">${T("date")}</span><input type="date" name="date" required value="${esc(e.date)}" ${editing ? "disabled" : ""}></label>
              <label class="field"><span class="mono dim">${T("edition")}</span><input name="edition" placeholder="${nextNo}" value="${esc(e.edition)}"></label>
              <label class="field"><span class="mono dim">${T("venue")}</span><input name="venue" required value="${esc(e.venue)}"></label>
              <label class="field"><span class="mono dim">${T("address")}</span><input name="address" value="${esc(e.address)}"></label>
              <label class="field"><span class="mono dim">${T("time")}</span><input name="time" value="${esc(e.time)}"></label>
              <label class="field"><span class="mono dim">${T("tickets")}</span><input name="tickets" type="url" placeholder="https://" value="${esc(e.tickets)}"></label>
              <label class="field"><span class="mono dim">${T("poster")}</span><input name="poster" placeholder="assets/events/…/poster.jpg" value="${esc(e.poster)}"></label>
            </div>
            ${editing ? `<p class="hint">${T("dateLocked")}</p>` : ""}
          </fieldset>
          <fieldset><legend>${T("game")}</legend>
            <label class="field"><span class="mono dim">${T("genres")}</span><input name="genres" value="${esc((e.genres || DB.DEFAULT_GENRES).join(", "))}"></label>
            <p class="hint">${T("genresHint")}</p>
          </fieldset>
          <fieldset><legend>${T("liveActs")}</legend>
            <div id="acts">${(e.live.length ? e.live : [{}]).map(actRow).join("")}</div>
            <div><button type="button" class="btn sm ghost" id="addact">${T("addAct")}</button></div>
          </fieldset>
          <fieldset><legend>${T("dj")}</legend>
            <div class="grid3">
              <label class="field"><span class="mono dim">${T("name")}</span><input name="dj_name" value="${esc(e.dj && e.dj.name)}"></label>
              <label class="field"><span class="mono dim">${T("from")}</span><input name="dj_from" value="${esc((e.dj && e.dj.from) || "11 PM")}"></label>
              <label class="field"><span class="mono dim">${T("link")}</span><input name="dj_link" value="${esc(e.dj && e.dj.link)}"></label>
            </div>
            <label class="field"><span class="mono dim">${T("photo")}</span><input name="dj_photo" value="${esc(e.dj && e.dj.photo)}"></label>
          </fieldset>
          <div class="cta-row"><button class="btn primary">${T("save")}</button><button type="button" class="btn ghost" id="cancel">${T("cancel")}</button></div>
        </form>
      </div>`;
    document.getElementById("cancel").onclick = () => { editing = null; view = "list"; rerender(); };
    document.getElementById("addact").onclick = () => document.getElementById("acts").insertAdjacentHTML("beforeend", actRow());
    document.getElementById("acts").addEventListener("click", (x) => { if (x.target.matches("[data-rm]")) x.target.closest(".act-row").remove(); });
    document.getElementById("ed").addEventListener("submit", (x) => {
      x.preventDefault();
      const f = new FormData(x.target);
      const names = f.getAll("act_name"), links = f.getAll("act_link"), photos = f.getAll("act_photo");
      const live = names.map((n, i) => ({ name: n.trim(), link: (links[i] || "").trim(), photo: (photos[i] || "").trim() })).filter((a) => a.name);
      const genres = f.get("genres").split(",").map((g) => g.trim().toLowerCase()).filter(Boolean);
      const date = editing ? editing.date : f.get("date");
      let id = editing ? editing.id : date;
      if (!editing) { let n = 2; while (events.some((ev) => ev.id === id)) id = `${date}-${n++}`; }
      const ev = {
        id, date, edition: f.get("edition").trim() || (editing ? "" : nextNo),
        venue: f.get("venue").trim(), address: f.get("address").trim(), time: f.get("time").trim(),
        tickets: f.get("tickets").trim(), poster: f.get("poster").trim(), live, genres: genres.length ? genres : DB.DEFAULT_GENRES,
        dj: f.get("dj_name").trim() ? { name: f.get("dj_name").trim(), from: f.get("dj_from").trim(), link: f.get("dj_link").trim(), photo: f.get("dj_photo").trim() } : null,
        spin_result: editing ? editing.spin_result : "", is_open: editing ? editing.is_open : false,
      };
      guard(async () => { await DB.saveEvent(ev, editing && editing.id); toast(T("saved")); editing = null; view = "list"; await load(); });
    });
  }

  document.documentElement.lang = lang;
  DB.isAdmin() ? load() : renderLogin();
})();
