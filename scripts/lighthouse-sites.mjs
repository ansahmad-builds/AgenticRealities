import fs from "node:fs";
import path from "node:path";
import lighthouse from "../.sites-runtime/audit/node_modules/lighthouse/core/index.js";
import * as chromeLauncher from "../.sites-runtime/audit/node_modules/chrome-launcher/dist/index.js";

const profile = path.resolve(".sites-runtime/lighthouse-profile");
fs.mkdirSync(profile, { recursive: true });
const chrome = await chromeLauncher.launch({
  chromePath: process.env.BROWSER_EXECUTABLE,
  chromeFlags: ["--headless"],
  userDataDir: profile,
});
const results = [];
try {
  for (const [site, port] of [["main",43120],["sitoa",43121],["kairos",43118],["bongaus",43119]]) {
    const result = await lighthouse(`http://127.0.0.1:${port}/`, {
      port: chrome.port,
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance","accessibility","best-practices","seo"],
    });
    if (result.lhr.runtimeError) throw new Error(JSON.stringify(result.lhr.runtimeError));
    const summary = { site, scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([name, value]) => [name, Math.round(value.score * 100)])), metrics: Object.fromEntries(["first-contentful-paint","largest-contentful-paint","total-blocking-time","cumulative-layout-shift"].map(name => [name, result.lhr.audits[name].displayValue])), labelMismatch: result.lhr.audits["label-content-name-mismatch"].score };
    results.push(summary);
    fs.writeFileSync(`.sites-runtime/${site}-lighthouse-final.json`, result.report);
    console.log(JSON.stringify(summary));
  }
  fs.writeFileSync(".sites-runtime/lighthouse-summary.json", JSON.stringify(results, null, 2));
} finally { await chrome.kill(); }
