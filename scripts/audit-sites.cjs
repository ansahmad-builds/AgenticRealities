const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const axePath = require.resolve("../.sites-runtime/audit/node_modules/axe-core/axe.min.js");
const sites = [
  { name: "main", port: 43120, host: "agenticrealities.com" },
  { name: "sitoa", port: 43121, host: "sitoa.agenticrealities.com" },
  { name: "kairos", port: 43118, host: "kairos.agenticrealities.com" },
  { name: "bongaus", port: 43119, host: "bongaus.agenticrealities.com" },
];
const results = [];
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    for (const site of sites) {
      const url = `http://127.0.0.1:${site.port}/`;
      const page = await browser.newPage({ reducedMotion: "reduce" });
      const errors = [];
      const externalRequests = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("request", request => { if (!request.url().startsWith(url)) externalRequests.push(request.url()); });
      for (const [width, height] of [[320,698],[375,812],[390,844],[527,698],[568,320],[667,375],[768,1024],[836,698],[1024,768],[1440,900],[1920,1080]]) {
        await page.setViewportSize({ width, height });
        await page.goto(url, { waitUntil: "networkidle" });
        const layout = await page.evaluate(() => {
          const overflow = [...document.querySelectorAll("h1,h2,h3,p,a,button,dt,dd,figcaption")].filter(el => {
            if (el.closest("[hidden],dialog:not([open]),[aria-hidden='true']") || el.matches(".skip-link")) return false;
            const r = el.getBoundingClientRect();
            return r.width && (r.left < -1 || r.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 2);
          }).map(el => el.textContent.trim().slice(0, 45));
          return { overflow, documentOverflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.deepEqual(layout.overflow, [], `${site.name} overflow at ${width}x${height}`);
        assert.equal(layout.documentOverflow, false);
      }
      const seo = await page.evaluate(() => ({
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        description: document.querySelector('meta[name="description"]')?.content,
        robots: document.querySelector('meta[name="robots"]')?.content,
        h1s: document.querySelectorAll("h1").length,
        schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map(el => JSON.parse(el.textContent)),
        missingAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(el => !document.getElementById(el.hash.slice(1))).map(el => el.hash),
      }));
      assert.equal(seo.canonical, `https://${site.host}/`);
      assert.equal(seo.h1s, 1);
      assert.ok(seo.description && seo.schema.length && seo.robots.startsWith("index,follow"));
      assert.deepEqual(seo.missingAnchors, []);
      for (const resource of ["robots.txt", "sitemap.xml", "0068d3ecf89d45f9b4cb3d088952b01a.txt"]) {
        const response = await page.request.get(url + resource);
        assert.equal(response.status(), 200, `${site.name} missing ${resource}`);
        const content = await response.text();
        if (resource === "robots.txt") assert.ok(content.includes(`Sitemap: https://${site.host}/sitemap.xml`));
        if (resource === "sitemap.xml") assert.ok(content.includes(`<loc>https://${site.host}/</loc>`));
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.addScriptTag({ path: axePath });
      const accessibility = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21aa","best-practice"] } }));
      const violations = accessibility.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) }));
      assert.deepEqual(violations, [], `${site.name} accessibility violations: ${JSON.stringify(violations)}`);
      const allRules = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa","best-practice"] } }));
      assert.deepEqual(allRules.violations.map(item => item.id), []);
      await page.locator("[data-analytics-settings]").click();
      assert.equal(await page.locator("#analytics-dialog").evaluate(el => el.open), true);
      assert.equal(await page.locator("#analytics-allow").isVisible(), false);
      const dialogAudit = await page.evaluate(() => axe.run(document));
      assert.deepEqual(dialogAudit.violations.map(item => item.id), [], `${site.name} dialog accessibility`);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("[data-analytics-settings]").evaluate(el => el === document.activeElement), true);
      assert.deepEqual(externalRequests, [], `${site.name} pre-consent external requests`);
      assert.deepEqual(errors, []);
      const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
      await noJS.goto(url);
      assert.equal(await noJS.locator("h1").evaluate(el => Number(getComputedStyle(el).opacity)), 1);
      assert.ok((await noJS.locator("main").innerText()).length > 500);
      await noJS.close();
      results.push({ site: site.name, layouts: 11, accessibilityViolations: violations, metadata: "passed", crawlFiles: "passed", noJavaScript: "passed", preConsentThirdPartyRequests: externalRequests.length });
      console.log(JSON.stringify(results.at(-1)));
      await page.close();
    }
    await testConsent(browser);
    fs.writeFileSync(".sites-runtime/audit-results.json", JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

async function testConsent(browser) {
  const url = "http://127.0.0.1:43120/";
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  await context.route("**/analytics-config.js", route => route.fulfill({ contentType: "application/javascript", body: 'window.AR_ANALYTICS_CONFIG = {measurementId:"G-TEST000",noticeApproved:true,noticeVersion:"test-v1",privacyUrl:"https://agenticrealities.com/privacy/"};' }));
  const requests = [];
  await context.route(/https:\/\/[^/]*(google|analytics)[^/]*\//, route => { requests.push(route.request().url()); return route.fulfill({ contentType: "application/javascript", body: "window.__analyticsStub = true;" }); });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#analytics-banner").isVisible(), true);
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
  const view = queued.find(args => args[0] === "event" && args[1] === "page_view");
  assert.equal(view[2].page_location, url.slice(0, -1) + "/");
  const consent = queued.find(args => args[0] === "consent" && args[1] === "update")[2];
  assert.equal(consent.ad_user_data, "denied");
  assert.equal(consent.ad_personalization, "denied");
  await page.locator("[data-analytics-settings]").click();
  await Promise.all([page.waitForEvent("load"), page.locator('#analytics-dialog [data-choice="denied"]').click()]);
  await page.waitForLoadState("networkidle");
  assert.equal(requests.length, 1, "withdrawal must not reload Google");
  assert.equal(await page.evaluate(() => window["ga-disable-G-TEST000"]), true);
  await page.evaluate(() => localStorage.setItem("ar-analytics-consent-v1", JSON.stringify({ choice: "granted", version: "test-v1", expires: Date.now() - 1 })));
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#analytics-banner").isVisible(), true);
  assert.equal(requests.length, 1);
  await page.addScriptTag({ path: axePath });
  assert.deepEqual(await page.evaluate(async () => (await axe.run(document)).violations.map(item => item.id)), []);
  console.log(JSON.stringify({ consent: "passed", scenarios: ["activation gate", "no requests before consent", "reject survives reload", "accept loads once", "advertising denied", "withdraw unloads Google", "expired choice re-prompts"] }));
  await context.close();
}
