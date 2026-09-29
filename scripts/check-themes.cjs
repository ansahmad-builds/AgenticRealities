// Responsive, accessibility, and privacy checks for the main site's appearance switch.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const axePath = require.resolve("../.sites-runtime/audit/node_modules/axe-core/axe.min.js");
const base = process.env.MAIN_UI_URL || "http://127.0.0.1:43120/";
const screenshotDirectory = process.env.SCREENSHOT_DIRECTORY;
const storageKey = "ar-theme-v1";
const sizes = [[320,698],[375,812],[390,844],[527,698],[570,668],[600,698],[601,698],[568,320],[836,698],[945,884],[1024,768],[1061,884],[1440,900]];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    if (screenshotDirectory) fs.mkdirSync(screenshotDirectory, { recursive: true });
    for (const pagePath of ["", "privacy/"]) {
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({ reducedMotion: "reduce", colorScheme: "dark" });
        await context.addInitScript(({ key, theme }) => localStorage.setItem(key, theme), { key: storageKey, theme });
        const page = await context.newPage();
        const externalRequests = [];
        const errors = [];
        page.on("request", request => { if (!request.url().startsWith(base)) externalRequests.push(request.url()); });
        page.on("pageerror", error => errors.push(error.message));
        try {
          for (const [width, height] of sizes) {
            await page.setViewportSize({ width, height });
            await page.goto(new URL(pagePath, base).href, { waitUntil: "networkidle" });
            assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
            assert.equal(await page.locator("html").evaluate(el => getComputedStyle(el).colorScheme), theme);
            const toggle = page.getByRole("button", { name: `Switch to ${theme === "light" ? "dark" : "light"} mode`, exact: true });
            assert.equal(await toggle.isVisible(), true);
            const toggleBox = await toggle.boundingBox();
            assert.ok(toggleBox.width >= 44 && toggleBox.height >= 44, "44px touch target");
            await inspectLayout(page);
            if (!pagePath) {
              await inspectPageEnding(page);
              await inspectMainCopy(page);
            }
            const reject = page.getByRole("button", { name: "Reject analytics", exact: true });
            if (await reject.isVisible()) await reject.click();
            if (screenshotDirectory && [390,570,945,1061,1440].includes(width) && height !== 320) {
              await page.screenshot({ path: path.join(screenshotDirectory, `${pagePath ? "privacy" : "main"}-${theme}-${width}.png`) });
            }
            if (screenshotDirectory && !pagePath && [390,945,1440].includes(width)) {
              await page.locator("#vision").scrollIntoViewIfNeeded();
              await page.screenshot({ path: path.join(screenshotDirectory, `vision-${theme}-${width}.png`) });
              await page.locator("#principles").scrollIntoViewIfNeeded();
              await page.screenshot({ path: path.join(screenshotDirectory, `principles-${theme}-${width}.png`) });
            }
            await page.evaluate(() => { document.activeElement.blur(); scrollTo(0, document.documentElement.scrollHeight); });
            const afterScroll = await toggle.boundingBox();
            assert.ok(afterScroll.y >= 0 && afterScroll.y + afterScroll.height <= height, "Theme control stays on screen while scrolling");
            if (screenshotDirectory && !pagePath && [390,570,1061].includes(width)) {
              await page.screenshot({ path: path.join(screenshotDirectory, `footer-${theme}-${width}.png`) });
            }
          }
          for (const width of [320,570,836,1440]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(new URL(pagePath, base).href, { waitUntil: "networkidle" });
            await page.addStyleTag({ content: "html { font-size: 200%; }" });
            await inspectLayout(page);
          }
          await page.setViewportSize({ width: 390, height: 844 });
          await page.goto(new URL(pagePath, base).href, { waitUntil: "networkidle" });
          await page.addScriptTag({ path: axePath });
          await inspectAccessibility(page, `${pagePath || "main"} ${theme}`);
          const reject = page.getByRole("button", { name: "Reject analytics", exact: true });
          if (await reject.isVisible()) await reject.click();
          await page.locator("[data-analytics-settings]").last().click();
          assert.equal(await page.locator("#analytics-dialog").evaluate(el => el.open), true);
          await inspectAccessibility(page, `${pagePath || "main"} ${theme} consent dialog`);
          await page.keyboard.press("Escape");
          assert.deepEqual(errors, [], "No script errors");
          assert.deepEqual(externalRequests, [], "Theme choices do not trigger third-party requests");
          console.log(JSON.stringify({ page: pagePath || "main", theme, layouts: sizes.length, textScale: "200%", accessibilityViolations: 0, persistentControl: true, thirdPartyRequests: 0 }));
        } finally { await context.close(); }
      }
    }

    const context = await browser.newContext({ reducedMotion: "reduce", colorScheme: "dark" });
    const page = await context.newPage();
    const requests = [];
    page.on("request", request => { if (!request.url().startsWith(base)) requests.push(request.url()); });
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "light", "Light is the default even with a dark OS preference");
    assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), null, "No preference stored without a user choice");
    const consentBefore = await page.evaluate(() => localStorage.getItem("ar-analytics-consent-v1"));
    await page.getByRole("button", { name: "Switch to dark mode" }).focus();
    await page.keyboard.press("Space");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), "dark");
    assert.equal(await page.evaluate(() => localStorage.getItem("ar-analytics-consent-v1")), consentBefore);
    assert.equal(await page.locator('meta[name="theme-color"]').getAttribute("content"), "#050507");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    const privacy = await context.newPage();
    await privacy.goto(new URL("privacy/", base).href, { waitUntil: "networkidle" });
    assert.equal(await privacy.locator("html").getAttribute("data-theme"), "dark", "Choice shared with privacy page");
    await privacy.getByRole("button", { name: "Switch to light mode" }).focus();
    await privacy.keyboard.press("Enter");
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
    assert.equal(await privacy.locator('meta[name="theme-color"]').getAttribute("content"), "#f6f8f7");
    await privacy.evaluate(key => localStorage.removeItem(key), storageKey);
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
    await page.evaluate(key => localStorage.setItem(key, "invalid-value"), storageKey);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
    assert.deepEqual(requests, []);
    await context.close();

    const unavailable = await browser.newContext();
    await unavailable.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } }));
    const unavailablePage = await unavailable.newPage();
    await unavailablePage.goto(base, { waitUntil: "networkidle" });
    await unavailablePage.getByRole("button", { name: "Switch to dark mode" }).click();
    assert.equal(await unavailablePage.locator("html").getAttribute("data-theme"), "dark", "Works when storage is blocked");
    await unavailablePage.reload({ waitUntil: "networkidle" });
    assert.equal(await unavailablePage.locator("html").getAttribute("data-theme"), "light");
    await unavailable.close();

    const noJS = await browser.newPage({ javaScriptEnabled: false });
    await noJS.goto(base);
    assert.equal(await noJS.locator("html").evaluate(el => getComputedStyle(el).colorScheme), "light");
    assert.equal(await noJS.locator("[data-theme-toggle]").isVisible(), false, "No unusable control without JavaScript");
    assert.ok((await noJS.locator("main").innerText()).length > 500);
    await noJS.close();
    console.log(JSON.stringify({ behavior: "passed", scenarios: ["light default", "keyboard", "saved preference", "privacy page", "cross-tab synchronization", "invalid preference", "blocked storage", "no JavaScript", "no analytics side effects"] }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

async function inspectLayout(page) {
  const result = await page.evaluate(() => {
    const overflow = [...document.querySelectorAll("h1,h2,h3,p,a,button,img")].filter(el => {
      if (el.closest("[hidden],dialog:not([open]),[aria-hidden='true']") || el.matches(".skip-link")) return false;
      const rect = el.getBoundingClientRect();
      return rect.width && (rect.left < -1 || rect.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 2);
    }).map(el => el.textContent.trim().slice(0, 50));
    const cardOverlap = [...document.querySelectorAll(".principle-card")].filter(card => {
      const bounds = card.getBoundingClientRect();
      const icon = card.querySelector(".card-icon").getBoundingClientRect();
      const heading = card.querySelector("h3").getBoundingClientRect();
      const paragraph = card.querySelector("p").getBoundingClientRect();
      return icon.top < bounds.top || icon.bottom > heading.top + 1 || heading.bottom > paragraph.top + 1 || paragraph.bottom > bounds.bottom + 1;
    }).map(card => card.querySelector("h3").textContent);
    return { overflow, cardOverlap, documentOverflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.deepEqual(result.overflow, [], `Content fits at ${JSON.stringify(page.viewportSize())}`);
  assert.deepEqual(result.cardOverlap, [], "Principle icons, headings, and descriptions stay within their cards without overlap");
  assert.equal(result.documentOverflow, false);
}

async function inspectPageEnding(page) {
  assert.equal(await page.locator(".closing, #closing-title, .closing-orb").count(), 0, "Removed closing section stays absent in both themes");
  assert.equal(await page.locator("main > section:last-child").getAttribute("id"), "projects", "Projects is the final content section");
  assert.equal(await page.locator("main + footer").count(), 1, "Footer follows the main content directly");
}

async function inspectMainCopy(page) {
  assert.equal(await page.locator(".card-number, .primary-link, .footer-tagline").count(), 0, "Removed numbering, hero button, and footer tagline stay absent");
  assert.deepEqual(await page.locator(".section-index").allTextContents(), ["Our vision", "Principles", "Projects"]);
  assert.deepEqual(await page.locator(".principle-card h3").allTextContents(), ["Grounded in context", "Action with intent", "Clear by design"]);
  assert.equal((await page.locator(".hero .eyebrow").textContent()).trim(), "AI for real workflows");
  assert.match(await page.locator(".hero-intro").innerText(), /Agentic Realities creates AI software/);
  const metadata = await page.evaluate(() => ({
    title: document.title,
    socialTitles: [...document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]')].map(meta => meta.content),
    descriptions: [...document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]')].map(meta => meta.content),
    graph: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)["@graph"],
  }));
  assert.equal(metadata.title, "Agentic Realities — Purpose-built AI software");
  assert.deepEqual(metadata.socialTitles, [metadata.title, metadata.title]);
  assert.ok(metadata.descriptions.every(description => description === metadata.descriptions[0]));
  assert.equal(metadata.graph.find(item => item["@type"] === "WebPage").name, metadata.title);
  assert.equal(metadata.graph.find(item => item["@type"] === "ItemList").itemListElement.length, 3);
}

async function inspectAccessibility(page, description) {
  const violations = await page.evaluate(async () => (await axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
  })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })));
  assert.deepEqual(violations, [], `${description} accessibility`);
}
