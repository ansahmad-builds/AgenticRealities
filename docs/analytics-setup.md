# Consent-based Google Analytics activation

Measurement ID supplied by the owner: `G-RQ2C8DV5F3`.

Tracking is deliberately **disabled** in all four `analytics-config.js` files (`noticeApproved: false`). No Google tag or cookieless measurement ping is loaded in this state. The complete prospective privacy notice and consent-only integration are prepared; activation requires explicit owner approval.

## Owner confirmations — 29 September 2026

- Operator is a personal brand, Agentic Realities, based in Finland; the supplied public operator name is **A. Ahmad**. This records the owner's supplied identity, not an independent verification of a full legal name.
- `privacy@agenticrealities.com` receives messages, as confirmed by the owner.
- `G-RQ2C8DV5F3` is the correct owner-supplied measurement ID.
- The owner confirmed completion of the recommended account-settings checklist, then confirmed granular location/device collection and advertising-personalization changes are off. Account settings and legal/transfer terms have not been independently inspected through account access. The screenshot only supported some collection settings; retention/sharing/terms rely on the owner's checklist confirmation.
- A safety review rejected activation while the notice was unfinished and explicit activation authority was unclear. Do not bypass that rejection. Publish the notice and verified improvements with the gate off; obtain explicit permission before enabling all four sites.

## Required before activation

1. Publish the prospective privacy notice using the owner's supplied identity and monitored email. Ensure the operator identity is accurate and identifiable; initials alone have not been legally certified as sufficient.
2. Confirm this GA4 ID belongs to the owner's account and covers these sites. Review/accept the appropriate Google Analytics processing terms in that account; assess recipients and transfers, including applicable safeguards. Cookie consent is not by itself GDPR compliance.
3. Set event-data retention to the chosen disclosed duration (prefer the minimum appropriate setting). Turn off Google signals, advertising personalization, advertising products, user IDs, and unnecessary data sharing. Turn off automatic enhanced-measurement events until their payloads, URLs, and consent behavior have been reviewed. The integration manually sends a sanitized page view; queries and fragments are omitted, referrers are reduced to origins.
4. Publish the specific purposes, consent basis, recipients, real retention settings, transfer arrangements, cookie durations, withdrawal process, data-subject rights, contact details, and complaint route. Document the operator's assessment; obtain qualified legal review where needed.
5. Obtain explicit owner permission to enable the described consent-only collection on all four sites. Then set `noticeApproved: true` in each site's `analytics-config.js`, update the privacy status from prepared to active-after-consent, and publish all four sites. Bump `noticeVersion` after material changes so old consent cannot silently authorize a new scope. Do not independently accept Google's user-data acknowledgement or legal terms for the owner.
6. Verify in a clean browser: no Google requests before consent; Reject stays off after reload; Accept records only reviewed events; footer withdrawal clears accessible analytics cookies and reloads without Google. Check the real GA4 property in DebugView and inspect requests/cookies after activation; the synthetic regression test is not a substitute for this account-level check.

## Implemented behavior

- Basic consent mode: Google tag blocked until affirmative analytics consent. No pre-consent/denied cookieless pings.
- Equally styled Accept/Reject actions; no cookie wall or preselected analytics.
- Footer preferences, native keyboard-accessible dialog, and withdrawal.
- Consent stored per origin for up to 180 days, versioned. Local-storage failure does not grant consent on the next page. Global Privacy Control and Do Not Track keep analytics disabled.
- All advertising consent denied; no advertising or remarketing tags. No cross-site consent cookie or cross-domain linker.
- Sanitized URL/referrer defaults are applied globally and in the property config as well as the manual page view, including automatic events. HTTPS analytics cookies use Secure and SameSite=Lax; cookie expiry is capped at 180 days without rolling renewal.
- Each site is self-contained; shared analytics assets must remain identical across `dist`, `sitoa/docs`, `kairos/docs`, and `bongaus/docs`.

Consent preferences are operational privacy settings, not an analytics identifier. GitHub Pages separately logs visitor IPs for security; its hosting processing is disclosed. The websites do not claim they collect no personal data, because hosting requests exist.

## Primary guidance

- [Traficom cookie guidance](https://www.traficom.fi/sites/default/files/media/regulation/Guidance_on_the_use_of_web_cookies_for_the_service_providers%20%28002%29.pdf)
- [GDPR, including Articles 7 and 13](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
- [Google consent mode](https://support.google.com/analytics/answer/9976101)
- [GitHub Pages data collection](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)

The above is an implementation checklist, not legal certification.
