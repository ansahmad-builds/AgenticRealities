# Agentic Realities

The landing page for [agenticrealities.com](https://agenticrealities.com).

## Local preview

Serve the `dist` directory with any static file server. For example:

```powershell
npx serve dist
```

## Deployment

Pushes to `main` deploy the contents of `dist` through GitHub Pages. The custom domain is declared in `dist/CNAME`.

## Project websites

The main site links to three independently hosted public information pages:

- [Sitoa](https://sitoa.agenticrealities.com/) — project memory, decisions, and follow-ups.
- [Kairos](https://kairos.agenticrealities.com/) — company signals, buyer matching, and conversation preparation.
- [Bongaus](https://bongaus.agenticrealities.com/) — creator discovery, research, and outreach preparation.

Each source lives in its named subdirectory. Each separate GitHub repository publishes `docs` from `main`, with a project-specific `CNAME`. See those READMEs for the subtree publishing commands. These are static project-information sites, not public deployments of the underlying applications or their databases.

## Search, privacy, and audit

Each domain has its own sitemap, robots file, canonical metadata, and site/project structured data. Run `node scripts/notify-indexnow.cjs` after all four sites deploy to notify participating search engines. Google Search Console/Bing Webmaster Tools ownership verification still requires the owner's account tokens.

Google Analytics is enabled **only after visitor consent**, following explicit owner approval on 29 September 2026. Before consent and after rejection, Google's tag stays blocked with no cookieless measurement pings. The [privacy notice](https://agenticrealities.com/privacy/) records the supplied operator/contact details and owner-confirmed settings. Keep the shared consent assets identical in all four sites. See [analytics setup](docs/analytics-setup.md), [readiness/activation record](docs/analytics-readiness-2026-09-29.md), and the [website audit](docs/site-audit-2026-09-28.md) for behavior, results, and account-level limits.

The additional `node scripts/check-analytics-consent.cjs` regression test checks all four production activation gates and uses a fake intercepted Google tag for consent, withdrawal, privacy-signal, storage, URL-sanitization, and responsive checks. It sends no visitor events to Google. Run it against the same localhost previews and test dependencies described in the audit.

`node scripts/check-real-analytics.cjs` downloads the real Google tag after test acceptance but intercepts measurement requests before they reach Google. It checks event payloads/cookies and withdrawal without polluting the Analytics property. Set `ANALYTICS_LIVE=1` to run against the four public domains rather than localhost previews.
