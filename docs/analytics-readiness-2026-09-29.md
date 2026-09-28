# Analytics readiness — 29 September 2026

Scope: the public Agentic Realities, Sitoa, Kairos, and Bongaus information websites. Underlying project applications are not covered.

## Current state

The owner supplied **A. Ahmad**, personal brand **Agentic Realities**, Finland, and confirmed that `privacy@agenticrealities.com` receives mail and `G-RQ2C8DV5F3` is correct. The owner confirmed the recommended Analytics settings checklist, then separately confirmed granular location/device collection and ads-personalization changes are off. This is owner confirmation, not independent account access or legal identity certification.

The prospective public privacy notice now describes the operator/contact, hosting, consent-based purpose, data categories, cookies and preference storage, withdrawal, retention, recipients, international processing/safeguards, rights, and complaint route. It explicitly states that analytics is **not enabled**. Its account-setting statements rely on the owner's confirmations, including two-month user/event retention with no reset on new activity. Aggregated reports are not represented as subject to that two-month limit.

A safety review rejected activation with unfinished disclosures and unclear explicit authority. The activation gate remains `noticeApproved: false` in all four sites. Explicit owner permission to activate the described consent-only setup is still required; this rejection must not be bypassed. No Google acknowledgement or processing terms have been accepted on the owner's behalf.

## Changes and checks

- Shared consent assets remain byte-identical across the four sites; notice version is `2026-09-29`.
- Sanitized page URL/referrer defaults now apply globally and to the property configuration, not only the manually sent page view. Query strings/fragments are excluded; referrers are reduced to origins. No User-ID, cross-domain linker, or advertising consent is configured. Cookies are hostname-scoped, have a 180-day cap without rolling renewal, and use Secure on HTTPS plus SameSite=Lax.
- All four prospective consent flows passed local browser checks with an intercepted fake Google tag: zero Google requests before acceptance, persistent rejection and acceptance, one tag load per accepted page, ad consent denied, withdrawal preventing a tag reload and clearing accessible mocked cookies, expiry/notice-version reset, GPC/DNT, and unavailable browser storage.
- Six consent-banner viewport sizes per site passed horizontal-overflow and button-size checks. Tested banners had zero automated axe violations.
- Existing audits passed 44 home-page layouts, selected automated accessibility checks, canonical/metadata/crawl-file checks, and no-JavaScript readability. Production activation gates remained off with zero pre-consent third-party requests.
- The privacy page passed five widths, 200% text at 320px, and automated accessibility checks.
- A separate enlarged-text regression exposed a pre-existing main-site principles-card overflow at 320px. Explicit shrinkable grid columns and width-bounded square icons fix the intrinsic-size overflow without hiding the text or reducing its font size.

Synthetic tests do not prove Google's actual tag/event payloads, account processing settings, legal sufficiency, or receipt in GA Realtime/DebugView. After explicit activation authority, update the public status, enable the gates, publish all four sites, inspect the real consented payloads and cookies, and confirm the property receives test visits. Account viewing requires the owner's access. If actual behavior differs, disable collection and correct it.

## Primary references

- [Google retention controls](https://support.google.com/analytics/answer/7667196)
- [Granular location/device controls](https://support.google.com/analytics/answer/12002752)
- [Google's 2026 data-control changes](https://support.google.com/analytics/answer/17016975)
- [Google processing terms](https://business.safety.google/adsprocessorterms/)
- [Google transfer frameworks](https://policies.google.com/privacy/frameworks)
- [Google cookie/configuration controls](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Finland privacy complaint route](https://tietosuoja.fi/en/notification-to-the-data-protection-ombudsman)

This is an implementation record, not legal certification.
