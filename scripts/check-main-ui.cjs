// Focused regression checks for the main site's brand, footer, and closing orb.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const siteUrl = process.env.MAIN_UI_URL || "http://127.0.0.1:43120/";
const screenshotDirectory = process.env.SCREENSHOT_DIRECTORY;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  });
  try {
    if (screenshotDirectory) fs.mkdirSync(screenshotDirectory, { recursive: true });
    for (const textScale of [100, 200]) {
      for (const width of [320, 375, 390, 527, 570, 600, 601, 768, 836, 1024, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 668 }, reducedMotion: "reduce" });
        try {
          const failures = [];
          page.on("pageerror", error => failures.push(error.message));
          await page.goto(siteUrl, { waitUntil: "networkidle" });
          const rejectButton = page.getByRole("button", { name: "Reject analytics", exact: true });
          if (await rejectButton.isVisible()) await rejectButton.click();
          if (textScale === 200) await page.addStyleTag({ content: "html { font-size: 200%; }" });
          const result = await page.evaluate(() => {
            const rect = selector => {
              const { left, right, top, bottom, width, height } = document.querySelector(selector).getBoundingClientRect();
              return { left, right, top, bottom, width, height };
            };
            const brand = rect(".footer-brand");
            const copyright = rect(".footer-copyright");
            const closing = rect(".closing");
            const orb = rect(".closing-orb");
            const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const logos = [...document.querySelectorAll(".brand-mark")].map(img => ({
              src: img.src, loaded: img.complete && img.naturalWidth > 0, alt: img.alt,
            }));
            return {
              brand, copyright, rootFontSize,
              footerRowAlignment: Math.abs((brand.top + brand.bottom) / 2 - (copyright.top + copyright.bottom) / 2),
              rightInset: closing.right - orb.right,
              bottomInset: closing.bottom - orb.bottom,
              logos, favicon: document.querySelector("link[rel='icon']").href,
              horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
              footerOverflow: [...document.querySelectorAll("footer a, footer p, footer button")].filter(el => {
                const box = el.getBoundingClientRect();
                return box.width && (box.left < 0 || box.right > innerWidth || el.scrollWidth > el.clientWidth + 2);
              }).map(el => el.textContent.trim()),
            };
          });
          assert.equal(result.horizontalOverflow, false, "No horizontal document overflow");
          assert.deepEqual(result.footerOverflow, [], "Footer content fits");
          assert.ok(result.copyright.left > result.brand.left, "Copyright sits to the right of the brand");
          assert.ok(result.footerRowAlignment < 2, "Brand and copyright share a vertically aligned row");
          assert.ok(result.rightInset >= result.rootFontSize * 1.5 - 1, "Closing orb has at least 1.5rem right inset");
          if (width <= 900) assert.ok(result.bottomInset >= result.rootFontSize * 2 - 1, "Closing orb has 2rem bottom inset");
          assert.equal(result.logos.length, 2, "Header and footer both show the shared logo");
          for (const logo of result.logos) {
            assert.equal(logo.src, result.favicon, "Brand marks use the favicon asset");
            assert.equal(logo.loaded, true, "Logo image loaded");
            assert.equal(logo.alt, "", "Brand text supplies the accessible name");
          }
          assert.deepEqual(failures, [], "No runtime errors");
          if (screenshotDirectory && textScale === 100 && [320, 390, 570, 836, 1440].includes(width)) {
            await page.screenshot({ path: path.join(screenshotDirectory, `header-${width}.png`) });
            await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, document.documentElement.scrollHeight); });
            await page.screenshot({ path: path.join(screenshotDirectory, `footer-${width}.png`) });
          }
          console.log(JSON.stringify({ width, textScale, footerRowAlignment: result.footerRowAlignment, orbRightInset: result.rightInset, passed: true }));
        } finally {
          await page.close();
        }
      }
    }
    const privacy = await browser.newPage({ viewport: { width: 320, height: 668 }, reducedMotion: "reduce" });
    try {
      await privacy.goto(new URL("privacy/", siteUrl).href, { waitUntil: "networkidle" });
      const sharedLogo = await privacy.locator(".brand-mark").evaluate(img => ({
        src: img.src, loaded: img.complete && img.naturalWidth > 0,
        favicon: document.querySelector("link[rel='icon']").href,
      }));
      assert.equal(sharedLogo.loaded, true);
      assert.equal(sharedLogo.src, sharedLogo.favicon);
      assert.equal(sharedLogo.src, new URL("favicon.svg", siteUrl).href);
      for (const textScale of [100, 200]) {
        if (textScale === 200) await privacy.addStyleTag({ content: "html { font-size: 200%; }" });
        assert.equal(await privacy.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Privacy branding fits at enlarged text sizes");
      }
      console.log(JSON.stringify({ privacySharedLogo: true, privacyTextScale: [100, 200], passed: true }));
    } finally {
      await privacy.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
