# Analytics readiness — 29 September 2026

Scope: the public Agentic Realities, Sitoa, Kairos, and Bongaus information websites. Underlying project applications are not covered.

## Current state

The owner supplied **A. Ahmad**, personal brand **Agentic Realities**, Finland, and confirmed that `privacy@agenticrealities.com` receives mail and `G-RQ2C8DV5F3` is correct. The owner confirmed the recommended Analytics settings checklist, then separately confirmed granular location/device collection and ads-personalization changes are off. This is owner confirmation, not independent account access or legal identity certification.

The public privacy notice describes the operator/contact, hosting, consent-based purpose, data categories, cookies and preference storage, withdrawal, retention, recipients, international processing/safeguards, rights, and complaint route. It was first published with analytics disabled. Its account-setting statements rely on the owner's confirmations, including two-month user/event retention with no reset on new activity. Aggregated reports are not represented as subject to that two-month limit.

A safety review initially rejected activation with unfinished disclosures and unclear explicit authority. The gate remained off while the complete prospective notice and improvements were published. Live checks verified HTTPS 200, TLS 1.3, the notice/contact details, matching scripts, and zero third-party requests on all four sites; all four deployments succeeded.

The owner then explicitly selected **Approve consent-only activation** on all four named sites. With the blocker resolved, the configuration was changed to `noticeApproved: true`, version `2026-09-29-active`; the public status now explains optional collection after acceptance. No Google acknowledgement or processing terms have been accepted on the owner's behalf.

## Changes and checks

- Shared consent assets remain byte-identical across the four sites; notice version is `2026-09-29-active`.
- Sanitized page URL/referrer defaults now apply globally and to the property configuration, not only the manually sent page view. Query strings/fragments are excluded; referrers are reduced to origins. No User-ID, cross-domain linker, or advertising consent is configured. Cookies are host-only (`cookie_domain: "none"`), have a 180-day cap without rolling renewal, and use Secure on HTTPS plus SameSite=Lax. Explicitly naming the apex as a cookie domain would also expose those cookies to subdomains, so it is not used.
- All four prospective consent flows passed local browser checks with an intercepted fake Google tag: zero Google requests before acceptance, persistent rejection and acceptance, one tag load per accepted page, ad consent denied, withdrawal preventing a tag reload and clearing accessible mocked cookies, expiry/notice-version reset, GPC/DNT, and unavailable browser storage.
- Six consent-banner viewport sizes per site passed horizontal-overflow and button-size checks. Tested banners had zero automated axe violations.
- Existing audits passed 44 home-page layouts, selected automated accessibility checks, canonical/metadata/crawl-file checks, and no-JavaScript readability. The initial disabled-state checks made zero third-party requests; enabled-state checks require the same pre-consent silence.
- The privacy page passed five widths, 200% text at 320px, and automated accessibility checks.
- A separate enlarged-text regression exposed a pre-existing main-site principles-card overflow at 320px. Explicit shrinkable grid columns and width-bounded square icons fix the intrinsic-size overflow without hiding the text or reducing its font size.
- Real Google-tag tests passed on all four local previews after test acceptance, with measurement requests intercepted before they reached Google: one sanitized page view, advertising-personalization denial (`npa=1`), no unreviewed external destinations, cookie expiry within 180 days, SameSite=Lax, zero pre-consent/rejected requests, and no tag reload or remaining accessible Analytics cookies after withdrawal. These tests sent no visitor events to the property.

Synthetic tests do not prove Google's actual tag/event payloads, account processing settings, legal sufficiency, or receipt in GA Realtime/DebugView. `scripts/check-real-analytics.cjs` adds actual Google-tag payload/cookie checks while intercepting measurement requests locally before transmission. Dashboard receipt still requires the owner's account access and a deliberately consented visit. If actual behavior differs, disable collection and correct it.

## Primary references

- [Google retention controls](https://support.google.com/analytics/answer/7667196)
- [Granular location/device controls](https://support.google.com/analytics/answer/12002752)
- [Google's 2026 data-control changes](https://support.google.com/analytics/answer/17016975)
- [Google processing terms](https://business.safety.google/adsprocessorterms/)
- [Google transfer frameworks](https://policies.google.com/privacy/frameworks)
- [Google cookie/configuration controls](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Finland privacy complaint route](https://tietosuoja.fi/en/notification-to-the-data-protection-ombudsman)

This is an implementation record, not legal certification.
