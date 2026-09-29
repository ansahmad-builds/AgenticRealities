// Compact header and accessible disclosure-navigation regression checks.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const axePath = require.resolve("../.sites-runtime/audit/node_modules/axe-core/axe.min.js");
const base = process.env.MAIN_UI_URL || "http://127.0.0.1:43120/";
const screenshots = process.env.SCREENSHOT_DIRECTORY;
const widths = [320,375,390,527,572,600,601,768,769,836,1024,1440];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    if (screenshots) fs.mkdirSync(screenshots, { recursive: true });
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ reducedMotion: "reduce" });
      await context.addInitScript(theme => localStorage.setItem("ar-theme-v1", theme), theme);
      const page = await context.newPage();
      const errors = [];
      const external = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("request", request => { if (!request.url().startsWith(base)) external.push(request.url()); });
      for (const [textScale, sizes] of [[100, widths.map(width => [width,668]).concat([[568,320],[320,320]])], [200, [[320,900],[572,900],[768,900],[836,900],[320,320]]]]) {
        for (const [width, height] of sizes) {
          await page.setViewportSize({ width, height });
          await page.goto(base, { waitUntil: "networkidle" });
          const reject = page.getByRole("button", { name: "Reject analytics", exact: true });
          if (await reject.isVisible()) await reject.click();
          if (textScale === 200) await page.addStyleTag({ content: "html { font-size: 200%; }" });
          const navigation = page.locator("#site-navigation");
          const toggle = page.locator("[data-menu-toggle]");
          if (width <= 768) {
            assert.equal(await toggle.isVisible(), true);
            assert.equal(await navigation.isVisible(), false, "Collapsed links are not visible or focusable");
            assert.equal(await toggle.getAttribute("aria-expanded"), "false");
            const closed = await inspectHeader(page);
            assert.ok(closed.alignment < 1, "Brand and both controls remain on the same row");
            assert.ok(closed.controlsSeparated, "Controls do not overlap the brand or each other");
            assert.equal(closed.documentOverflow, false);
            if (textScale === 100) assert.ok(closed.header.height < 90, "Compact one-row header");
            if (screenshots && textScale === 100 && [390,572].includes(width) && height === 668) {
              await page.screenshot({ path: path.join(screenshots, `${theme}-${width}-closed.png`) });
            }
            await toggle.click();
            assert.equal(await toggle.getAttribute("aria-expanded"), "true");
            assert.equal(await navigation.isVisible(), true);
            const open = await inspectHeader(page);
            assert.ok(Math.abs(open.header.height - closed.header.height) < 1, "Opening does not add a header row");
            const dropdown = await navigation.boundingBox();
            assert.ok(dropdown.y >= open.header.bottom + 4);
            assert.ok(dropdown.x >= open.header.left - 1 && dropdown.x + dropdown.width <= open.header.right + 1);
            assert.ok(dropdown.y + dropdown.height <= height + 1, "Dropdown fits the viewport, including landscape and enlarged text");
            if (screenshots && textScale === 100 && [390,572].includes(width) && height === 668) {
              await page.screenshot({ path: path.join(screenshots, `${theme}-${width}-open.png`) });
            }
            await page.keyboard.press("Escape");
            assert.equal(await navigation.isVisible(), false);
            assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
          } else {
            assert.equal(await toggle.isVisible(), false);
            assert.equal(await navigation.isVisible(), true, "Desktop navigation remains expanded");
          }
        }
      }
      await page.setViewportSize({ width: 572, height: 668 });
      await page.goto(base, { waitUntil: "networkidle" });
      const toggle = page.getByRole("button", { name: "Open navigation menu", exact: true });
      const navigation = page.locator("#site-navigation");
      await toggle.focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.getByRole("link", { name: "Vision", exact: true }).evaluate(el => el === document.activeElement), true);
      await page.keyboard.press("Tab");
      assert.equal(await page.getByRole("link", { name: "Principles", exact: true }).evaluate(el => el === document.activeElement), true);
      await page.keyboard.press("Tab");
      assert.equal(await page.getByRole("link", { name: "Projects", exact: true }).evaluate(el => el === document.activeElement), true);
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa","best-practice"] } })).violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
      assert.deepEqual(violations, [], "Expanded navigation accessibility");
      await page.getByRole("link", { name: "Vision", exact: true }).click();
      assert.equal(await navigation.isVisible(), false);
      assert.equal(new URL(page.url()).hash, "#vision");
      assert.equal(await page.locator("#vision").evaluate(el => el === document.activeElement), true);
      await toggle.click();
      await page.locator("#vision-title").click();
      assert.equal(await navigation.isVisible(), false, "Outside click closes the menu");
      await toggle.focus();
      await page.keyboard.press("Space");
      assert.equal(await navigation.isVisible(), true);
      await page.getByRole("button", { name: `Switch to ${theme === "light" ? "dark" : "light"} mode`, exact: true }).click();
      assert.equal(await navigation.isVisible(), true, "Theme control stays usable in the header");
      await page.keyboard.press("Escape");
      await toggle.click();
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForFunction(() => document.querySelector("[data-menu-toggle]").hidden && !document.getElementById("site-navigation").hidden);
      assert.equal(await toggle.isVisible(), false);
      assert.equal(await navigation.isVisible(), true);
      await page.setViewportSize({ width: 572, height: 668 });
      await navigation.waitFor({ state: "hidden" });
      assert.equal(await navigation.isVisible(), false, "Resize back to mobile resets the menu");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.deepEqual(errors, []);
      assert.deepEqual(external, [], "Navigation and theme controls do not start analytics");
      console.log(JSON.stringify({ theme, layouts: 19, alignedHeader: true, keyboard: true, selectionAndOutsideDismissal: true, resize: true, accessibilityViolations: 0, thirdPartyRequests: 0 }));
      await context.close();
    }
    const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await noJS.goto(base);
    assert.equal(await noJS.locator("[data-menu-toggle]").isVisible(), false);
    assert.equal(await noJS.getByRole("link", { name: "Vision", exact: true }).isVisible(), true, "Navigation remains available without JavaScript");
    await noJS.close();
    console.log(JSON.stringify({ noJavaScriptFallback: "passed" }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

async function inspectHeader(page) {
  return page.evaluate(() => {
    const rect = selector => {
      const { left, right, top, bottom, height } = document.querySelector(selector).getBoundingClientRect();
      return { left, right, top, bottom, height };
    };
    const brand = rect(".site-header .brand");
    const theme = rect(".site-header .theme-toggle");
    const menu = rect(".site-header .menu-toggle");
    return {
      header: rect(".site-header"),
      alignment: Math.max(Math.abs((brand.top + brand.bottom - theme.top - theme.bottom) / 2), Math.abs((theme.top + theme.bottom - menu.top - menu.bottom) / 2)),
      controlsSeparated: theme.left >= brand.right + 4 && menu.left >= theme.right + 4,
      documentOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
}
