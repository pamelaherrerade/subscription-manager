(() => {
  const KEY = "subease-portal-theme";

  function preferred() {
    const s = localStorage.getItem(KEY);
    if (s === "light" || s === "dark") return s;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      const next = theme === "dark" ? "light" : "dark";
      btn.setAttribute("aria-label", `Switch to ${next} mode`);
    }
  }

  function initTheme() {
    apply(preferred());
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "light";
      apply(cur === "dark" ? "light" : "dark");
    });
  }

  function highlightNav() {
    const current = new URL(location.href).pathname.replace(/\/+$/, "");
    document.querySelectorAll(".site-nav a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      const path = new URL(href, location.href).pathname.replace(/\/+$/, "");
      if (path === current) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initMobile() {
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  if (!document.documentElement.getAttribute("data-theme")) apply(preferred());
  initTheme();
  highlightNav();
  initMobile();
})();
