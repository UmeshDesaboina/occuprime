
/* =========================================================
   OccuPrime Healthcare - site behaviour
   ========================================================= */

/* ---------- CONFIG: edit these ---------- */
const CONFIG = {
  // WhatsApp number in international format, digits only (country code + number)
  whatsappNumber: "99999999999",
  // Your Cloudinary cloud name. "demo" is Cloudinary's public sample cloud (placeholder images).
  cloudName: "demo",
  // Map each slot to a Cloudinary public ID in your account.
  images: {
    hero:      "samples/landscapes/architecture-signs",
    ohc:       "samples/people/smiling-man",
    checkup:   "samples/people/jazz",
    fmo:       "samples/people/boy-snow-hoodie",
    ambulance: "samples/ecommerce/leather-bag-gray",
    audit:     "samples/ecommerce/analog-classic",
    team:      "samples/people/kitchen-bar",
    ind1:      "samples/landscapes/architecture-signs",
    ind2:      "samples/landscapes/nature-mountains",
    ind3:      "samples/ecommerce/car-interior-design",
    ind4:      "samples/landscapes/beach-boat",
    // blog + case-study images
    blog1:     "samples/ecommerce/analog-classic",
    blog2:     "samples/people/smiling-man",
    blog3:     "samples/landscapes/nature-mountains",
    blog4:     "samples/ecommerce/car-interior-design",
    blog5:     "samples/landscapes/architecture-signs",
    blog6:     "samples/landscapes/beach-boat",
    blog7:     "samples/people/kitchen-bar",
    case1:     "samples/ecommerce/car-interior-design",
    case2:     "samples/landscapes/nature-mountains",
    case3:     "samples/landscapes/architecture-signs"
  }
};

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- Cloudinary images ---------- */
function cld(id, w = 800, q = "auto") {
  return `https://res.cloudinary.com/${CONFIG.cloudName}/image/upload/f_auto,q_${q},c_fill,w_${w}/${id}`;
}
$$("[data-cld]").forEach(el => {
  const id = CONFIG.images[el.dataset.cld];
  if (!id) return;
  const url = cld(id, el.dataset.w || 800, el.dataset.q || "auto");
  const probe = new Image();
  probe.onload = () => {
    el.style.backgroundImage = `url("${url}")`;
  };
  probe.src = url; // on error the CSS gradient fallback stays
});

/* ---------- WhatsApp helpers ---------- */
const waBase = `https://wa.me/${CONFIG.whatsappNumber}`;
const waGreeting = encodeURIComponent("Hello OccuPrime Healthcare, I would like to know more about your services.");
["waDirect", "waFooter", "waFloat"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.href = `${waBase}?text=${waGreeting}`;
});

/* ---------- Nav, progress, back to top ---------- */
const nav = $("#nav"), progress = $("#progress"), toTop = $("#toTop");
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle("scrolled", y > 40);
  const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  toTop.classList.toggle("show", y > 700);
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

const burger = $("#burger"), navLinks = $("#navLinks");
burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  navLinks.classList.toggle("open");
});
$$("#navLinks a").forEach(a => a.addEventListener("click", () => {
  burger.classList.remove("open");
  navLinks.classList.remove("open");
}));

$("#year").textContent = new Date().getFullYear();

/* ---------- Cursor glow ---------- */
const glow = $("#cursorGlow");
if (matchMedia("(pointer:fine)").matches) {
  addEventListener("mousemove", e => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  }, { passive: true });
} else glow.remove();

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach(el => io.observe(el));

/* ---------- Counters ---------- */
function animateCount(el) {
  const target = +el.dataset.count, suffix = el.dataset.suffix || "";
  const dur = 1800, start = performance.now();
  const fmt = n => n.toLocaleString("en-IN");
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(Math.round(target * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}
const cio = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCount(e.target);
      const card = e.target.closest(".hero-card");
      if (card) card.classList.add("in");
      cio.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
$$("[data-count]").forEach(el => cio.observe(el));
// hero card bars should animate on load
setTimeout(() => $(".hero-card")?.classList.add("in"), 500);

/* ---------- Hero particles ---------- */
(function particles() {
  const c = $("#particles");
  if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = c.getContext("2d");
  let w, h, pts = [];
  const mouse = { x: -999, y: -999 };
  function resize() {
    w = c.width = c.offsetWidth;
    h = c.height = c.offsetHeight;
    const n = Math.min(90, Math.floor(w / 18));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.8 + .6
    }));
  }
  resize();
  addEventListener("resize", resize);
  c.parentElement.addEventListener("mousemove", e => {
    const r = c.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  (function draw() {
    ctx.clearRect(0, 0, w, h);
    pts.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(34,211,165,.7)";
      ctx.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(56,189,248,${.16 * (1 - d / 120)})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (md < 150) {
        ctx.strokeStyle = `rgba(230,195,106,${.4 * (1 - md / 150)})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    });
    requestAnimationFrame(draw);
  })();
})();

/* ---------- 3D tilt cards ---------- */
if (matchMedia("(pointer:fine)").matches) {
  $$(".tilt").forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform .6s cubic-bezier(.22,.8,.24,1)";
      card.style.transform = "";
      setTimeout(() => card.style.transition = "", 600);
    });
  });
}

/* ---------- Testimonial slider ---------- */
(function slider() {
  const slides = $$(".slide"), dotsWrap = $("#dots");
  let i = 0, timer;
  slides.forEach((_, n) => {
    const d = document.createElement("i");
    d.addEventListener("click", () => { go(n); restart(); });
    dotsWrap.appendChild(d);
  });
  const dots = $$("i", dotsWrap);
  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === i));
    dots.forEach((d, k) => d.classList.toggle("active", k === i));
  }
  function restart() { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); }
  $("#prev").addEventListener("click", () => { go(i - 1); restart(); });
  $("#next").addEventListener("click", () => { go(i + 1); restart(); });
  go(0); restart();
})();

/* ---------- FAQ accordion ---------- */
$$(".faq-item").forEach(item => {
  const q = $(".faq-q", item), a = $(".faq-a", item);
  q.addEventListener("click", () => {
    const open = item.classList.contains("open");
    $$(".faq-item.open").forEach(o => {
      o.classList.remove("open");
      $(".faq-a", o).style.maxHeight = 0;
    });
    if (!open) {
      item.classList.add("open");
      a.style.maxHeight = a.scrollHeight + "px";
    }
  });
});

/* ---------- Contact form -> WhatsApp ---------- */
(function form() {
  const f = $("#contactForm");
  const rules = {
    name:    v => v.trim().length >= 2 || "Please enter your name",
    company: v => v.trim().length >= 2 || "Please enter your company",
    phone:   v => /^[+()\-\s\d]{8,16}$/.test(v.trim()) || "Enter a valid phone number",
    email:   v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Enter a valid email",
    service: v => !!v || "Please select a service"
  };
  function check(id) {
    const el = f.elements[id];
    const res = rules[id] ? rules[id](el.value) : true;
    const field = el.closest(".field");
    field.classList.toggle("invalid", res !== true);
    const err = $(".err", field);
    if (err) err.textContent = res === true ? "" : res;
    return res === true;
  }
  Object.keys(rules).forEach(id => {
    f.elements[id].addEventListener("blur", () => check(id));
    f.elements[id].addEventListener("input", () => {
      if (f.elements[id].closest(".field").classList.contains("invalid")) check(id);
    });
  });
  f.addEventListener("submit", e => {
    e.preventDefault();
    const ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { $(".invalid input, .invalid select", f)?.focus(); return; }
    const d = Object.fromEntries(new FormData(f).entries());
    const lines = [
      "*New Enquiry - OccuPrime Healthcare*",
      "",
      `*Name:* ${d.name}`,
      `*Company:* ${d.company}`,
      `*Phone:* ${d.phone}`,
      d.email ? `*Email:* ${d.email}` : null,
      `*Service:* ${d.service}`,
      d.size ? `*Workforce:* ${d.size}` : null,
      d.date ? `*Preferred site-visit date:* ${new Date(d.date + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : null,
      d.time ? `*Best time to call:* ${d.time}` : null,
      d.message ? `*Requirement:* ${d.message}` : null
    ].filter(l => l !== null);
    const url = `${waBase}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener");
  });
})();
