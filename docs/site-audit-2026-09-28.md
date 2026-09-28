# Website audit — 28 September 2026

Scope: Agentic Realities, Sitoa, Kairos, and Bongaus public informational sites. This is a front-end, technical SEO, performance, and consent-implementation audit—not an exhaustive security penetration test or a GDPR certification.

Follow-up: [29 September analytics readiness and activation](analytics-readiness-2026-09-29.md) records the supplied operator/contact details, owner-confirmed settings, published notice, explicit activation approval, and additional consent checks. The disabled-state findings below describe the original audit; the later setup loads Google only after visitor acceptance.

## Changes made

- Added self-referencing HTTPS canonical URLs, accurate descriptions, site names, Open Graph/text-sharing metadata, and indexable home-page directives.
- Added a separate `robots.txt` and XML sitemap for each domain. The home pages are the canonical content URLs; section fragments are not separate sitemap entries. Privacy information is deliberately `noindex,follow` and excluded from the sitemap.
- Added JSON-LD `WebSite`, `WebPage`, and `CreativeWork`/project-list information that matches the visible content. No invented ratings, prices, customer claims, company registration details, or production-readiness claims.
- Replaced vague main-site introductory copy with a clear explanation of the three projects and their audiences. Retained mutual project navigation and static, crawlable content.
- Fixed main-site content that was hidden without JavaScript, increased small body/label text, improved low-contrast section labels/footer text, made focus rings visible, and improved tablet card layout. Pointer effects now run only with a fine hover-capable pointer and without reduced-motion preferences.
- Removed the external Google Fonts request. All page styling, scripts, and icons now load from the same site before optional consent; system fonts preserve the restrained design without a font-provider request.
- Added a keyboard-accessible preferences dialog and equal-choice consent UI. The supplied GA4 ID is configured but the privacy approval gate is **off**. Public privacy information describes the current disabled state and GitHub hosting data; it does not present an incomplete setup as compliant.
- Added public IndexNow ownership files and a deployment-time notification script for the four home pages.

## Responsive and accessibility verification

The browser checks covered 11 sizes per home page (44 layouts): 320×698, 375×812, 390×844, 527×698, 568×320, 667×375, 768×1024, 836×698, 1024×768, 1440×900, and 1920×1080. Additional checks covered 200% text enlargement at 320, 836, and 1440px.

No horizontal page/text overflow or missing section anchors was found in the final checks. Static content remained readable with JavaScript disabled. Automated axe checks for the selected WCAG A/AA and best-practice rules found zero violations in the tested pages and preferences dialogs. Accessible-name warnings found by Lighthouse were fixed. Keyboard dialog opening, Escape dismissal, and return focus were verified. These checks do not replace manual assistive-technology testing or prove complete WCAG conformance.

The privacy page separately passed automated accessibility and narrow-screen enlarged-text checks. Mobile and desktop screenshots were visually inspected.

## Mobile Lighthouse lab results

Lighthouse 13.5.0, local static preview, headless Edge, mobile simulation. These are **lab measurements**, not real-user Core Web Vitals or a ranking score. Google Analytics remained disabled during measurement.

| Site | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Agentic Realities | 98 | 100 | 100 | 100 | 1.3 s | 0 |
| Sitoa | 100 | 100 | 100 | 100 | 1.2 s | 0 |
| Kairos | 100 | 100 | 100 | 100 | 1.1 s | 0 |
| Bongaus | 100 | 100 | 100 | 100 | 1.1 s | 0 |

First contentful paint was about 0.9 s for each local run. Total blocking time was 140 ms on the main page, 60 ms on Sitoa, and 0 ms on Kairos/Bongaus. Scores can vary by machine and run. Browser/CDN/network behavior must be measured separately on the live sites; GitHub controls HTTP compression/cache/security headers, which cannot all be changed using static HTML.

## SEO and generative-engine visibility

The sites are technically eligible for search-engine crawling: public static HTML, successful HTTPS responses, meaningful text, internal links, canonical metadata, sitemaps, and no `noindex` directive on the home pages. Eligibility does **not** establish that Bing or Google has indexed or ranked them. A generic search returned no useful evidence of current rankings; account-side indexing status has not been verified.

GEO here means clear project identity, directly stated purpose/audience, qualified claims, textual source-friendly explanations, and consistent connections between pages. No special AI-only schema or `llms.txt` was represented as a ranking requirement. Google states that ordinary SEO best practices apply to AI Overviews/AI Mode and that indexing/inclusion is not guaranteed.

Next account-level steps:

1. Verify the `agenticrealities.com` domain property in Google Search Console using the supplied DNS TXT verification token. A domain property covers the subdomains. No token has been invented or added to DNS.
2. Verify/import the sites in Bing Webmaster Tools, submit the per-domain sitemaps, and inspect crawl/indexing reports. Bing and Google verification need the owner's account access/tokens.
3. Submit these sitemap URLs: `https://agenticrealities.com/sitemap.xml`, `https://sitoa.agenticrealities.com/sitemap.xml`, `https://kairos.agenticrealities.com/sitemap.xml`, and `https://bongaus.agenticrealities.com/sitemap.xml`.
4. Use `node scripts/notify-indexnow.cjs` after successful publication to notify participating engines. An HTTP 200/202 acknowledges a notification/verification queue; it is not proof of indexing or ranking, and it is not Google Search Console submission.
5. Build relevant, original project documentation and earn genuine references as projects develop. Do not manufacture backlinks, reviews, keyword pages, or unsupported performance claims. Use Search Console/Bing reports to assess actual impressions and queries over time.

## Published verification

All four GitHub deployments completed successfully. Fresh live browser checks returned HTTPS 200 responses over TLS 1.3, correct canonical URLs, available robots/sitemap/ownership-key files, disabled analytics, and zero pre-consent third-party requests. `https://www.agenticrealities.com/` returned a permanent redirect to the canonical apex, and `/privacy/` returned 200.

IndexNow accepted each of the four home-page notifications with HTTP 202. This means initial key verification/notification was queued; it does not prove indexing, ranking, or inclusion in an AI response. Google Search Console and Bing Webmaster account verification remain owner-side tasks.

## Analytics and legal boundary

Consent tests used a synthetic ID and intercepted Google requests locally; they sent no real analytics events. Verified: activation gate, no Google requests before consent, rejection persisted on reload, explicit acceptance loaded the mocked tag once, advertising consent stayed denied, withdrawal unloaded the tag and blocked it on reload, expired consent prompted again, and Global Privacy Control blocked analytics. All four disabled home pages made zero third-party requests in the checked browser runs.

Tracking remains disabled pending the full legal controller identity, public privacy-contact email, an accurate activated-analytics notice, review of Google's processing/transfer arrangements, retention, enhanced measurement/data sharing, and actual account-level verification. The current published privacy information transparently explains this. See [analytics activation checklist](analytics-setup.md). The website must not claim to collect no personal data: GitHub Pages logs visitor IPs for hosting security.

## Reproducing the checks

Use Node 22.19+ and Playwright. Audit dependencies are installed under ignored `.sites-runtime/audit`, not the application dependency tree. The scripts use `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` when those tools are outside the repository.

Serve `dist`, `sitoa/docs`, `kairos/docs`, and `bongaus/docs` on local ports 43120, 43121, 43118, and 43119 respectively. Then run:

```text
node scripts/check-project-sites.cjs
node scripts/audit-sites.cjs
node scripts/lighthouse-sites.mjs
```

Raw lab/browser results are kept in the ignored `.sites-runtime` directory. Publishing does not require these dependencies; the sites remain static HTML/CSS/JS.

## Primary sources

- [Google AI features and websites](https://developers.google.com/search/docs/appearance/ai-features)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google site-name structured data](https://developers.google.com/search/docs/appearance/site-names)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a)
- [IndexNow documentation](https://www.indexnow.org/documentation)
- [Google consent mode](https://support.google.com/analytics/answer/9976101)
- [Traficom cookie guidance](https://www.traficom.fi/sites/default/files/media/regulation/Guidance_on_the_use_of_web_cookies_for_the_service_providers%20%28002%29.pdf)
- [GDPR](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
- [GitHub Pages hosting data](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)
