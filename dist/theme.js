// Apply the saved appearance before styles paint. Theme choice never enables analytics.
(() => {
  const storageKey = "ar-theme-v1";
  const root = document.documentElement;
  const isTheme = value => value === "light" || value === "dark";
  let savedTheme;
  try { savedTheme = localStorage.getItem(storageKey); } catch { /* Storage can be unavailable. */ }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "light" ? "#f6f8f7" : "#050507";
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      const label = `Switch to ${theme === "light" ? "dark" : "light"} mode`;
      button.setAttribute("aria-label", label);
      button.title = label;
    });
  }

  applyTheme(isTheme(savedTheme) ? savedTheme : "light");

  function initializeButtons() {
    applyTheme(root.dataset.theme);
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.hidden = false;
      button.addEventListener("click", () => {
        const theme = root.dataset.theme === "light" ? "dark" : "light";
        applyTheme(theme);
        try { localStorage.setItem(storageKey, theme); } catch { /* Choice still works for this page. */ }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeButtons, { once: true });
  } else {
    initializeButtons();
  }

  window.addEventListener("storage", event => {
    if (event.key === storageKey || event.key === null) {
      applyTheme(isTheme(event.newValue) ? event.newValue : "light");
    }
  });
})();
