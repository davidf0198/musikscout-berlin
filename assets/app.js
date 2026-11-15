(function () {
  const D = window.MS_DATA;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let next = null, past = [];

  const fmt = (iso) => iso.split("-").reverse().join(".");
  const act = (a) => (a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.name)}</a>` : esc(a.name));

  function icsHref(e) {
    const d = e.date.replace(/-/g, "");
    const n = new Date(e.date); n.setDate(n.getDate() + 1);
    const d2 = n.toISOString().slice(0, 10).replace(/-/g, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//musik scout//EN", "BEGIN:VEVENT",
      `UID:${e.id}@musikscout.berlin`, `DTSTART;TZID=Europe/Berlin:${d}T190000`, `DTEND;TZID=Europe/Berlin:${d2}T020000`,
      `SUMMARY:musik scout ${e.edition || ""} – ${e.venue}`,
      `LOCATION:${e.venue}, ${e.address || "Berlin"}`,
      `DESCRIPTION:Live: ${e.live.map((a) => a.name).join(", ")}${e.dj ? " / DJ: " + e.dj.name : ""}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  }

  function render() {
    $("#hero-date").innerHTML = next ? `${next.weekday}<br>${fmt(next.date)}` : "";
    $("#next-edition").textContent = next && next.edition ? next.edition : "";

    $("#next-event").innerHTML = next
      ? `<article class="event-card">
          <div class="left">
            <div class="mono">Berlin<br>${esc(next.venue)}</div>
            <div>
              <div class="mono lime">${esc(next.weekday)}</div>
              <div class="event-date">${fmt(next.date).slice(0, 5)}<span class="dim">.${next.date.slice(0, 4)}</span></div>
            </div>
          </div>
          <div class="right">
            <div class="group"><div class="mono lime">${t("next.live")}</div><ul class="lineup">${next.live.map((a) => `<li>${act(a)}</li>`).join("")}</ul></div>
            ${next.dj ? `<div class="group"><div class="mono lime">${t("next.dj", { time: esc(next.dj.from) })}</div><ul class="lineup"><li>${act(next.dj)}</li></ul></div>` : ""}
          </div>
          <div class="event-foot">
            <span class="mono">${esc(next.time)}</span>
            <div class="cta-row" style="margin:0">
              ${next.tickets ? `<a class="btn primary" href="${esc(next.tickets)}" target="_blank" rel="noopener">${t("next.tickets")}</a>` : ""}
              <a class="btn" href="${icsHref(next)}" download="musikscout-${next.id}.ics">${t("next.cal")}</a>
              <a class="btn" href="https://maps.google.com/?q=${encodeURIComponent(next.venue + ", " + (next.address || "Berlin"))}" target="_blank" rel="noopener">${t("next.map")}</a>
            </div>
          </div>
        </article>`
      : `<p class="empty">${t("next.none")}</p>`;

    $("#archive-list").innerHTML = past.length
      ? past.map((e) => `<li>
          <span class="mono lime">${esc(e.edition || "")}</span>
          <span class="mono">${fmt(e.date)}</span>
          <span class="acts">${e.live.map((a) => esc(a.name)).join(" · ")}</span>
          <span class="mono">${e.winner ? `<span class="dim">${t("archive.winner")}:</span> <span class="win">${esc(e.winner)}</span>` : esc(e.venue)}</span>
        </li>`).join("")
      : `<li class="empty" style="display:block">${t("archive.empty")}</li>`;
  }

  // Bewerbung: öffnet Mailprogramm (kein Backend nötig)
  $("#apply-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const body = `Name: ${f.get("name")}\nEmail: ${f.get("email")}\nMusic: ${f.get("link")}\n\n${f.get("msg") || ""}`;
    location.href = `mailto:${D.email}?subject=${encodeURIComponent("Play at musik scout: " + f.get("name"))}&body=${encodeURIComponent(body)}`;
  });

  $("#insta-link").href = D.instagram;
  $("#year").textContent = new Date().getFullYear();

  msApplyI18n();
  document.addEventListener("ms:lang", render);
  MS_DB.listEvents().then((events) => {
    const today = MS_DB.today();
    next = events.find((e) => e.date >= today) || null;
    past = events.filter((e) => e.date < today).reverse();
    render();
  }).catch(() => render());
  $("#hero-logo").innerHTML = '<img src="assets/logo.svg" alt="">';
})();
