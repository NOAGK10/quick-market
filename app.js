// תוכן ברירת מחדל מ-products.js – משמש רק אם השרת לא זמין
const FALLBACK = { site: SITE, categories: CATEGORIES, products: PRODUCTS, coupons: typeof COUPONS !== "undefined" ? COUPONS : [] };

// המוצרים העדכניים נשמרים בשרת (Netlify) דרך עמוד הניהול
async function loadData() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch("/api/products", { cache: "no-store", signal: ctrl.signal });
    clearTimeout(timer);
    const data = res.ok ? await res.json() : null;
    if (data && Array.isArray(data.products) && Array.isArray(data.categories)) return data;
  } catch {}
  return FALLBACK;
}

(async () => {
  const { site: SITE, categories: CATEGORIES, products: PRODUCTS, coupons: COUPON_LIST = [] } = await loadData();
  const $ = (s) => document.querySelector(s);
  const grid = $("#grid");
  const cats = $("#cats");
  const search = $("#search");
  const sort = $("#sort");
  const empty = $("#empty");
  const resultCount = $("#resultCount");
  const gridTitle = $("#gridTitle");
  const preview = $("#preview");
  const previewImg = preview.querySelector("img");

  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const catName = (id) => (catById[id] || {}).name || "";
  // subcategories: a category with a "parent" field lives under that parent
  const parentOf = (id) => {
    const c = catById[id];
    return c && c.parent && catById[c.parent] ? c.parent : null;
  };
  const topCats = CATEGORIES.filter((c) => !parentOf(c.id));
  const subsOf = (id) => CATEGORIES.filter((c) => parentOf(c.id) === id);
  const fullCatName = (id) => (parentOf(id) ? `${catName(parentOf(id))} › ${catName(id)}` : catName(id));
  const inCat = (p, id) => p.category === id || parentOf(p.category) === id;
  const imagesOf = (p) => (Array.isArray(p.images) && p.images.length ? p.images : [p.image]).filter(Boolean);
  const state = {
    cat: new URLSearchParams(location.search).get("cat") || "all",
    q: "",
    sort: "",
  };
  if (state.cat !== "all" && !catById[state.cat]) state.cat = "all";

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (s) => parseFloat(String(s || "").replace(/[^\d.]/g, "")) || 0;
  const discount = (p) => {
    const now = num(p.price), was = num(p.oldPrice);
    return was > now && now > 0 ? Math.round((1 - now / was) * 100) : 0;
  };
  const BADGE_CLASS = { "להיט": "hot", "רב מכר": "best", "חדש": "new", "מבצע": "sale" };

  const PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#e9e9eb"/></svg>');

  /* ---------- Site texts ---------- */
  document.title = `${SITE.name} | הדילים הכי שווים מאלי אקספרס`;
  $("#brandName").textContent = SITE.name;
  $("#footerName").textContent = SITE.name;
  $("#year").textContent = new Date().getFullYear();
  $("#tagline").textContent = SITE.tagline;
  $("#statCount").textContent = PRODUCTS.length;

  document.querySelectorAll(".brand").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      search.value = "";
      state.q = "";
      setCat("all");
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
  );

  /* ---------- Hero collage (3 products, sales first) ---------- */
  const heroPicks = [...PRODUCTS].filter((p) => imagesOf(p).length).sort((a, b) => discount(b) - discount(a)).slice(0, 3);
  $("#heroVisual").innerHTML = heroPicks
    .map(
      (p) => `<a class="hv-card" href="${esc(p.link)}" target="_blank" rel="nofollow sponsored noopener" tabindex="-1">
        <img src="${esc(imagesOf(p)[0])}" alt="">${p.price ? `<span class="tag">${esc(p.price)}</span>` : ""}</a>`
    )
    .join("");

  /* ---------- Categories ---------- */
  const count = (id) => PRODUCTS.filter((p) => inCat(p, id)).length;
  function renderCats() {
    const activeTop = parentOf(state.cat) || state.cat;
    const all = [{ id: "all", name: "הכל", icon: "✨", n: PRODUCTS.length }].concat(
      topCats.map((c) => ({ ...c, n: count(c.id) }))
    );
    cats.innerHTML = all
      .map(
        (c) => `<button type="button" class="cat${c.id === activeTop ? " active" : ""}" data-cat="${esc(c.id)}" aria-pressed="${c.id === activeTop}">
          <span class="ic" aria-hidden="true">${esc(c.icon || "🛍")}</span><span class="nm">${esc(c.name)}</span><span class="n">${c.n} מוצרים</span></button>`
      )
      .join("");
    // sub-category chips for the selected main category
    const subs = activeTop === "all" ? [] : subsOf(activeTop);
    const subBox = $("#subcats");
    subBox.hidden = !subs.length;
    subBox.innerHTML = subs.length
      ? [{ id: activeTop, name: `הכל ב${catName(activeTop)}`, n: count(activeTop) }]
          .concat(subs.map((c) => ({ ...c, n: count(c.id) })))
          .map(
            (c) => `<button type="button" class="subcat${c.id === state.cat ? " active" : ""}" data-cat="${esc(c.id)}" aria-pressed="${c.id === state.cat}">${esc(c.name)} <span class="n">${c.n}</span></button>`
          )
          .join("")
      : "";
  }
  [cats, $("#subcats")].forEach((el) =>
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (b) setCat(b.dataset.cat);
    })
  );
  function setCat(id) {
    state.cat = id;
    const url = new URL(location.href);
    id === "all" ? url.searchParams.delete("cat") : url.searchParams.set("cat", id);
    history.replaceState(null, "", url);
    renderCats();
    renderGrid();
  }

  /* ---------- Products ---------- */
  const norm = (s) => String(s || "").toLowerCase().replace(/["'׳״]/g, "").trim();

  function filtered() {
    const words = norm(state.q).split(/\s+/).filter(Boolean);
    const list = PRODUCTS.filter((p) => {
      if (state.cat !== "all" && !inCat(p, state.cat)) return false;
      if (!words.length) return true;
      const hay = norm(`${p.title} ${fullCatName(p.category)} ${p.badge || ""}`);
      return words.every((w) => hay.includes(w));
    });
    if (state.sort === "asc") list.sort((a, b) => num(a.price) - num(b.price));
    if (state.sort === "desc") list.sort((a, b) => num(b.price) - num(a.price));
    if (state.sort === "sale") list.sort((a, b) => discount(b) - discount(a));
    return list;
  }

  function cardHTML(p, i) {
    const off = discount(p);
    const badge = p.badge ? `<span class="badge ${BADGE_CLASS[p.badge] || "sale"}">${esc(p.badge)}</span>` : "<span></span>";
    const offTag = off ? `<span class="badge off">‎-${off}%</span>` : "";
    const imgs = imagesOf(p);
    const many = imgs.length > 1;
    return `
      <article class="card" style="animation-delay:${Math.min(i, 12) * 40}ms" data-id="${esc(p.id)}" data-i="0">
        <div class="card-media">
          <a class="media-link" href="${esc(p.link)}" target="_blank" rel="nofollow sponsored noopener" data-img="${esc(imgs[0] || "")}">
            <img src="${esc(imgs[0] || PLACEHOLDER)}" alt="${esc(p.title)}${many ? ` – תמונה 1 מתוך ${imgs.length}` : ""}" loading="lazy">
          </a>
          <div class="badges">${badge}${offTag}</div>
          ${many ? `
          <button type="button" class="media-nav prev" data-step="-1" aria-label="התמונה הקודמת">›</button>
          <button type="button" class="media-nav next" data-step="1" aria-label="התמונה הבאה">‹</button>
          <div class="dots" aria-hidden="true">${imgs.map((_, k) => `<span${k ? "" : ' class="on"'}></span>`).join("")}</div>` : ""}
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="card-tag">${esc(fullCatName(p.category))}</span>
            <button type="button" class="report-btn" data-report="${esc(p.id)}" title="המחיר השתנה? המוצר ירד מהאתר? ספרו לנו">⚑ דיווח</button>
          </div>
          <h3 class="card-title">${esc(p.title)}</h3>
          <div class="card-foot">
            <div class="prices">
              <span class="card-price">${esc(p.price || "")}</span>
              ${off ? `<span class="card-old">${esc(p.oldPrice)}</span>` : ""}
            </div>
            <a class="card-btn" href="${esc(p.link)}" target="_blank" rel="nofollow sponsored noopener">לרכישה ←</a>
          </div>
        </div>
      </article>`;
  }

  function renderGrid() {
    hidePreview();
    const list = filtered();
    grid.innerHTML = list.map(cardHTML).join("");
    grid.querySelectorAll("img").forEach((img) =>
      img.addEventListener("error", () => (img.src = PLACEHOLDER), { once: true })
    );
    empty.hidden = list.length > 0;
    gridTitle.textContent = state.q
      ? `תוצאות עבור "${state.q.trim()}"`
      : state.cat === "all" ? "כל המוצרים" : fullCatName(state.cat);
    resultCount.textContent = `${list.length} מוצרים`;
  }

  let t;
  search.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = search.value;
      renderGrid();
    }, 150);
  });
  // Enter בחיפוש – גוללים לתוצאות
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      state.q = search.value;
      renderGrid();
      $("#gridTitle").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
  sort.addEventListener("change", () => {
    state.sort = sort.value;
    renderGrid();
  });

  /* ---------- Product image gallery ---------- */
  function showImage(card, step) {
    const p = PRODUCTS.find((x) => x.id === card.dataset.id);
    const imgs = p ? imagesOf(p) : [];
    if (imgs.length < 2) return;
    const i = (Number(card.dataset.i) + step + imgs.length) % imgs.length;
    card.dataset.i = i;
    const link = card.querySelector(".media-link");
    const img = link.querySelector("img");
    img.src = imgs[i];
    img.alt = `${p.title} – תמונה ${i + 1} מתוך ${imgs.length}`;
    link.dataset.img = imgs[i];
    card.querySelectorAll(".dots span").forEach((d, k) => d.classList.toggle("on", k === i));
    if (current === link) previewImg.src = imgs[i];
  }
  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".media-nav");
    if (!b) return;
    e.preventDefault();
    showImage(b.closest(".card"), Number(b.dataset.step));
  });
  // swipe between images on touch screens
  let touchX = null;
  grid.addEventListener("touchstart", (e) => {
    touchX = e.target.closest(".card-media") ? e.touches[0].clientX : null;
  }, { passive: true });
  grid.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const card = e.target.closest(".card");
    touchX = null;
    if (card && Math.abs(dx) > 40) showImage(card, dx < 0 ? 1 : -1);
  });

  /* ---------- Big image on hover (desktop only) ---------- */
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");
  let current = null;

  function placePreview(anchor) {
    const card = anchor.closest(".card").getBoundingClientRect();
    const size = Math.min(400, window.innerWidth - 32, window.innerHeight - 32);
    const gap = 16;
    preview.style.width = preview.style.height = size + "px";
    let left;
    if (card.left - gap - size >= 8) left = card.left - gap - size;
    else if (card.right + gap + size <= window.innerWidth - 8) left = card.right + gap;
    else left = Math.max(8, (window.innerWidth - size) / 2);
    let top = card.top + card.height / 2 - size / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - size - 8));
    preview.style.left = left + "px";
    preview.style.top = top + "px";
  }
  function hidePreview() {
    current = null;
    preview.classList.remove("show");
  }

  grid.addEventListener("mouseover", (e) => {
    if (!canHover.matches) return;
    const a = e.target.closest("[data-img]");
    if (!a || a === current || !a.dataset.img) return;
    current = a;
    previewImg.src = a.dataset.img;
    placePreview(a);
    preview.classList.add("show");
  });
  grid.addEventListener("mouseout", (e) => {
    if (!current) return;
    if (e.relatedTarget && current.contains(e.relatedTarget)) return;
    hidePreview();
  });
  window.addEventListener("scroll", hidePreview, { passive: true });

  /* ---------- Forms (sent to SITE.email via FormSubmit) ---------- */
  function hookForm(form, subject, fields) {
    const msg = form.querySelector(".form-msg");
    const btn = form.querySelector("button");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.className = "form-msg";
      const data = Object.fromEntries(new FormData(form));
      if (form.elements.consent && !form.elements.consent.checked) {
        msg.textContent = "כדי להצטרף, סמנו שאתם מאשרים קבלת דיוור";
        msg.classList.add("err");
        return;
      }
      const missing = fields.find((f) => !String(data[f] || "").trim());
      if (missing || !/^\S+@\S+\.\S+$/.test(data.email)) {
        msg.textContent = "נא למלא אימייל תקין" + (fields.length > 1 ? " ותיאור של המוצר" : "");
        msg.classList.add("err");
        return;
      }
      if (!SITE.email) {
        msg.textContent = "הטופס עוד לא חובר למייל (יש להגדיר מייל בעמוד הניהול)";
        msg.classList.add("err");
        return;
      }
      btn.disabled = true;
      msg.textContent = "שולח…";
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(SITE.email)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...data, _subject: subject, _template: "table", _captcha: "false" }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) !== "true") throw new Error(json.message || res.status);
        form.reset();
        msg.textContent = "תודה! הפרטים התקבלו 🧡";
        msg.classList.add("ok");
      } catch (err) {
        msg.textContent = "משהו השתבש, נסו שוב בעוד רגע";
        msg.classList.add("err");
      } finally {
        btn.disabled = false;
      }
    });
  }
  hookForm($("#newsletterForm"), `הרשמה חדשה לרשימת התפוצה – ${SITE.name}`, ["email"]);
  hookForm($("#requestForm"), `בקשת מוצר חדשה – ${SITE.name}`, ["email", "request"]);

  /* ---------- Coupons ---------- */
  function renderCoupons() {
    const today = new Date().toISOString().slice(0, 10);
    const list = COUPON_LIST.filter((c) => c.code && (!c.expires || c.expires >= today));
    $("#coupons").hidden = !list.length;
    const fmt = (d) => d.split("-").reverse().join(".");
    $("#couponList").innerHTML = list
      .map(
        (c) => `
      <div class="coupon">
        <div class="coupon-info">
          <span class="coupon-title">${esc(c.title || "קופון הנחה")}</span>
          <span class="coupon-meta">
            ${c.expires ? `<span>בתוקף עד ${esc(fmt(c.expires))}</span>` : ""}
            ${c.link ? `<a href="${esc(c.link)}" target="_blank" rel="nofollow sponsored noopener">למבצע ←</a>` : ""}
          </span>
        </div>
        <div class="coupon-code">
          <code>${esc(c.code)}</code>
          <button type="button" class="copy-btn" data-code="${esc(c.code)}">העתקה</button>
        </div>
      </div>`
      )
      .join("");
  }
  $("#couponList").addEventListener("click", async (e) => {
    const b = e.target.closest(".copy-btn");
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.dataset.code);
    } catch {
      // fallback: select the code so the visitor can copy it
      const r = document.createRange();
      r.selectNodeContents(b.previousElementSibling);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    b.textContent = "הועתק ✓";
    b.classList.add("done");
    setTimeout(() => ((b.textContent = "העתקה"), b.classList.remove("done")), 1800);
  });

  /* ---------- Report a product ---------- */
  const dlg = $("#reportDlg");
  const reportForm = $("#reportForm");
  const reportMsg = reportForm.querySelector(".form-msg");
  let reporting = null;

  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-report]");
    if (!b) return;
    reporting = PRODUCTS.find((p) => p.id === b.dataset.report);
    if (!reporting) return;
    hidePreview();
    reportForm.reset();
    reportMsg.textContent = "";
    reportMsg.className = "form-msg";
    reportForm.querySelector("button[type=submit]").disabled = false;
    $("#reportProduct").textContent = reporting.title;
    dlg.showModal();
  });
  $("#reportCancel").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close(); // click on the dimmed background
  });

  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(reportForm));
    reportMsg.className = "form-msg";
    if (!data.reason) {
      reportMsg.textContent = "בחרו מה הבעיה";
      reportMsg.classList.add("err");
      return;
    }
    const btn = reportForm.querySelector("button[type=submit]");
    btn.disabled = true;
    reportMsg.textContent = "שולח…";
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, productId: reporting.id, productTitle: reporting.title }),
      });
      if (!res.ok) throw new Error(res.status);
      reportMsg.textContent = "תודה! נבדוק ונעדכן בהקדם 🧡";
      reportMsg.classList.add("ok");
      setTimeout(() => dlg.close(), 1600);
    } catch {
      reportMsg.textContent = "השליחה לא הצליחה, נסו שוב בעוד רגע";
      reportMsg.classList.add("err");
      btn.disabled = false;
    }
  });

  renderCoupons();
  renderCats();
  renderGrid();
})();
