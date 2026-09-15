/**
 * The Living Project Portal — SubVault
 * Mobile nav, active page highlighting, PDF modal viewer
 */
(() => {
  const doc = document;

  /* ---------- Active page highlighting ---------- */
  function highlightActiveNav() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const file = path.split("/").pop() || "index.html";
    const links = doc.querySelectorAll(".site-nav a[href]");

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;

      const linkFile = href.split("/").pop();
      const isMatch =
        linkFile === file ||
        (file === "" && linkFile === "index.html") ||
        (path.endsWith("/sprint1") && href.includes("sprint1/index.html")) ||
        (path.includes("/sprint1/") && href.includes(linkFile) && linkFile !== "index.html");

      if (isMatch) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");

        const dropdown = link.closest(".nav-dropdown");
        if (dropdown) dropdown.classList.add("is-active");
      }
    });

    // Mark Sprint 1 parent when on any sprint1 page
    if (path.includes("/sprint1") || file.startsWith("market-") || file.startsWith("business-") || file.startsWith("project-")) {
      const sprintDropdown = doc.querySelector(".nav-dropdown[data-nav='sprint1']");
      if (sprintDropdown) sprintDropdown.classList.add("is-active");
    }
  }

  /* ---------- Mobile nav toggle ---------- */
  function initMobileNav() {
    const toggle = doc.getElementById("nav-toggle");
    const nav = doc.getElementById("site-nav");
    if (!toggle || !nav) return;

    const closeNav = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      doc.querySelectorAll(".nav-dropdown.is-open").forEach((el) => {
        el.classList.remove("is-open");
        const btn = el.querySelector(".nav-dropdown__trigger");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    };

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeNav();
    });
  }

  /* ---------- Dropdown (mobile click / desktop hover via CSS) ---------- */
  function initDropdowns() {
    const dropdowns = doc.querySelectorAll(".nav-dropdown");

    dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector(".nav-dropdown__trigger");
      const menu = dropdown.querySelector(".nav-dropdown__menu");
      if (!trigger || !menu) return;

      // Flag menus so desktop hover CSS can skip when we rely on touch/click
      const mq = window.matchMedia("(hover: none), (max-width: 768px)");
      const syncTouchClass = () => {
        menu.classList.toggle("nav-dropdown--touch", mq.matches);
      };
      syncTouchClass();
      mq.addEventListener("change", syncTouchClass);

      trigger.addEventListener("click", (e) => {
        // On desktop with hover, still allow click for a11y / keyboard
        e.preventDefault();
        const willOpen = !dropdown.classList.contains("is-open");

        dropdowns.forEach((other) => {
          if (other !== dropdown) {
            other.classList.remove("is-open");
            const otherBtn = other.querySelector(".nav-dropdown__trigger");
            if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
          }
        });

        dropdown.classList.toggle("is-open", willOpen);
        trigger.setAttribute("aria-expanded", String(willOpen));
      });
    });

    doc.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-dropdown")) {
        dropdowns.forEach((dropdown) => {
          dropdown.classList.remove("is-open");
          const btn = dropdown.querySelector(".nav-dropdown__trigger");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
      }
    });
  }

  /* ---------- PDF modal viewer ---------- */
  function initPdfModal() {
    const modal = doc.getElementById("pdf-modal");
    if (!modal) return;

    const iframe = modal.querySelector("[data-pdf-frame]");
    const titleEl = modal.querySelector("[data-pdf-title]");
    const downloadBtn = modal.querySelector("[data-pdf-download]");
    const openTabBtn = modal.querySelector("[data-pdf-newtab]");
    const closeEls = modal.querySelectorAll("[data-pdf-close]");
    let lastFocus = null;
    let currentSrc = "";

    const openModal = (src, title) => {
      lastFocus = doc.activeElement;
      currentSrc = src;
      if (titleEl) titleEl.textContent = title || "Document preview";
      if (iframe) {
        iframe.src = src;
        iframe.title = title || "PDF preview";
      }
      if (downloadBtn) {
        downloadBtn.href = src;
        downloadBtn.setAttribute("download", "");
      }
      if (openTabBtn) openTabBtn.href = src;

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      doc.body.classList.add("modal-open");

      const closeBtn = modal.querySelector(".modal__close");
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      doc.body.classList.remove("modal-open");
      if (iframe) iframe.src = "";
      currentSrc = "";
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    };

    doc.querySelectorAll("[data-pdf-src]").forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const src = trigger.getAttribute("data-pdf-src");
        const title = trigger.getAttribute("data-pdf-title") || trigger.textContent.trim();
        if (!src) return;

        // Fallback: if modal missing or user prefers new tab via modifier
        if (e.metaKey || e.ctrlKey) {
          window.open(src, "_blank", "noopener,noreferrer");
          return;
        }
        openModal(src, title);
      });
    });

    closeEls.forEach((el) => el.addEventListener("click", closeModal));

    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Expose for debugging / external triggers
    window.SubVaultPortal = Object.assign(window.SubVaultPortal || {}, {
      openPdf: openModal,
      closePdf: closeModal,
      getCurrentPdf: () => currentSrc,
    });
  }

  /* ---------- Strategy accordion (optional progressive disclosure) ---------- */
  function initStrategySteps() {
    const steps = doc.querySelectorAll("[data-strategy-step]");
    if (!steps.length) return;

    steps.forEach((step) => {
      const header = step.querySelector("[data-strategy-toggle]");
      if (!header) return;

      header.addEventListener("click", () => {
        const expanded = step.classList.toggle("is-expanded");
        header.setAttribute("aria-expanded", String(expanded));
      });
    });
  }

  /* ---------- Boot ---------- */
  highlightActiveNav();
  initMobileNav();
  initDropdowns();
  initPdfModal();
  initStrategySteps();
})();
