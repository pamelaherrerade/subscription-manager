/**
 * unfee — Subscription Manager prototype
 * Modular state + render loop with seed data
 */

(() => {
  "use strict";

  /* ---------- Constants ---------- */
  const CATEGORIES = {
    streaming: { id: "streaming", label: "OTT / Streaming", color: "#e50914" },
    music: { id: "music", label: "Music", color: "#1db954" },
    productivity: { id: "productivity", label: "Work / Productivity", color: "#6c5ce7" },
    cloud: { id: "cloud", label: "Cloud / Storage", color: "#0984e3" },
    other: { id: "other", label: "Other", color: "#636e72" },
  };

  const CANCEL_GUIDES = {
    default: {
      steps: [
        "Open your account or subscription settings on the service website.",
        "Find Billing, Membership, or Subscription management.",
        "Select Cancel or Turn off auto-renew and confirm.",
        "Save any confirmation email for your records.",
      ],
      url: "https://www.google.com/search?q=how+to+cancel+subscription",
    },
    Netflix: {
      steps: [
        "Sign in at netflix.com on a browser (not only the TV app).",
        "Go to Account → Membership & Billing.",
        "Click Cancel Membership and confirm.",
        "You’ll keep access until the end of the paid period.",
      ],
      url: "https://www.netflix.com/cancelplan",
    },
    "Amazon Prime": {
      steps: [
        "Visit Amazon → Account → Memberships & Subscriptions.",
        "Select Prime Membership → Manage membership.",
        "Choose End membership and confirm the reason if prompted.",
        "Note: benefits end at the billing cycle close (or immediately if offered).",
      ],
      url: "https://www.amazon.com/gp/primecentral",
    },
    Spotify: {
      steps: [
        "Open spotify.com/account on the web (not only the mobile app).",
        "Under Your plan, click Change plan or Cancel Spotify.",
        "Confirm cancellation — Premium lasts until period end.",
        "If billed via Apple/Google, cancel in that store’s subscriptions too.",
      ],
      url: "https://www.spotify.com/account/subscription/",
    },
    Figma: {
      steps: [
        "Open Figma → Admin settings (or your account settings).",
        "Go to Billing → Subscription.",
        "Downgrade to Starter or cancel the paid seat.",
        "Confirm and download invoices if needed.",
      ],
      url: "https://www.figma.com/settings",
    },
    Notion: {
      steps: [
        "Open Settings & members → Plans.",
        "Select Downgrade or Cancel plan.",
        "Confirm — workspace reverts to Free limits after the period.",
        "Export important pages before limits apply.",
      ],
      url: "https://www.notion.so/settings",
    },
    "iCloud+": {
      steps: [
        "On iPhone: Settings → [Your Name] → Subscriptions (or iCloud).",
        "Select iCloud+ → Cancel Subscription.",
        "Confirm; storage downgrades after the billing period.",
        "Back up files that exceed free storage before then.",
      ],
      url: "https://support.apple.com/en-us/HT202039",
    },
    "YouTube Premium": {
      steps: [
        "Open youtube.com → your avatar → Purchases and memberships.",
        "Select YouTube Premium → Manage membership.",
        "Cancel membership and confirm.",
        "If on a family plan, leave or ask the manager to cancel.",
      ],
      url: "https://www.youtube.com/paid_memberships",
    },
    "Adobe CC": {
      steps: [
        "Sign in at account.adobe.com → Plans.",
        "Select Manage plan → Cancel plan.",
        "Complete Adobe’s retention flow (you can still cancel).",
        "Download/export assets before Creative Cloud access ends.",
      ],
      url: "https://account.adobe.com/plans",
    },
  };

  const BRAND_COLORS = {
    Netflix: "#e50914",
    "Amazon Prime": "#00a8e1",
    Spotify: "#1db954",
    Figma: "#a259ff",
    Notion: "#1a1a1a",
    "iCloud+": "#3d7eff",
    "YouTube Premium": "#ff0000",
    "Adobe CC": "#da1f26",
    "Apple Music": "#fc3c44",
    Dropbox: "#0061ff",
  };

  /* ---------- Seed data ---------- */
  const SEED = [
    {
      id: "sub-1",
      name: "Netflix",
      category: "streaming",
      price: 15.49,
      frequency: "monthly",
      nextDue: daysFromNow(4),
      status: "active",
      startedMonthsAgo: 14,
    },
    {
      id: "sub-2",
      name: "Amazon Prime",
      category: "streaming",
      price: 14.99,
      frequency: "monthly",
      nextDue: daysFromNow(11),
      status: "active",
      startedMonthsAgo: 24,
    },
    {
      id: "sub-3",
      name: "Spotify",
      category: "music",
      price: 11.99,
      frequency: "monthly",
      nextDue: daysFromNow(2),
      status: "active",
      startedMonthsAgo: 18,
    },
    {
      id: "sub-4",
      name: "Figma",
      category: "productivity",
      price: 15.0,
      frequency: "monthly",
      nextDue: daysFromNow(19),
      status: "active",
      startedMonthsAgo: 8,
    },
    {
      id: "sub-5",
      name: "Notion",
      category: "productivity",
      price: 10.0,
      frequency: "monthly",
      nextDue: daysFromNow(7),
      status: "active",
      startedMonthsAgo: 11,
    },
    {
      id: "sub-6",
      name: "iCloud+",
      category: "cloud",
      price: 2.99,
      frequency: "monthly",
      nextDue: daysFromNow(15),
      status: "active",
      startedMonthsAgo: 20,
    },
    {
      id: "sub-7",
      name: "YouTube Premium",
      category: "streaming",
      price: 13.99,
      frequency: "monthly",
      nextDue: daysFromNow(9),
      status: "active",
      startedMonthsAgo: 6,
    },
    {
      id: "sub-8",
      name: "Adobe CC",
      category: "productivity",
      price: 54.99,
      frequency: "monthly",
      nextDue: daysFromNow(22),
      status: "active",
      startedMonthsAgo: 10,
    },
  ];

  /* ---------- State ---------- */
  const state = {
    subscriptions: structuredClone(SEED),
    filter: "all",
    costMode: "monthly", // "monthly" | "year2"
    activeView: "home",
    selectedId: null,
    cancelledSavingsMonthly: 0,
  };

  /* ---------- DOM refs ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const els = {
    monthlyTotal: $("#monthly-total"),
    activeCount: $("#active-count"),
    year1: $("#year1-total"),
    year2: $("#year2-total"),
    categoryList: $("#category-list"),
    subList: $("#subscription-list"),
    linkedCharges: $("#linked-charges"),
    analyticsBars: $("#analytics-bars"),
    leakCopy: $("#leak-copy"),
    leakFigure: $("#leak-figure"),
    profileActive: $("#profile-active"),
    profileCancelled: $("#profile-cancelled"),
    profileSaved: $("#profile-saved"),
    detailModal: $("#detail-modal"),
    addModal: $("#add-modal"),
    toast: $("#toast"),
    addForm: $("#add-form"),
  };

  /* ---------- Helpers ---------- */
  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function formatMoney(n) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: n % 1 === 0 && n >= 100 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n);
  }

  function formatDate(iso) {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function brandColor(sub) {
    return BRAND_COLORS[sub.name] || CATEGORIES[sub.category]?.color || "#636e72";
  }

  /** Normalize any billing frequency to a monthly equivalent */
  function monthlyPrice(sub) {
    switch (sub.frequency) {
      case "weekly":
        return sub.price * (52 / 12);
      case "yearly":
        return sub.price / 12;
      default:
        return sub.price;
    }
  }

  function year2Price(sub) {
    return monthlyPrice(sub) * 24;
  }

  function activeSubs() {
    return state.subscriptions.filter((s) => s.status === "active");
  }

  function cancelledSubs() {
    return state.subscriptions.filter((s) => s.status === "cancelled");
  }

  function totals() {
    const active = activeSubs();
    const monthly = active.reduce((sum, s) => sum + monthlyPrice(s), 0);
    return {
      monthly,
      count: active.length,
      year1: monthly * 12,
      year2: monthly * 24,
    };
  }

  function getGuide(name) {
    return CANCEL_GUIDES[name] || {
      ...CANCEL_GUIDES.default,
      url: `https://www.google.com/search?q=how+to+cancel+${encodeURIComponent(name)}`,
    };
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      els.toast.hidden = true;
    }, 2600);
  }

  /* ---------- Render ---------- */
  function render() {
    renderSummary();
    renderCategories();
    renderSubscriptionList();
    renderWallet();
    renderAnalytics();
    renderProfile();
  }

  function renderSummary() {
    const t = totals();
    els.monthlyTotal.textContent = formatMoney(t.monthly);
    els.activeCount.textContent = String(t.count);
    els.year1.textContent = formatMoney(t.year1);
    els.year2.textContent = formatMoney(t.year2);
  }

  function renderCategories() {
    const counts = {};
    const chips = {};
    Object.keys(CATEGORIES).forEach((k) => {
      counts[k] = 0;
      chips[k] = [];
    });

    activeSubs().forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
      if (chips[s.category].length < 3) {
        chips[s.category].push({
          letter: initials(s.name)[0],
          color: brandColor(s),
        });
      }
    });

    const pills = [
      {
        id: "all",
        label: "All",
        count: activeSubs().length,
        chips: activeSubs()
          .slice(0, 3)
          .map((s) => ({ letter: initials(s.name)[0], color: brandColor(s) })),
      },
      ...Object.values(CATEGORIES).map((c) => ({
        id: c.id,
        label: c.label,
        count: counts[c.id],
        chips: chips[c.id],
      })),
    ].filter((p) => p.id === "all" || p.count > 0);

    els.categoryList.innerHTML = pills
      .map(
        (p) => `
      <button type="button" class="cat-pill ${state.filter === p.id ? "cat-pill--active" : ""}"
        data-filter="${p.id}" role="tab" aria-selected="${state.filter === p.id}">
        <span class="cat-pill__name">${escapeHtml(p.label)}</span>
        <span class="cat-pill__meta">
          <span class="cat-pill__count">${p.count} app${p.count === 1 ? "" : "s"}</span>
          <span class="cat-pill__chips">
            ${p.chips
              .map(
                (c) =>
                  `<span class="chip-dot" style="background:${c.color}" aria-hidden="true">${c.letter}</span>`
              )
              .join("")}
          </span>
        </span>
      </button>`
      )
      .join("");
  }

  function renderSubscriptionList() {
    let list = activeSubs();
    if (state.filter !== "all") {
      list = list.filter((s) => s.category === state.filter);
    }
    // Upcoming renewals first
    list = [...list].sort((a, b) => a.nextDue.localeCompare(b.nextDue));

    if (!list.length) {
      els.subList.innerHTML = `<li class="empty-state">No subscriptions in this category.</li>`;
      return;
    }

    els.subList.innerHTML = list
      .map((s, i) => {
        const showYear2 = state.costMode === "year2";
        const price = showYear2 ? year2Price(s) : monthlyPrice(s);
        const note = showYear2
          ? `<span class="sub-item__price-note">over 2 years</span>`
          : "";
        return `
        <li style="animation-delay:${i * 40}ms">
          <button type="button" class="sub-item" data-id="${s.id}">
            <span class="sub-icon" style="background:${brandColor(s)}" aria-hidden="true">${initials(s.name)}</span>
            <span class="sub-item__body">
              <span class="sub-item__name">${escapeHtml(s.name)}</span>
              <span class="sub-item__due">Renews ${formatDate(s.nextDue)}</span>
            </span>
            <span>
              <span class="sub-item__price">${formatMoney(price)}</span>
              ${note}
            </span>
          </button>
        </li>`;
      })
      .join("");
  }

  function renderWallet() {
    const upcoming = [...activeSubs()]
      .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
      .slice(0, 5);

    els.linkedCharges.innerHTML = upcoming
      .map(
        (s) => `
      <li class="linked-row">
        <span><strong>${escapeHtml(s.name)}</strong> · ${formatDate(s.nextDue)}</span>
        <span>${formatMoney(monthlyPrice(s))}</span>
      </li>`
      )
      .join("");
  }

  function renderAnalytics() {
    const byCat = {};
    activeSubs().forEach((s) => {
      byCat[s.category] = (byCat[s.category] || 0) + monthlyPrice(s);
    });

    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] || 1;

    els.analyticsBars.innerHTML = entries
      .map(
        ([id, amt]) => `
      <div class="bar-row">
        <span class="bar-row__label">${escapeHtml(CATEGORIES[id]?.label || id)}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(amt / max) * 100}%;background:${CATEGORIES[id]?.color || "var(--accent)"}"></div>
        </div>
        <span class="bar-row__value">${formatMoney(amt)}</span>
      </div>`
      )
      .join("") || `<p class="leak-copy">No active subscriptions.</p>`;

    // Spotlight smallest “leak” fees (under $15) projected over 2 years
    const leaks = activeSubs()
      .filter((s) => monthlyPrice(s) <= 15)
      .sort((a, b) => monthlyPrice(a) - monthlyPrice(b));

    if (leaks.length) {
      const totalLeak2y = leaks.reduce((sum, s) => sum + year2Price(s), 0);
      const names = leaks
        .slice(0, 3)
        .map((s) => s.name)
        .join(", ");
      els.leakCopy.textContent = `“Small” fees like ${names}${leaks.length > 3 ? "…" : ""} feel harmless monthly — together they drain:`;
      els.leakFigure.textContent = `${formatMoney(totalLeak2y)} over 2 years`;
    } else {
      els.leakCopy.textContent = "No low-cost recurring fees right now. Nice work.";
      els.leakFigure.textContent = formatMoney(0);
    }
  }

  function renderProfile() {
    const cancelled = cancelledSubs();
    const savedMonthly =
      state.cancelledSavingsMonthly ||
      cancelled.reduce((sum, s) => sum + monthlyPrice(s), 0);

    els.profileActive.textContent = String(activeSubs().length);
    els.profileCancelled.textContent = String(cancelled.length);
    els.profileSaved.textContent = formatMoney(savedMonthly * 12);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- Detail modal ---------- */
  function openDetail(id) {
    const sub = state.subscriptions.find((s) => s.id === id);
    if (!sub) return;

    state.selectedId = id;
    const guide = getGuide(sub.name);
    const monthly = monthlyPrice(sub);
    const spent12 = monthly * Math.min(12, sub.startedMonthsAgo || 12);

    $("#modal-title").textContent = sub.name;
    $("#modal-category").textContent = CATEGORIES[sub.category]?.label || "";
    const icon = $("#modal-icon");
    icon.textContent = initials(sub.name);
    icon.style.background = brandColor(sub);
    $("#modal-price").textContent = formatMoney(monthly);
    $("#modal-renewal").textContent = formatDate(sub.nextDue);
    $("#modal-spent").textContent = formatMoney(spent12);

    $("#cancel-steps").innerHTML = guide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
    const link = $("#cancel-link");
    link.href = guide.url;

    const markBtn = $("#btn-mark-cancelled");
    if (sub.status === "cancelled") {
      markBtn.textContent = "Already cancelled";
      markBtn.disabled = true;
    } else {
      markBtn.textContent = "Mark as Cancelled";
      markBtn.disabled = false;
    }

    els.detailModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeDetail() {
    els.detailModal.hidden = true;
    state.selectedId = null;
    if (els.addModal.hidden) document.body.style.overflow = "";
  }

  function markCancelled() {
    const sub = state.subscriptions.find((s) => s.id === state.selectedId);
    if (!sub || sub.status === "cancelled") return;

    sub.status = "cancelled";
    state.cancelledSavingsMonthly += monthlyPrice(sub);
    closeDetail();
    render();
    showToast(`${sub.name} marked cancelled — totals updated`);
  }

  /* ---------- Add modal ---------- */
  function openAdd() {
    els.addForm.reset();
    const due = els.addForm.elements.nextDue;
    due.value = daysFromNow(30);
    due.min = daysFromNow(0);
    els.addModal.hidden = false;
    document.body.style.overflow = "hidden";
    els.addForm.elements.name.focus();
  }

  function closeAdd() {
    els.addModal.hidden = true;
    if (els.detailModal.hidden) document.body.style.overflow = "";
  }

  function handleAdd(e) {
    e.preventDefault();
    const fd = new FormData(els.addForm);
    const name = String(fd.get("name") || "").trim();
    const price = parseFloat(fd.get("price"));
    const category = String(fd.get("category"));
    const frequency = String(fd.get("frequency"));
    const nextDue = String(fd.get("nextDue"));

    if (!name || !(price > 0) || !nextDue) {
      showToast("Please fill in all fields");
      return;
    }

    const sub = {
      id: `sub-${crypto.randomUUID?.() || Date.now()}`,
      name,
      category,
      price,
      frequency,
      nextDue,
      status: "active",
      startedMonthsAgo: 0,
    };

    state.subscriptions.unshift(sub);
    closeAdd();
    state.filter = "all";
    state.activeView = "home";
    switchView("home");
    render();
    showToast(`${name} added`);
  }

  /* ---------- Navigation ---------- */
  function switchView(view) {
    state.activeView = view;
    $$(".view").forEach((el) => {
      const match = el.dataset.view === view;
      el.hidden = !match;
      el.classList.toggle("view--active", match);
    });
    $$(".nav-item").forEach((btn) => {
      const active = btn.dataset.nav === view;
      btn.classList.toggle("nav-item--active", active);
      if (active) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    // Bottom nav
    $$(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.nav));
    });

    // Categories (delegated)
    els.categoryList.addEventListener("click", (e) => {
      const pill = e.target.closest("[data-filter]");
      if (!pill) return;
      state.filter = pill.dataset.filter;
      renderCategories();
      renderSubscriptionList();
    });

    // Cost mode toggle
    $$(".cost-toggle__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.costMode = btn.dataset.mode;
        $$(".cost-toggle__btn").forEach((b) =>
          b.classList.toggle("cost-toggle__btn--active", b === btn)
        );
        renderSubscriptionList();
      });
    });

    // Subscription list
    els.subList.addEventListener("click", (e) => {
      const item = e.target.closest("[data-id]");
      if (item) openDetail(item.dataset.id);
    });

    // Detail modal
    $("#modal-close").addEventListener("click", closeDetail);
    els.detailModal.addEventListener("click", (e) => {
      if (e.target === els.detailModal) closeDetail();
    });
    $("#btn-mark-cancelled").addEventListener("click", markCancelled);

    // Add
    $("#btn-add-fab").addEventListener("click", openAdd);
    $("#btn-add-header").addEventListener("click", openAdd);
    $("#add-close").addEventListener("click", closeAdd);
    els.addModal.addEventListener("click", (e) => {
      if (e.target === els.addModal) closeAdd();
    });
    els.addForm.addEventListener("submit", handleAdd);

    // Escape
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!els.detailModal.hidden) closeDetail();
      else if (!els.addModal.hidden) closeAdd();
    });
  }

  /* ---------- Init ---------- */
  bindEvents();
  render();
})();
