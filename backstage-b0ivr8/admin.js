// Backstage: Events verwalten, Voting steuern, Gewinner eintragen.
(function () {
  const DB = window.MS_DB, app = document.getElementById("app");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (iso) => iso.split("-").reverse().join(".");
  const site = (p) => new URL("../" + p, location.href).href;

  let events = [], openResults = {}, results = {}, view = "list", editing = null;

  function toast(msg) {
    const el = document.createElement("div"); el.className = "toast"; el.textContent = msg;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2200);
  }
  async function guard(fn) {
    try { await fn(); }
    catch (e) {
      if (e.message === "SESSION") { toast("Bitte neu anmelden"); renderLogin(); return; }
      console.error(e); toast("Fehler – nicht gespeichert");
    }
  }

  // ── Login ──
  function renderLogin() {
    app.innerHTML = `
      <div class="login"><form id="login">
        <img src="../assets/logo.svg" alt="">
        <div class="mono lime">Backstage</div>
        <h1>musik scout<br>Verwaltung</h1>
        <label class="field"><span class="mono dim">E-Mail</span><input name="email" type="email" required autocomplete="username"></label>
        <label class="field"><span class="mono dim">Passwort</span><input name="pw" type="password" required autocomplete="current-password"></label>
        <button class="btn primary" style="justify-content:center">Anmelden</button>
        <div class="err" id="err"></div>
        ${DB.DEMO ? `<div class="demo-note">Demo-Modus: Supabase ist noch nicht verbunden. Beliebige E-Mail und beliebiges Passwort funktionieren, Änderungen bleiben nur in diesem Browser.</div>` : ""}
      </form></div>`;
    document.getElementById("login").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      document.getElementById("err").textContent = "";
      const ok = await DB.signIn(f.get("email"), f.get("pw")).catch(() => false);
      if (ok) { await load(); } else document.getElementById("err").textContent = "Login fehlgeschlagen oder kein Admin-Zugang.";
    });
  }

  // ── Daten ──
  async function load() {
    await guard(async () => {
      events = await DB.listEvents();
      for (const id of Object.keys(openResults)) results[id] = await DB.results(events.find((e) => e.id === id));
      view === "edit" ? renderEditor() : renderList();
    });
  }

  // ── Liste ──
  function evCard(e) {
    const isOpen = e.is_open, showRes = openResults[e.id], r = results[e.id] || {};
    const total = e.live.reduce((s, a) => s + (r[a.name] || 0), 0);
    const max = Math.max(0, ...e.live.map((a) => r[a.name] || 0));
    return `<article class="ev" data-id="${esc(e.id)}">
      <div class="ev-main">
        <div><div class="mono lime">${esc(e.weekday)} ${esc(e.edition)}</div><div class="ev-date">${fmt(e.date).slice(0, 5)}</div><div class="mono dim">${e.date.slice(0, 4)}</div></div>
        <div>
          <div class="mono dim">${esc(e.venue)} · ${esc(e.time)}</div>
          <div class="ev-acts">${e.live.map((a) => esc(a.name)).join(" · ") || "<span class='dim'>Noch kein Line-up</span>"}</div>
          ${e.dj ? `<div class="mono dim">DJ: ${esc(e.dj.name)}</div>` : ""}
          ${e.winner ? `<div class="mono" style="margin-top:6px">Gewinner: <span class="lime">${esc(e.winner)}</span></div>` : ""}
        </div>
        <span class="badge ${isOpen ? "open" : ""}">${isOpen ? "Voting läuft" : "Voting zu"}</span>
      </div>
      <div class="ev-actions">
        <button class="btn sm ${isOpen ? "" : "primary"}" data-act="toggle">${isOpen ? "Voting schließen" : "Voting öffnen"}</button>
        <button class="btn sm ghost" data-act="results">${showRes ? "Ergebnis ausblenden" : "Ergebnis"}</button>
        <a class="btn sm ghost" href="${site("results.html?e=" + encodeURIComponent(e.id))}" target="_blank">Beamer ↗</a>
        <a class="btn sm ghost" href="${site("qr.html?e=" + encodeURIComponent(e.id))}" target="_blank">QR drucken ↗</a>
        <button class="btn sm ghost" data-act="copy">Voting-Link kopieren</button>
        <span class="spacer"></span>
        <button class="btn sm ghost" data-act="edit">Bearbeiten</button>
        <button class="btn sm ghost danger" data-act="delete">Löschen</button>
      </div>
      ${showRes ? `<div class="ev-res">
        ${e.live.map((a) => { const n = r[a.name] || 0; return `<div class="res-row ${n && n === max ? "lead" : ""}"><b>${esc(a.name)}</b><div class="bar"><i style="width:${total ? (n / max) * 100 : 0}%"></i></div><span class="mono">${n} · ${total ? Math.round((n / total) * 100) : 0}%</span></div>`; }).join("")}
        <div class="mono dim">${total} Stimmen gesamt</div>
        <div class="win-row">
          <select data-role="winner"><option value="">Gewinner wählen …</option>${e.live.map((a) => `<option ${e.winner === a.name ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select>
          <button class="btn sm primary" data-act="winner">Gewinner speichern</button>
          <button class="btn sm ghost" data-act="refresh">Aktualisieren</button>
          <button class="btn sm ghost danger" data-act="reset">Stimmen zurücksetzen</button>
        </div>
      </div>` : ""}
    </article>`;
  }

  function renderList() {
    view = "list";
    const today = DB.today();
    const up = events.filter((e) => e.date >= today), past = events.filter((e) => e.date < today).reverse();
    const s = DB.session() || {};
    app.innerHTML = `
      <div class="a-top">
        <div class="brand"><img src="../assets/logo-static.svg" alt=""> musik scout <span class="mono">Backstage</span></div>
        <div class="cta-row" style="margin:0"><a class="btn sm ghost" href="../index.html" target="_blank">Website ↗</a><button class="btn sm" id="logout">Abmelden</button></div>
      </div>
      <div class="a-wrap">
        ${DB.DEMO ? `<div class="demo-note">Demo-Modus: Änderungen werden nur in diesem Browser gespeichert. Für echte Events Supabase verbinden (siehe README).</div>` : ""}
        <div class="a-head"><h2>Kommende Events</h2><button class="btn primary" id="new">+ Neues Event</button></div>
        <div class="ev-list">${up.map(evCard).join("") || `<p class="dim">Noch keine kommenden Events.</p>`}</div>
        <div class="a-head"><h2>Vergangene Events</h2></div>
        <div class="ev-list">${past.map(evCard).join("") || `<p class="dim">Noch keine.</p>`}</div>
        <p class="mono dim" style="margin-top:40px;font-size:.7rem">Angemeldet als ${esc(s.email || "")}</p>
      </div>`;
    document.getElementById("logout").onclick = () => { DB.signOut(); renderLogin(); };
    document.getElementById("new").onclick = () => { editing = null; renderEditor(); };
  }

  app.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-act]"); if (!btn || view !== "list") return;
    const card = btn.closest(".ev"), id = card && card.dataset.id, e = events.find((x) => x.id === id);
    if (!e) return;
    const act = btn.dataset.act;
    if (act === "toggle") guard(async () => { await DB.updateEvent(id, { is_open: !e.is_open }); toast(e.is_open ? "Voting geschlossen" : "Voting geöffnet"); await load(); });
    if (act === "results") { if (openResults[id]) delete openResults[id]; else openResults[id] = true; load(); }
    if (act === "refresh") load();
    if (act === "winner") guard(async () => { await DB.updateEvent(id, { winner: card.querySelector("[data-role=winner]").value }); toast("Gewinner gespeichert"); await load(); });
    if (act === "reset" && confirm("Alle Stimmen für dieses Event löschen?")) guard(async () => { await DB.resetVotes(id); toast("Stimmen zurückgesetzt"); await load(); });
    if (act === "delete" && confirm(`Event am ${fmt(e.date)} wirklich löschen? Die Stimmen werden mitgelöscht.`)) guard(async () => { await DB.deleteEvent(id); toast("Gelöscht"); await load(); });
    if (act === "edit") { editing = e; renderEditor(); }
    if (act === "copy") { navigator.clipboard.writeText(site("vote.html?e=" + encodeURIComponent(id))).then(() => toast("Link kopiert")); }
  });

  // ── Editor ──
  function actRow(a = {}) {
    return `<div class="act-row"><input name="act_name" placeholder="Name" value="${esc(a.name)}"><input name="act_link" placeholder="Link (Instagram, Spotify …) optional" value="${esc(a.link)}"><button type="button" class="btn sm ghost danger" data-rm>✕</button></div>`;
  }

  function renderEditor() {
    view = "edit";
    const e = editing || { date: "", edition: "", venue: "Madame Claude", address: "Lübbener Str. 19, 10997 Berlin", time: "7 PM – 2 AM", tickets: "", live: [{}, {}, {}], dj: { name: "", from: "11 PM", link: "" } };
    const nextNo = "#" + String(events.length + 1).padStart(2, "0");
    app.innerHTML = `
      <div class="a-top">
        <div class="brand"><img src="../assets/logo-static.svg" alt=""> musik scout <span class="mono">Backstage</span></div>
        <button class="btn sm" id="back">← Zurück</button>
      </div>
      <div class="a-wrap">
        <form class="editor" id="ed">
          <h2>${editing ? "Event bearbeiten" : "Neues Event"}</h2>
          <fieldset><legend>Wann & wo</legend>
            <div class="grid2">
              <label class="field"><span class="mono dim">Datum *</span><input type="date" name="date" required value="${esc(e.date)}" ${editing ? "disabled" : ""}></label>
              <label class="field"><span class="mono dim">Ausgabe</span><input name="edition" placeholder="${nextNo}" value="${esc(e.edition)}"></label>
              <label class="field"><span class="mono dim">Location *</span><input name="venue" required value="${esc(e.venue)}"></label>
              <label class="field"><span class="mono dim">Adresse</span><input name="address" value="${esc(e.address)}"></label>
              <label class="field"><span class="mono dim">Uhrzeit</span><input name="time" value="${esc(e.time)}"></label>
              <label class="field"><span class="mono dim">Ticket-Link (optional)</span><input name="tickets" type="url" placeholder="https://" value="${esc(e.tickets)}"></label>
            </div>
            ${editing ? `<p class="hint">Das Datum kann nachträglich nicht geändert werden, weil der QR-Link daran hängt. Falls nötig: Event löschen und neu anlegen.</p>` : ""}
          </fieldset>
          <fieldset><legend>Live-Acts (stehen im Voting)</legend>
            <div id="acts">${(e.live.length ? e.live : [{}]).map(actRow).join("")}</div>
            <div><button type="button" class="btn sm ghost" id="addact">+ Act hinzufügen</button></div>
            <p class="hint">Namen nach dem Öffnen des Votings nicht mehr ändern, sonst passen die Stimmen nicht mehr.</p>
          </fieldset>
          <fieldset><legend>DJ (optional)</legend>
            <div class="grid3">
              <label class="field"><span class="mono dim">Name</span><input name="dj_name" value="${esc(e.dj && e.dj.name)}"></label>
              <label class="field"><span class="mono dim">Ab</span><input name="dj_from" value="${esc((e.dj && e.dj.from) || "11 PM")}"></label>
              <label class="field"><span class="mono dim">Link</span><input name="dj_link" value="${esc(e.dj && e.dj.link)}"></label>
            </div>
          </fieldset>
          <div class="cta-row"><button class="btn primary">Speichern</button><button type="button" class="btn ghost" id="cancel">Abbrechen</button></div>
        </form>
      </div>`;
    const back = () => { editing = null; renderList(); };
    document.getElementById("back").onclick = back;
    document.getElementById("cancel").onclick = back;
    document.getElementById("addact").onclick = () => document.getElementById("acts").insertAdjacentHTML("beforeend", actRow());
    document.getElementById("acts").addEventListener("click", (x) => { if (x.target.matches("[data-rm]")) x.target.closest(".act-row").remove(); });
    document.getElementById("ed").addEventListener("submit", (x) => {
      x.preventDefault();
      const f = new FormData(x.target);
      const names = f.getAll("act_name"), links = f.getAll("act_link");
      const live = names.map((n, i) => ({ name: n.trim(), link: (links[i] || "").trim() })).filter((a) => a.name);
      const date = editing ? editing.date : f.get("date");
      let id = editing ? editing.id : date;
      if (!editing) { let n = 2; while (events.some((ev) => ev.id === id)) id = `${date}-${n++}`; }
      const ev = {
        id, date, edition: f.get("edition").trim() || (editing ? "" : nextNo),
        venue: f.get("venue").trim(), address: f.get("address").trim(), time: f.get("time").trim(),
        tickets: f.get("tickets").trim(), live,
        dj: f.get("dj_name").trim() ? { name: f.get("dj_name").trim(), from: f.get("dj_from").trim(), link: f.get("dj_link").trim() } : null,
        winner: editing ? editing.winner : "", is_open: editing ? editing.is_open : false,
      };
      guard(async () => { await DB.saveEvent(ev, editing && editing.id); toast("Gespeichert"); editing = null; view = "list"; await load(); });
    });
  }

  DB.session() ? load() : renderLogin();
})();
