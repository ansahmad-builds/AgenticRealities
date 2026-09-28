// Static-site regression check. Supply PLAYWRIGHT_MODULE when Playwright is not local.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const sites = [
    { name: "kairos", url: "http://127.0.0.1:43118/" },
    { name: "bongaus", url: "http://127.0.0.1:43119/" },
    { name: "main", url: "http://127.0.0.1:43120/" },
    { name: "sitoa", url: "http://127.0.0.1:43121/" },
  ];
  let failures = 0;
  for (const site of sites) {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const width of [320, 375, 390, 527, 768, 836, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(site.url, { waitUntil: "networkidle" });
      const result = await inspect(page);
      if (result.overflow.length || result.missingAnchors.length || result.mixedContent.length) failures++;
      console.log(JSON.stringify({ site: site.name, width, ...result }));
      if (process.env.SCREENSHOT_DIRECTORY && [390, 1440].includes(width)) {
        await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIRECTORY, `${site.name}-${width}.png`), fullPage: true });
      }
    }
    for (const width of [320, 836, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(site.url, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "html { font-size: 200%; }" });
      const result = await inspect(page);
      if (result.overflow.length) failures++;
      console.log(JSON.stringify({ site: site.name, width, textScale: "200%", ...result }));
    }
    if (errors.length) { failures++; console.log(JSON.stringify({ site: site.name, errors })); }
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify({ failures }));
  process.exitCode = failures ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });

async function inspect(page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const overflow = [];
    for (const el of document.querySelectorAll("h1,h2,h3,p,a,dt,dd,figcaption,img")) {
      if (el.closest("[aria-hidden='true']") || el.matches(".skip-link")) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width && (rect.left < -1 || rect.right > viewport + 1 || el.scrollWidth > el.clientWidth + 2)) overflow.push(`${el.tagName}.${el.className}: ${el.textContent.trim().slice(0, 55)}`);
    }
    const missingAnchors = [...document.querySelectorAll("a[href^='#']")].filter(el => !document.getElementById(el.hash.slice(1))).map(el => el.hash);
    const mixedContent = [...document.querySelectorAll("[src],link[href]")].map(el => el.src || el.href).filter(url => url.startsWith("http:") && !url.startsWith(location.origin));
    return { overflow, missingAnchors, mixedContent };
  });
}
