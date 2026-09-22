const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

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

if (!prefersReducedMotion) {
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
