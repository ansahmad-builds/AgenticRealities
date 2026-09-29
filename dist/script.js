const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

const siteHeader = document.querySelector(".site-header");
const siteNavigation = document.getElementById("site-navigation");
const menuToggle = document.querySelector("[data-menu-toggle]");
const compactNavigation = window.matchMedia("(max-width: 768px)");
let navigationOpen = false;

function setNavigationOpen(open, { focusToggle = false } = {}) {
  navigationOpen = compactNavigation.matches && open;
  menuToggle.hidden = !compactNavigation.matches;
  menuToggle.setAttribute("aria-expanded", String(navigationOpen));
  const label = navigationOpen ? "Close navigation menu" : "Open navigation menu";
  menuToggle.setAttribute("aria-label", label);
  menuToggle.title = label;
  siteNavigation.hidden = compactNavigation.matches && !navigationOpen;
  if (focusToggle && compactNavigation.matches) menuToggle.focus();
}

if (siteHeader && siteNavigation && menuToggle) {
  siteHeader.classList.add("navigation-ready");
  setNavigationOpen(false);
  menuToggle.addEventListener("click", () => {
    setNavigationOpen(!navigationOpen);
    if (navigationOpen) siteNavigation.querySelector("a")?.focus();
  });
  siteNavigation.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link || !navigationOpen) return;
    setNavigationOpen(false);
    const destination = document.getElementById(link.hash.slice(1));
    if (destination) {
      destination.setAttribute("tabindex", "-1");
      destination.focus({ preventScroll: true });
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && navigationOpen) {
      event.preventDefault();
      setNavigationOpen(false, { focusToggle: true });
    }
  });
  document.addEventListener("pointerdown", event => {
    if (navigationOpen && !siteHeader.contains(event.target)) setNavigationOpen(false);
  });
  document.addEventListener("focusin", event => {
    if (navigationOpen && !siteHeader.contains(event.target)) setNavigationOpen(false);
  });
  compactNavigation.addEventListener("change", () => {
    const toggleWasFocused = document.activeElement === menuToggle;
    setNavigationOpen(false);
    if (toggleWasFocused && !compactNavigation.matches) siteNavigation.querySelector("a")?.focus();
  });
}

const revealItems = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

if (!prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  window.addEventListener(
    "pointermove",
    (event) => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    },
    { passive: true }
  );

  const tiltTarget = document.querySelector("[data-tilt]");
  const tiltContainer = tiltTarget?.parentElement;

  tiltContainer?.addEventListener("pointermove", (event) => {
    const bounds = tiltContainer.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    tiltTarget.style.transform = `rotateX(${-y * 7}deg) rotateY(${x * 8}deg)`;
  });

  tiltContainer?.addEventListener("pointerleave", () => {
    tiltTarget.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
}
