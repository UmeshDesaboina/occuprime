/* =========================================================
   OccuPrime Healthcare - advanced features
   Uses globals from script.js: $, $$, io, cio, animateCount, cld, CONFIG, waBase
   ========================================================= */
(() => {
  "use strict";

  const BLOG  = window.BLOG_POSTS || [];
  const CASES = window.CASE_STUDIES || [];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wa = text => `${waBase}?text=${encodeURIComponent(text)}`;
  const openWA = text => window.open(wa(text), "_blank", "noopener");

  /* ---------- helpers ---------- */
  function setBg(el, key, w) {
    const id = CONFIG.images[key];
    if (!el || !id) return;
    const url = cld(id, w);
    const p = new Image();
    p.onload = () => { el.style.backgroundImage = `url("${url}")`; el.classList.add("has-img"); };
    p.src = url;
  }

  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  /* ---------- Theme toggle ---------- */
  (function theme() {
    const root = document.documentElement;
    if (!root.dataset.theme) root.dataset.theme = "dark";
    const meta = $('meta[name="theme-color"]');
    const apply = () => { if (meta) meta.content = root.dataset.theme === "light" ? "#f5f8fb" : "#06121f"; };
    apply();
    $("#themeToggle")?.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try { localStorage.setItem("op-theme", next); } catch (e) { /* ignore */ }
      apply();
    });
  })();

  /* ---------- Scrollspy for nav ---------- */
  (function spy() {
    const map = {};
    $$("#navLinks a[href^='#']").forEach(a => { map[a.getAttribute("href").slice(1)] = a; });
    const spyIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          Object.values(map).forEach(a => a.classList.remove("active"));
          map[e.target.id]?.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(id => { const s = document.getElementById(id); if (s) spyIO.observe(s); });
  })();

  /* ---------- Case studies ---------- */
  (function cases() {
    const tabs = $("#caseTabs"), panel = $("#casePanel");
    if (!tabs || !panel || !CASES.length) return;

    CASES.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab-btn" + (i ? "" : " active");
      b.textContent = c.tab;
      b.addEventListener("click", () => {
        $$(".tab-btn", tabs).forEach(x => x.classList.toggle("active", x === b));
        render(c, true);
      });
      tabs.appendChild(b);
    });

    function render(c, immediate) {
      panel.innerHTML = `
        <div class="case">
          <div class="case-main glass-card">
            <div class="case-tag"><i class="pulse"></i>${esc(c.industry)}</div>
            <h3>${esc(c.title)}</h3>
            <h4>The challenge</h4>
            <p>${esc(c.challenge)}</p>
            <h4>What we delivered</h4>
            <ul class="checks">${c.solution.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
            <blockquote class="case-quote">“${esc(c.quote)}”<footer>${esc(c.by)}</footer></blockquote>
          </div>
          <div class="case-side">
            <div class="case-img"></div>
            <div class="metrics">
              ${c.metrics.map(m => `
                <div class="metric">
                  <div class="m-top"><b data-count="${m.value}" data-suffix="${esc(m.suffix || "")}">0</b><span>${esc(m.label)}</span></div>
                  <div class="bar"><i style="--w:${m.bar}%"></i></div>
                  <small>${esc(m.note)}</small>
                </div>`).join("")}
            </div>
          </div>
        </div>`;
      setBg($(".case-img", panel), c.img, 900);
      $$(".metric", panel).forEach(m => {
        const num = $("[data-count]", m);
        if (immediate) { m.classList.add("in"); animateCount(num); }
        else { m.classList.add("reveal"); io.observe(m); cio.observe(num); }
      });
    }
    render(CASES[0], false);
  })();

  /* ---------- Tools tabs ---------- */
  $$(".tool-tab").forEach(b => b.addEventListener("click", () => {
    $$(".tool-tab").forEach(x => x.classList.toggle("active", x === b));
    $$(".tool-panel").forEach(p => p.classList.toggle("active", p.id === "tool-" + b.dataset.tool));
  }));

  /* ---------- OHC estimator ---------- */
  (function estimator() {
    const wf = $("#wf");
    if (!wf) return;
    const out = $("#wfVal");
    const cur = {};

    function tween(el, to) {
      const k = el.dataset.k, from = cur[k] || 0;
      cur[k] = to;
      const t0 = performance.now(), d = 600;
      (function f(n) {
        const p = Math.min((n - t0) / d, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (to - from) * e).toLocaleString("en-IN");
        if (p < 1) requestAnimationFrame(f);
      })(t0);
    }

    function calc() {
      const w = +wf.value;
      const hz = $("input[name=hazard]:checked").value;
      const sh = +$("input[name=shifts]:checked").value;
      const f = { low: .8, medium: 1, high: 1.35 }[hz];

      let mo = w < 1000 ? 1 : w < 2500 ? 2 : 3;
      if (hz === "high" && w >= 500) mo += 1;

      const perShift = w / sh;
      const nursePerShift = Math.max(1, Math.ceil((perShift / 400) * f));
      const nurses = Math.ceil(nursePerShift * sh * (sh > 1 ? 1.2 : 1));

      const amb = (w < 150 && hz === "low") ? 0 : 1 + Math.floor(w / 2500) + ((hz === "high" && w >= 1500) ? 1 : 0);
      const emtPerShift = amb ? (w >= 2000 ? 2 : 1) : 0;
      const emt = Math.ceil(emtPerShift * sh * 1.2);

      const pre = Math.round(w * 0.18);
      const periodic = Math.round(w * { low: .5, medium: .8, high: 1 }[hz]);
      const exams = pre + periodic;
      const area = Math.round((250 + w * .35) / 10) * 10;

      return {
        w, hz, sh, mo, nurses, emt, amb, exams, area,
        sub: {
          mo: w < 250 ? "Part-time FMO visits" : mo > 1 ? "Roster covers all shifts" : "Full-time on site",
          nurse: `${nursePerShift} per shift`,
          emt: emt ? `${emtPerShift} per shift` : "Tie-up with nearby EMS",
          amb: amb ? "Fully equipped" : "Hospital tie-up advised",
          exams: "Pre-employment + periodic",
          area: "sq ft recommended"
        }
      };
    }

    let last;
    function update() {
      wf.style.setProperty("--p", ((wf.value - wf.min) / (wf.max - wf.min)) * 100 + "%");
      out.textContent = (+wf.value).toLocaleString("en-IN");
      const r = last = calc();
      const map = { mo: r.mo, nurse: r.nurses, emt: r.emt, amb: r.amb, exams: r.exams, area: r.area };
      Object.entries(map).forEach(([k, v]) => {
        tween($(`[data-k="${k}"]`), v);
        $(`[data-s="${k}"]`).textContent = r.sub[k];
      });
    }
    $$("#tool-estimator input").forEach(i => i.addEventListener("input", update));
    update();

    $("#estCta").addEventListener("click", () => {
      const r = last;
      openWA([
        "Hello OccuPrime, I used the OHC Estimator on your website.",
        "",
        `*Workforce:* ${r.w.toLocaleString("en-IN")}`,
        `*Hazard level:* ${r.hz}`,
        `*Shifts:* ${r.sh}`,
        "",
        `*Indicative setup:* ${r.mo} medical officer(s), ${r.nurses} nursing staff, ${r.emt} EMT(s), ${r.amb} ambulance(s), ~${r.exams.toLocaleString("en-IN")} exams/year`,
        "",
        "Please share a detailed proposal."
      ].join("\n"));
    });
  })();

  /* ---------- Compliance self-check ---------- */
  (function assess() {
    const list = $("#qList");
    if (!list) return;
    const Q = [
      { q: "A qualified Factory Medical Officer / occupational health physician is appointed.", short: "Medical officer appointment", fix: "FMO Advisory" },
      { q: "Pre-employment medical examinations are completed for every new joiner.", short: "Pre-employment exams", fix: "Statutory Medical Checkups" },
      { q: "Periodic examinations for workers in hazardous processes are on schedule and recorded.", short: "Periodic exams", fix: "Statutory Medical Checkups" },
      { q: "An onsite OHC or first-aid centre with trained staff is available on every shift.", short: "Onsite OHC coverage", fix: "Turnkey OHC Management" },
      { q: "An ambulance with trained responders is available 24x7, or a formal hospital tie-up exists.", short: "24x7 emergency transport", fix: "Ambulance Fleet Operations" },
      { q: "Emergency response mock drills are held at least twice a year.", short: "Mock drills", fix: "Ambulance Fleet Operations" },
      { q: "Occupational hazards are documented and disease surveillance is in place.", short: "Hazard & disease surveillance", fix: "FMO Advisory" },
      { q: "An internal OH&S audit against ISO 45001 (or equivalent) was done in the last 12 months.", short: "Internal OH&S audit", fix: "EHS & ISO 45001 Audits" }
    ];
    const ans = Array(Q.length).fill(null);
    const C = 2 * Math.PI * 54;

    Q.forEach((it, i) => {
      const row = document.createElement("div");
      row.className = "q";
      row.innerHTML = `<p><b>${String(i + 1).padStart(2, "0")}</b>${esc(it.q)}</p>
        <div class="opts" role="group" aria-label="Answer for question ${i + 1}">
          ${[["Yes", 1], ["Partly", 0.5], ["No", 0]].map(([l, v]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}
        </div>`;
      $$("button", row).forEach(b => b.addEventListener("click", () => {
        ans[i] = +b.dataset.v;
        $$("button", row).forEach(x => x.classList.toggle("sel", x === b));
        update();
      }));
      list.appendChild(row);
    });

    const ring = $("#ringFill");
    ring.style.strokeDasharray = C;
    ring.style.strokeDashoffset = C;

    function tier(p) {
      if (p >= 85) return { t: "Audit-ready", c: "var(--em)", m: "Excellent. Your fundamentals are strong. A periodic audit will help keep the standard consistent." };
      if (p >= 60) return { t: "Solid foundation", c: "var(--em)", m: "Good base, with a few gaps worth closing before your next inspection or audit." };
      if (p >= 35) return { t: "Needs attention", c: "var(--gold)", m: "Several important controls are missing or partial. A structured plan can close these quickly." };
      return { t: "High exposure", c: "#ff6b6b", m: "Significant gaps put workers and compliance at risk. We recommend a site assessment soon." };
    }

    function update() {
      const n = ans.filter(a => a !== null).length;
      $("#aCount").textContent = `${n} of ${Q.length} answered`;
      $("#aBar").style.width = (n / Q.length) * 100 + "%";
      const res = $("#aResult");
      if (n < Q.length) { res.hidden = true; return; }

      const pct = Math.round((ans.reduce((a, b) => a + b, 0) / Q.length) * 100);
      const t = tier(pct);
      res.hidden = false;
      ring.style.stroke = t.c;
      requestAnimationFrame(() => { ring.style.strokeDashoffset = C * (1 - pct / 100); });
      $("#ringPct").textContent = pct + "%";
      $("#ringTier").textContent = t.t;
      $("#aTitle").textContent = t.t;
      $("#aMsg").textContent = t.m;

      const gaps = Q.map((it, i) => ({ ...it, v: ans[i] })).filter(g => g.v < 1);
      $("#aGaps").innerHTML = gaps.length
        ? gaps.map(g => `<li><b>${esc(g.short)}${g.v === .5 ? " (partial)" : ""}</b><span>${esc(g.fix)}</span></li>`).join("")
        : `<li><b>No gaps found</b><span>Keep auditing regularly</span></li>`;

      $("#aCta").onclick = () => openWA([
        "Hello OccuPrime, I completed the Compliance Self-Check on your website.",
        "",
        `*Score:* ${pct}% (${t.t})`,
        gaps.length ? `*Gaps:* ${gaps.map(g => g.short).join(", ")}` : "*Gaps:* none identified",
        "",
        "I would like to discuss next steps."
      ].join("\n"));
      res.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    $("#aReset").addEventListener("click", () => {
      ans.fill(null);
      $$("#qList .opts button").forEach(b => b.classList.remove("sel"));
      ring.style.strokeDashoffset = C;
      update();
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  })();

  /* ---------- Blog ---------- */
  (function blog() {
    const grid = $("#blogGrid");
    if (!grid || !BLOG.length) return;
    const empty = $("#blogEmpty"), filters = $("#blogFilters");
    const modal = $("#postModal"), card = $("#modalCard"), scroller = $("#modalScroll");
    const body = $("#modalBody"), hero = $("#modalHero"), prog = $("#modalProgress");
    let cat = "All", q = "", lastFocus = null;

    const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const mins = p => Math.max(2, Math.round(p.body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));
    const postUrl = id => location.href.split("#")[0] + "#post-" + id;

    ["All", ...new Set(BLOG.map(p => p.category))].forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab-btn sm" + (i ? "" : " active");
      b.textContent = c;
      b.addEventListener("click", () => {
        cat = c;
        $$(".tab-btn", filters).forEach(x => x.classList.toggle("active", x === b));
        render();
      });
      filters.appendChild(b);
    });
    $("#blogSearch").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); render(); });

    function render() {
      const list = BLOG.filter(p =>
        (cat === "All" || p.category === cat) &&
        (!q || (p.title + " " + p.excerpt + " " + p.category).toLowerCase().includes(q)));
      grid.innerHTML = "";
      empty.hidden = list.length > 0;
      list.forEach((p, i) => {
        const feat = i === 0 && cat === "All" && !q;
        const el = document.createElement("article");
        el.className = "blog-card" + (feat ? " featured" : "");
        el.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", "Read: " + p.title);
        el.innerHTML = `
          <div class="bc-img"><span class="ico">${p.icon}</span><span class="bc-tag">${esc(p.category)}</span></div>
          <div class="bc-body">
            <div class="bc-meta"><span>${fmtDate(p.date)}</span><span>·</span><span>${mins(p)} min read</span></div>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt)}</p>
            <span class="bc-more">Read article <span>→</span></span>
          </div>`;
        setBg($(".bc-img", el), p.img, feat ? 1000 : 700);
        el.addEventListener("click", () => open(p.id));
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(p.id); } });
        grid.appendChild(el);
      });
    }

    function open(id, push = true) {
      const p = BLOG.find(x => x.id === id);
      if (!p) return;
      lastFocus = document.activeElement;
      hero.classList.remove("has-img");
      hero.style.backgroundImage = "";
      hero.innerHTML = `<span class="ico">${p.icon}</span>`;
      setBg(hero, p.img, 1200);

      const related = [...BLOG.filter(x => x.id !== id && x.category === p.category), ...BLOG.filter(x => x.id !== id && x.category !== p.category)].slice(0, 2);
      body.innerHTML = `
        <div class="post-meta"><span class="bc-tag static">${esc(p.category)}</span><span>${fmtDate(p.date)}</span><span>·</span><span>${mins(p)} min read</span></div>
        <h2>${esc(p.title)}</h2>
        <div class="post-by"><i>OP</i><div><b>OccuPrime Clinical Team</b><small>Occupational health &amp; safety</small></div></div>
        <div class="post-content">${p.body}</div>
        <div class="post-cta">
          <div><h4>Need help applying this at your plant?</h4><p>Talk to our occupational health specialists.</p></div>
          <button type="button" class="btn btn-primary" data-ask="${esc(p.id)}">Ask on WhatsApp</button>
        </div>
        <div class="post-actions">
          <span>Share</span>
          <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(p.title + " " + postUrl(id))}">WhatsApp</a>
          <button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(id)}">Copy link</button>
        </div>
        <div class="related"><h4>Keep reading</h4><div class="rel-grid">
          ${related.map(r => `<button type="button" class="rel-card" data-post="${esc(r.id)}"><small>${esc(r.category)} · ${mins(r)} min</small><b>${esc(r.title)}</b></button>`).join("")}
        </div></div>`;

      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("lock");
      scroller.scrollTop = 0;
      prog.style.width = "0%";
      card.focus({ preventScroll: true });
      if (push) { try { history.replaceState(null, "", "#post-" + id); } catch (e) { /* ignore */ } }
    }

    function close() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lock");
      if (location.hash.startsWith("#post-")) { try { history.replaceState(null, "", "#blog"); } catch (e) { /* ignore */ } }
      lastFocus?.focus?.({ preventScroll: true });
    }

    scroller.addEventListener("scroll", () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      prog.style.width = (max > 0 ? (scroller.scrollTop / max) * 100 : 0) + "%";
    }, { passive: true });

    modal.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) close(); });

    body.addEventListener("click", e => {
      const rel = e.target.closest("[data-post]");
      if (rel) { open(rel.dataset.post); return; }
      const cp = e.target.closest("[data-copy]");
      if (cp) {
        const url = postUrl(cp.dataset.copy);
        (navigator.clipboard?.writeText(url) || Promise.reject()).then(() => toast("Link copied"), () => toast("Copy not supported here"));
        return;
      }
      const ask = e.target.closest("[data-ask]");
      if (ask) {
        const p = BLOG.find(x => x.id === ask.dataset.ask);
        openWA(`Hello OccuPrime, I read your article "${p.title}" and would like to discuss it for our facility.`);
      }
    });

    render();
    if (location.hash.startsWith("#post-")) open(location.hash.slice(6), false);

    /* Newsletter */
    $("#newsForm")?.addEventListener("submit", e => {
      e.preventDefault();
      const em = $("#newsEmail").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast("Please enter a valid email address"); return; }
      openWA(`Hello OccuPrime, please add me to your health & safety insights list. Email: ${em}`);
      toast("Opening WhatsApp to confirm your subscription");
      e.target.reset();
    });
  })();
})();
