// Regression tests use an intercepted fake Google tag: no visitor events reach Google.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const axePath = require.resolve("../.sites-runtime/audit/node_modules/axe-core/axe.min.js");
const sites = [["main",43120,"dist"],["sitoa",43121,"sitoa/docs"],["kairos",43118,"kairos/docs"],["bongaus",43119,"bongaus/docs"]];
const storageKey = "ar-analytics-consent-v1";
const testId = "G-TEST000";
const version = "consent-regression-v2";

(async () => {
  for (const asset of ["analytics.js", "analytics.css", "analytics-config.js"]) {
    const expected = fs.readFileSync(`dist/${asset}`, "utf8");
    for (const [, , root] of sites) assert.equal(fs.readFileSync(`${root}/${asset}`, "utf8"), expected, `shared ${asset} must match`);
  }
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    for (const [name, port] of sites) {
      const base = `http://127.0.0.1:${port}/`;
      const gate = await browser.newContext();
      const gatePage = await gate.newPage();
      const gateRequests = [];
      gatePage.on("request", request => { if (!request.url().startsWith(base)) gateRequests.push(request.url()); });
      await gatePage.goto(base, { waitUntil: "networkidle" });
      assert.equal(await gatePage.evaluate(() => window.AR_ANALYTICS_CONFIG.noticeApproved), true);
      assert.equal(await gatePage.locator("#analytics-banner").isVisible(), true);
      await gatePage.locator('#analytics-banner [data-choice="denied"]').click();
      await gatePage.locator("[data-analytics-settings]").click();
      assert.equal(await gatePage.locator("#analytics-allow").isVisible(), true);
      assert.deepEqual(gateRequests, [], `${name}: production consent gate must block Google before acceptance`);
      await gate.close();

      const disabled = await fixture(browser, base, { ready: false });
      await disabled.page.goto(base, { waitUntil: "networkidle" });
      assert.equal(await disabled.page.locator("#analytics-banner").isVisible(), false);
      await disabled.page.locator("[data-analytics-settings]").click();
      assert.equal(await disabled.page.locator("#analytics-allow").isVisible(), false);
      assert.deepEqual(disabled.requests, []);
      await disabled.context.close();

      const { context, page, requests } = await fixture(browser, base);
      const dirtyUrl = base + "?email=synthetic@example.invalid&token=not-a-real-secret#private-fragment";
      await page.goto(dirtyUrl, { waitUntil: "networkidle" });
      for (const [width, height] of [[320,698],[390,844],[527,698],[568,320],[836,698],[1440,900]]) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.locator("#analytics-banner").isVisible(), true);
        assert.equal(await page.locator("#analytics-banner").evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `${name}: banner overflow at ${width}`);
        for (const button of await page.locator("#analytics-banner button").all()) {
          const rect = await button.boundingBox();
          assert.ok(rect.x >= 0 && rect.x + rect.width <= width && rect.height >= 44);
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addScriptTag({ path: axePath });
      assert.deepEqual(await page.evaluate(async () => (await axe.run(document)).violations.map(item => item.id)), []);
      assert.deepEqual(requests, []);
      await page.locator('#analytics-banner [data-choice="denied"]').click();
      await page.reload({ waitUntil: "networkidle" });
      assert.deepEqual(requests, []);
      assert.equal(await page.locator("#analytics-banner").isVisible(), false);
      await page.locator("[data-analytics-settings]").click();
      await page.locator("#analytics-allow").click();
      await page.waitForFunction(() => window.__analyticsStub === true);
      assert.equal(requests.length, 1);
      const queued = await page.evaluate(() => window.dataLayer.map(args => Array.from(args)));
      const config = queued.find(args => args[0] === "config")[2];
      const defaults = queued.find(args => args[0] === "set" && typeof args[1] === "object")[1];
      const view = queued.find(args => args[0] === "event" && args[1] === "page_view")[2];
      for (const data of [defaults, config, view]) {
        assert.equal(data.page_location, base);
        assert.equal(data.page_referrer, "");
        assert.ok(!JSON.stringify(data).includes("synthetic@example.invalid"));
        assert.ok(!JSON.stringify(data).includes("private-fragment"));
      }
      assert.equal(config.send_page_view, false);
      assert.equal(config.allow_google_signals, false);
      assert.equal(config.allow_ad_personalization_signals, false);
      assert.equal(config.cookie_domain, "none");
      assert.equal(config.cookie_expires, 180 * 24 * 60 * 60);
      assert.equal(config.cookie_update, false);
      for (const args of queued.filter(args => args[0] === "consent")) {
        for (const field of ["ad_storage", "ad_user_data", "ad_personalization"]) assert.equal(args[2][field], "denied");
      }
      await page.evaluate(() => { document.cookie = "_ga=mock-identifier; path=/"; document.cookie = "_ga_TEST000=mock-session; path=/"; });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__analyticsStub === true);
      assert.equal(requests.length, 2, "stored acceptance loads the mock tag once on reload");
      await page.locator("[data-analytics-settings]").click();
      await Promise.all([page.waitForEvent("load"), page.locator('#analytics-dialog [data-choice="denied"]').click()]);
      await page.waitForLoadState("networkidle");
      assert.equal(requests.length, 2);
      assert.equal(await page.evaluate(id => window["ga-disable-" + id], testId), true);
      assert.equal((await context.cookies()).some(cookie => cookie.name.startsWith("_ga")), false);
      for (const stale of [{ version, expires: Date.now() - 1 }, { version: "old-notice", expires: Date.now() + 60000 }]) {
        await page.evaluate(({ key, stale }) => localStorage.setItem(key, JSON.stringify({ choice: "granted", ...stale })), { key: storageKey, stale });
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(await page.locator("#analytics-banner").isVisible(), true);
        assert.equal(requests.length, 2);
      }
      await context.close();
      for (const signal of ["gpc", "dnt"]) {
        const restricted = await fixture(browser, base, { signal });
        await restricted.page.goto(base, { waitUntil: "networkidle" });
        assert.equal(await restricted.page.locator("#analytics-banner").isVisible(), false);
        await restricted.page.locator("[data-analytics-settings]").click();
        assert.equal(await restricted.page.locator("#analytics-allow").isVisible(), false);
        assert.deepEqual(restricted.requests, []);
        await restricted.context.close();
      }
      const unavailable = await fixture(browser, base, { storageUnavailable: true });
      await unavailable.page.goto(base, { waitUntil: "networkidle" });
      await unavailable.page.locator('#analytics-banner [data-choice="granted"]').click();
      await unavailable.page.waitForFunction(() => window.__analyticsStub === true);
      await unavailable.page.reload({ waitUntil: "networkidle" });
      assert.equal(await unavailable.page.locator("#analytics-banner").isVisible(), true);
      assert.equal(unavailable.requests.length, 1);
      await unavailable.context.close();
      console.log(JSON.stringify({ site: name, consent: "passed (mocked Google tag)", scenarios: ["production consent gate", "disabled fixture", "pre-consent silence", "6 banner layouts", "axe", "persistent reject/accept", "sanitized automatic-event defaults", "ads denied", "withdrawal clears cookies", "expiry/version", "GPC/DNT", "storage unavailable"] }));
    }
    const privacy = await browser.newPage();
    await privacy.goto("http://127.0.0.1:43120/privacy/", { waitUntil: "networkidle" });
    assert.ok((await privacy.locator("main").innerText()).includes("A. Ahmad"));
    assert.ok((await privacy.locator("main").innerText()).includes("privacy@agenticrealities.com"));
    await privacy.addScriptTag({ path: axePath });
    assert.deepEqual(await privacy.evaluate(async () => (await axe.run(document)).violations.map(item => item.id)), []);
    for (const width of [320,390,527,836,1440]) {
      await privacy.setViewportSize({ width, height: 844 });
      assert.equal(await privacy.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await privacy.setViewportSize({ width: 320, height: 844 });
    await privacy.screenshot({ path: ".sites-runtime/privacy-320-viewport.png" });
    await privacy.addStyleTag({ content: "html { font-size: 200%; }" });
    assert.equal(await privacy.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await privacy.screenshot({ path: ".sites-runtime/privacy-320-enlarged-viewport.png" });
    console.log(JSON.stringify({ privacy: "passed", accessibilityViolations: 0, layouts: 5, enlargedText: "200% at 320px" }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

async function fixture(browser, base, options = {}) {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  await context.addInitScript(({ signal, storageUnavailable }) => {
    if (signal === "gpc") Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true });
    if (signal === "dnt") Object.defineProperty(navigator, "doNotTrack", { get: () => "1" });
    if (storageUnavailable) Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage unavailable", "SecurityError"); } });
  }, options);
  await context.route("**/analytics-config.js", route => route.fulfill({ contentType: "application/javascript", body: `window.AR_ANALYTICS_CONFIG = ${JSON.stringify({ measurementId: testId, noticeApproved: options.ready !== false, noticeVersion: version, privacyUrl: "https://agenticrealities.com/privacy/" })};` }));
  const requests = [];
  await context.route(/https:\/\/[^/]*(google|analytics)[^/]*\//, route => {
    requests.push(route.request().url());
    return route.fulfill({ contentType: "application/javascript", body: "window.__analyticsStub = true;" });
  });
  return { context, page: await context.newPage(), requests };
}
