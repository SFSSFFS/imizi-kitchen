// ===== Booking logic (pure functions, no DOM) =====
const BookingLogic = (() => {
  const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const DEFAULTS = { minGuests: 1, maxGuests: 10, slotMinutes: 30, minAdvanceMinutes: 0, maxAdvanceDays: 90, lastSeatingBeforeCloseMinutes: 0 };
  const pad = (n) => String(n).padStart(2, "0");
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const toTime = (m) => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
  const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const rules = (cfg) => Object.assign({}, DEFAULTS, cfg.booking);
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  function validateConfig(cfg) {
    const r = rules(cfg), errors = [];
    const int = (v, min) => Number.isInteger(v) && v >= min;
    if (!cfg.name) errors.push("Restaurant name is required.");
    if (!Array.isArray(cfg.menu) || !cfg.menu.length) errors.push("Menu must contain at least one item.");
    else cfg.menu.forEach((it, i) => {
      if (!it || !it.name || !Number.isFinite(it.price) || it.price < 0) errors.push(`Menu item ${i + 1} needs a name and a valid price.`);
    });
    if (!int(r.minGuests, 1)) errors.push("Minimum guests must be a positive integer.");
    if (!int(r.maxGuests, r.minGuests || 1)) errors.push("Maximum guests must be an integer greater than or equal to minimum guests.");
    if (!int(r.slotMinutes, 1)) errors.push("Slot minutes must be a positive integer.");
    if (!int(r.minAdvanceMinutes, 0)) errors.push("Minimum advance minutes cannot be negative.");
    if (!int(r.maxAdvanceDays, 1)) errors.push("Maximum advance days must be a positive integer.");
    if (!int(r.lastSeatingBeforeCloseMinutes, 0)) errors.push("Last seating minutes cannot be negative.");
    if (cfg.hours) DAYS.forEach((d) => {
      const ranges = cfg.hours[d];
      if (ranges === undefined) return;
      if (!Array.isArray(ranges)) { errors.push(`Hours for ${cap(d)} must be a list like [["11:00","22:00"]] or [].`); return; }
      ranges.forEach((rg) => {
        const ok = Array.isArray(rg) && TIME_RE.test(rg[0]) && TIME_RE.test(rg[1]) && toMin(rg[0]) < toMin(rg[1]);
        if (!ok) errors.push(`Invalid hours on ${cap(d)}: use ["HH:MM","HH:MM"] with opening before closing, same day.`);
      });
    });
    return errors;
  }

  // لو hours غير موجودة: لا قيود على الأيام/الساعات
  const rangesFor = (cfg, date) => (cfg.hours ? cfg.hours[DAYS[date.getDay()]] || [] : [["00:00", "23:59"]]);

  function check(cfg, dateStr, now = new Date()) {
    const r = rules(cfg);
    const fail = (error) => ({ ok: false, slots: [], error });
    if (!dateStr) return fail("Please choose a date.");
    const date = parseDate(dateStr), today = parseDate(ymd(now));
    if (date < today) return fail("Please choose a date that is not in the past.");
    const last = new Date(today); last.setDate(last.getDate() + r.maxAdvanceDays);
    if (date > last) return fail(`Reservations can be made up to ${r.maxAdvanceDays} days ahead.`);
    const ranges = rangesFor(cfg, date);
    if (!ranges.length) return fail(`We are closed on ${cap(DAYS[date.getDay()])}s. Please choose another day.`);
    const isToday = date.getTime() === today.getTime();
    const earliest = isToday ? now.getHours() * 60 + now.getMinutes() + r.minAdvanceMinutes : 0;
    const set = new Set();
    ranges.forEach(([open, close]) => {
      const end = toMin(close);
      for (let t = toMin(open); t < end && t <= end - r.lastSeatingBeforeCloseMinutes; t += r.slotMinutes) {
        if (t >= earliest) set.add(t);
      }
    });
    const slots = [...set].sort((a, b) => a - b).map(toTime);
    if (!slots.length) return fail(isToday ? "No more reservation times are available today. Please choose another date." : "No reservation times are available on this date.");
    return { ok: true, slots, error: "" };
  }

  function validate(cfg, { date, time, guests }, now = new Date()) {
    const r = rules(cfg), c = check(cfg, date, now);
    if (!c.ok) return c.error;
    if (!time) return "Please choose a reservation time.";
    if (!c.slots.includes(time)) return "That time is not available. Please choose one from the list.";
    const g = Number(guests);
    if (!Number.isInteger(g) || g < r.minGuests || g > r.maxGuests) return `Guests must be between ${r.minGuests} and ${r.maxGuests}.`;
    return "";
  }

  return { check, validate, validateConfig, rules, ymd, parseDate, DAYS, cap };
})();

if (typeof document === "undefined") {
  module.exports = BookingLogic; // للاختبار في Node فقط
} else {
  (() => {
    const C = restaurantConfig;
    const configErrors = BookingLogic.validateConfig(C);
    if (configErrors.length) {
      const safe = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
      document.body.innerHTML = `<div style="padding:30px;font-family:Arial;color:#b91c1c"><h1>Restaurant Configuration Error</h1><ul style="margin:16px 0 16px 20px">${configErrors.map((e) => `<li>${safe(e)}</li>`).join("")}</ul><p>Please correct config.js and reload the page.</p></div>`;
      return;
    }
    const ct = C.contact || {};
    const $ = (id) => document.getElementById(id);
    const setText = (id, t) => { const el = $(id); if (el) el.textContent = t || ""; };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const fmt = (n) => n.toLocaleString("en-US") + " " + C.currency;
    const wa = String(C.whatsapp || "").replace(/\D/g, "");
    const waOk = /^\d{10,15}$/.test(wa);
    const openWA = (msg) => window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, "_blank");

    // ---- Branding ----
    const col = C.colors || {};
    const root = document.documentElement.style;
    if (col.primary) root.setProperty("--primary", col.primary);
    if (col.accent) root.setProperty("--accent", col.accent);
    const bg = col.background || col.cream;
    if (bg) root.setProperty("--cream", bg);
    if (C.favicon) $("siteFavicon").href = C.favicon;

    document.title = `${C.name} | ${C.tagline}`;
    document.querySelectorAll(".logo").forEach((a) => {
      a.querySelector(".logo-name").textContent = C.name.toUpperCase();
      if (C.logo) {
        const img = document.createElement("img");
        img.src = C.logo; img.alt = C.name; img.className = "logo-img";
        img.onerror = () => img.remove();
        a.prepend(img);
      }
    });
    setText("restaurantWelcome", `WELCOME TO ${C.name.toUpperCase()}`);
    setText("restaurantTagline", C.tagline);
    setText("restaurantDescription", C.description);
    setText("restaurantStory", C.story);
    setText("contactNote", C.address);
    setText("footerCopy", `© ${new Date().getFullYear()} ${C.name}`);

    const links = [
      ["Call", ct.phone && `tel:${ct.phone}`], ["Email", ct.email && `mailto:${ct.email}`],
      ["Instagram", ct.instagram], ["Facebook", ct.facebook], ["TikTok", ct.tiktok], ["YouTube", ct.youtube]
    ].filter((l) => l[1]);
    $("footerLinks").innerHTML = links.map((l) => `<a href="${esc(l[1])}" target="_blank" rel="noopener">${l[0]}</a>`).join("");

    // ---- Opening hours list ----
    if (C.hours) {
      $("hoursList").innerHTML = BookingLogic.DAYS.slice(1).concat("sunday").map((d) => {
        const r = C.hours[d] || [];
        return `<div class="${r.length ? "" : "closed"}"><span>${BookingLogic.cap(d)}</span><span>${r.length ? r.map((x) => x.join(" – ")).join(", ") : "Closed"}</span></div>`;
      }).join("");
    }

    // ---- Mobile nav ----
    const toggle = $("menuToggle"), nav = $("navLinks");
    const setMenu = (open) => {
      nav.classList.toggle("active", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      toggle.textContent = open ? "✕" : "☰";
    };
    toggle.addEventListener("click", () => setMenu(!nav.classList.contains("active")));
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

    // ---- Menu ----
    $("menuGrid").innerHTML = C.menu.map((item, i) => `
      <article class="menu-card">
        <img src="${esc(item.image)}" alt="${esc(item.alt || item.name)}" loading="lazy">
        <div class="menu-card-content">
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.description)}</p>
          <span>${fmt(item.price)}</span>
          <button type="button" class="btn btn-primary add-to-cart" data-id="${i}">Add to Order</button>
        </div>
      </article>`).join("");

    // ---- Cart (keyed by menu index) ----
    const cart = {};
    const cartTotal = () => Object.entries(cart).reduce((s, [i, q]) => s + C.menu[i].price * q, 0);
    const cartCount = () => Object.values(cart).reduce((s, q) => s + q, 0);

    function renderCart() {
      const entries = Object.entries(cart);
      $("cartItems").innerHTML = entries.length
        ? entries.map(([i, q]) => `
          <div class="cart-item">
            <div><strong>${esc(C.menu[i].name)}</strong><p>${q} × ${fmt(C.menu[i].price)}</p></div>
            <div class="cart-controls">
              <button type="button" data-action="dec" data-id="${i}" aria-label="Remove one">−</button>
              <span>${q}</span>
              <button type="button" data-action="inc" data-id="${i}" aria-label="Add one">+</button>
            </div>
          </div>`).join("")
        : "<p>Your cart is empty. Add something delicious!</p>";
      const total = fmt(cartTotal()), n = cartCount();
      setText("cartTotal", total);
      setText("floatingCartTotal", total);
      setText("floatingCartCount", `${n} ${n === 1 ? "item" : "items"}`);
      $("floatingCart").classList.toggle("show", n > 0);
    }

    $("menuGrid").addEventListener("click", (e) => {
      const b = e.target.closest(".add-to-cart");
      if (!b) return;
      cart[b.dataset.id] = (cart[b.dataset.id] || 0) + 1;
      renderCart();
    });

    $("cartItems").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-action]");
      if (!b) return;
      const id = b.dataset.id;
      cart[id] += b.dataset.action === "inc" ? 1 : -1;
      if (cart[id] <= 0) delete cart[id];
      renderCart();
    });

    $("sendOrder").addEventListener("click", () => {
      if (!cartCount()) return alert("Please add something to your order first.");
      if (!waOk) return alert("WhatsApp is not configured yet.");
      let msg = "Hello! I would like to place an order:\n\n";
      Object.entries(cart).forEach(([i, q]) => (msg += `${q} x ${C.menu[i].name} - ${fmt(C.menu[i].price * q)}\n`));
      openWA(msg + `\nTotal: ${fmt(cartTotal())}\n\nThank you!`);
    });

    $("viewCartButton").addEventListener("click", () => $("cart").scrollIntoView({ behavior: "smooth" }));

    // ---- Booking ----
    const R = BookingLogic.rules(C);
    const dateInput = $("bookingDate"), timeSelect = $("bookingTime"), guestSelect = $("guestCount");
    const hint = $("bookingHint"), msgEl = $("bookingMessage");

    function setDateLimits() {
      const today = new Date();
      const max = new Date(today); max.setDate(max.getDate() + R.maxAdvanceDays);
      dateInput.min = BookingLogic.ymd(today);
      dateInput.max = BookingLogic.ymd(max);
    }

    function fillGuests() {
      let html = '<option value="">Select guests</option>';
      for (let g = R.minGuests; g <= R.maxGuests; g++) html += `<option value="${g}">${g} ${g === 1 ? "Person" : "People"}</option>`;
      guestSelect.innerHTML = html;
    }

    function fillTimes() {
      msgEl.textContent = "";
      const res = BookingLogic.check(C, dateInput.value);
      hint.textContent = res.error;
      timeSelect.disabled = !res.ok;
      timeSelect.innerHTML = res.ok
        ? '<option value="">Select time</option>' + res.slots.map((t) => `<option value="${t}">${t}</option>`).join("")
        : `<option value="">${dateInput.value ? "Not available" : "Choose a date first"}</option>`;
    }

    setDateLimits(); fillGuests();
    dateInput.addEventListener("change", fillTimes);

    $("bookingForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const data = { date: dateInput.value, time: timeSelect.value, guests: guestSelect.value };
      const error = BookingLogic.validate(C, data);
      if (error) { msgEl.textContent = error; fillTimes(); msgEl.textContent = error; return; }
      if (!waOk) { msgEl.textContent = "WhatsApp is not configured yet. Please contact the restaurant."; return; }
      openWA(
        `Hello! I would like to request a reservation.\n\n` +
        `Name: ${$("customerName").value.trim()}\nPhone: ${$("customerPhone").value.trim()}\n` +
        `Date: ${data.date}\nTime: ${data.time}\nGuests: ${data.guests}`
      );
      e.target.reset();
      setDateLimits(); fillTimes();
      msgEl.textContent = "Your reservation request is ready to send via WhatsApp.";
    });

    renderCart();
  })();
}