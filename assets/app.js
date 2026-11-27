(function () {
  const D = window.MS_DATA;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let next = null, past = [];

  const fmt = (iso) => iso.split("-").reverse().join(".");
  const act = (a) => (a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.name)}</a>` : esc(a.name));

  function qr(el, url) {
    const q = qrcode(0, "M"); q.addData(url); q.make();
    el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

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

  function archiveCard(e) {
    const people = [...e.live.map((a) => ({ ...a, role: "Live" })), ...(e.dj ? [{ ...e.dj, role: "DJ" }] : [])];
    return `<article class="arch">
      <div class="arch-head">
        <div><span class="mono lime">${esc(e.edition)}</span> <span class="mono">${esc(e.weekday)} ${fmt(e.date)}</span></div>
        <div class="mono dim">${esc(e.venue)}</div>
      </div>
      <div class="arch-body">
        ${e.poster ? `<a class="arch-poster" href="${esc(e.poster)}" target="_blank" rel="noopener"><img src="${esc(e.poster)}" alt="${t("archive.poster")} ${esc(e.edition)}" loading="lazy"></a>` : ""}
        <div class="arch-people">
          ${people.map((p) => `<figure class="person">
            ${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="ph"></div>`}
            <figcaption><span class="mono dim">${p.role}</span><strong>${act(p)}</strong></figcaption>
          </figure>`).join("")}
        </div>
      </div>
      ${e.spin_result ? `<div class="arch-foot mono"><span class="dim">${t("archive.wheel")}</span> <span class="lime">${esc(e.spin_result)}</span></div>` : ""}
    </article>`;
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
            <span class="mono">${esc(next.time)}${next.address ? ` · <span class="dim">${esc(next.address)}</span>` : ""}</span>
            <div class="cta-row" style="margin:0">
              ${next.tickets ? `<a class="btn primary" href="${esc(next.tickets)}" target="_blank" rel="noopener">${t("next.tickets")}</a>` : ""}
              <a class="btn" href="${icsHref(next)}" download="musikscout-${next.id}.ics">${t("next.cal")}</a>
              <a class="btn" href="https://maps.google.com/?q=${encodeURIComponent(next.venue + ", " + (next.address || "Berlin"))}" target="_blank" rel="noopener">${t("next.map")}</a>
            </div>
          </div>
        </article>`
      : `<p class="empty">${t("next.none")}</p>`;

    $("#archive-list").innerHTML = past.length ? past.map(archiveCard).join("") : `<p class="empty">${t("archive.empty")}</p>`;
  }

  // Links & QR-Codes
  document.querySelectorAll(".js-insta").forEach((a) => (a.href = D.instagram));
  document.querySelectorAll(".js-handle").forEach((a) => (a.textContent = D.instagramHandle));
  $("#paypal-link").href = D.paypal;
  qr($("#qr-insta"), D.instagram);
  qr($("#qr-paypal"), D.paypal);
  $("#year").textContent = new Date().getFullYear();

  // Demo-Rad im Abschnitt "Das Spiel"
  const wheel = MSWheel.create($("#demo-wheel"), { interactive: true });
  wheel.set("jazz");

  msApplyI18n();
  document.addEventListener("ms:lang", render);
  MS_DB.listEvents().then((events) => {
    const today = MS_DB.today();
    next = events.find((e) => e.date >= today) || null;
    past = events.filter((e) => e.date < today).reverse();
    render();
  }).catch(() => render());
})();
