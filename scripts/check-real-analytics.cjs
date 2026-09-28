// Downloads the real Google tag only after test acceptance. Measurement requests
// are intercepted locally, so these tests do not send visit events to Google.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const sites = [["main",43120,"agenticrealities.com"],["sitoa",43121,"sitoa.agenticrealities.com"],["kairos",43118,"kairos.agenticrealities.com"],["bongaus",43119,"bongaus.agenticrealities.com"]];
const expectedId = "G-RQ2C8DV5F3";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    for (const [name, port, host] of sites) {
      const base = process.env.ANALYTICS_LIVE === "1" ? `https://${host}/` : `http://127.0.0.1:${port}/`;
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const measurements = [];
      const external = [];
      const unexpected = [];
      let stage = "before consent";
      await context.route("**/*", async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (request.url().startsWith(base)) return route.continue();
        external.push({ stage, host: url.hostname, path: url.pathname });
        if (url.pathname.endsWith("/collect")) {
          const body = request.postData() || "";
          for (const line of body ? body.split("\n") : [""]) {
            const params = new URLSearchParams(url.search);
            for (const [key, value] of new URLSearchParams(line)) params.set(key, value);
            measurements.push({ stage, host: url.hostname, params: Object.fromEntries(params) });
          }
          return route.fulfill({ status: 204, body: "" });
        }
        if (url.hostname === "www.googletagmanager.com" && request.resourceType() === "script") return route.continue();
        unexpected.push({ stage, host: url.hostname, path: url.pathname });
        return route.abort();
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(base + "?email=synthetic@example.invalid&token=test-only#private-fragment", { waitUntil: "networkidle", referer: "https://referrer.example.invalid/private?email=synthetic@example.invalid" });
      assert.deepEqual(external, []);
      assert.equal((await context.cookies()).filter(cookie => cookie.name.startsWith("_ga")).length, 0);
      await page.locator('#analytics-banner [data-choice="denied"]').click();
      await page.reload({ waitUntil: "networkidle" });
      assert.deepEqual(external, []);
      await page.locator("[data-analytics-settings]").click();
      stage = "accepted";
      const [collectRequest] = await Promise.all([
        page.waitForRequest(request => new URL(request.url()).pathname.endsWith("/collect"), { timeout: 20000 }),
        page.locator("#analytics-allow").click(),
      ]);
      await collectRequest.response(); // Wait for the interception handler, not just request creation.
      await page.waitForLoadState("networkidle");
      assert.ok(measurements.length > 0, JSON.stringify({ collectionHost: new URL(collectRequest.url()).hostname, collectionPath: new URL(collectRequest.url()).pathname, external, unexpected }));
      for (const measurement of measurements) {
        assert.equal(measurement.stage, "accepted");
        assert.ok(/(^|\.)google-analytics\.com$/.test(measurement.host), `Unexpected measurement destination: ${measurement.host}`);
        assert.equal(measurement.params.tid, expectedId);
        assert.equal(measurement.params.dl, base);
        if (measurement.params.dr) assert.ok(["https://referrer.example.invalid/",base].includes(measurement.params.dr));
        assert.equal(measurement.params.npa, "1");
        assert.ok(!JSON.stringify(measurement.params).includes("synthetic@example.invalid"));
        assert.ok(!JSON.stringify(measurement.params).includes("private-fragment"));
      }
      assert.equal(measurements.filter(measurement => measurement.params.en === "page_view").length, 1, "No duplicate page view");
      assert.deepEqual(unexpected, []);
      const cookies = (await context.cookies()).filter(cookie => cookie.name.startsWith("_ga"));
      assert.ok(cookies.length > 0);
      for (const cookie of cookies) {
        assert.equal(cookie.domain, new URL(base).hostname, "Cookie must be host-only, not a parent-domain cookie");
        assert.equal(cookie.sameSite, "Lax");
        if (base.startsWith("https:")) assert.equal(cookie.secure, true);
        assert.ok(cookie.expires <= Date.now() / 1000 + 180 * 86400 + 60, "Cookie must not exceed 180 days");
      }
      const beforeWithdrawal = external.length;
      stage = "withdrawn";
      await page.locator("[data-analytics-settings]").click();
      await Promise.all([page.waitForEvent("load"),page.locator('#analytics-dialog [data-choice="denied"]').click()]);
      await page.waitForLoadState("networkidle");
      assert.equal(external.length, beforeWithdrawal);
      assert.equal((await context.cookies()).filter(cookie => cookie.name.startsWith("_ga")).length, 0);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ site: name, realTag: "passed", measurementRequestsIntercepted: measurements.length, events: measurements.map(measurement => measurement.params.en), preConsentRequests: 0, rejectedRequests: 0, postWithdrawalRequests: 0, cookies: cookies.map(cookie => ({ name: cookie.name, sameSite: cookie.sameSite, domain: cookie.domain })), visitorEventsSentToGoogle: 0 }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
