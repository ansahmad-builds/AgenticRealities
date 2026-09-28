// Run after all sites deploy. This is a crawl notification, not a ranking guarantee.
const key = "0068d3ecf89d45f9b4cb3d088952b01a";
const hosts = ["agenticrealities.com", "sitoa.agenticrealities.com", "kairos.agenticrealities.com", "bongaus.agenticrealities.com"];
(async () => {
  for (const host of hosts) {
    const keyLocation = `https://${host}/${key}.txt`;
    const proof = await fetch(keyLocation);
    if (!proof.ok || (await proof.text()).trim() !== key) throw new Error(`Ownership key not deployed: ${host}`);
    const result = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation, urlList: [`https://${host}/`] }),
    });
    console.log(JSON.stringify({ host, status: result.status, accepted: [200, 202].includes(result.status) }));
    if (![200, 202].includes(result.status)) throw new Error(`IndexNow submission failed: ${host} ${await result.text()}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
