# KinoLab — monetization decision and roadmap

Decision confirmed by owner on 2026-11-05. **Planning only. Staging repo exclusively.** No advertisements, tracking tags, affiliate links, paid subscriptions, production changes, or domain purchase are authorized by this document.

## Chosen first revenue sources

1. **Display advertising:** apply to a suitable ad network when KinoLab has genuine original value, stable traffic, appropriate privacy/cookie disclosure, and compliant film/link content. Never promise ad approval or a fixed earnings rate.
2. **Affiliate partnerships:** promote relevant, authorized streaming services, cinema tickets, or film-related products through clearly labeled referral links. Only use actual provider-approved affiliate URLs and accurate disclosures. No invented commissions.

**Premium/subscriptions:** deferred. Do not build payments, subscriptions, account paywalls, or premium features until the owner decides to proceed.

## Launch priorities

**Stage 1 — quality and compliance (before ad applications)**
- Audit all 9 existing published film pages for accurate ownership or permission to display posters/trailers and link to any third-party player.
- Publish valuable original editorial content (reviews, summaries, recommendations) rather than thin pages made only of third-party outbound links.
- Keep clear Contact, About, Privacy Policy, Terms and (where applicable) copyright-reporting procedures. Get relevant legal/privacy review.
- Disclose external destination and sponsorship/affiliate relationships without misleading users.

**Stage 2 — measurement before monetization**
- Owner approved preparing analytics on KinoLab-Test. The aggregate counter, secured SQL migration and trilingual Studio dashboard are staged. Owner reported migration success and all eight initial SQL privilege checks passed; a trilingual privacy notice has been added. The **staging source** enables the counter (`config.js`: `analyticsEnabled: true`), but it will collect no new traffic until the owner separately approves and deploys the updated staging site. Live admin/non-admin API testing remains a release check. See `KINOLAB_ANALYTICS_SETUP.md`.
- Choose a privacy-aware analytics provider and configure it first **only after** owner approval. Don't quietly add third-party scripts, cookies, or user identifiers.
- Define a baseline: page views, unique visitors, search behavior using non-sensitive aggregate data, outbound Watch clicks, language, country where lawfully available, mobile/desktop.
- Explain any consent requirements before adding advertising or tracking cookies. Avoid collecting personal search queries unnecessarily.

**Stage 3 — ad network**
- After the first two stages, check network eligibility and ad policy, especially copyright, thin/replicated content, popups, invalid clicks and misleading placement.
- Apply through the owner's ad account; ads must not obscure Watch, appear as fake playback controls, or interrupt navigation.
- Track revenue net of fees and the impact on page speed.

**Stage 4 — affiliates**
- Identify lawful partner programs, eligibility, and region availability; verify each approved destination and commission terms independently.
- Mark paid links clearly, e.g. 'Partner link / Գործընկերային հղում / Партнёрская ссылка'; add appropriate link relationship metadata.
- Measure aggregate outbound referral counts rather than user-level tracking where feasible.

## Guiding limits

- Ad network approval, paid clicks, provider availability and earnings are not guaranteed.
- A link to a third-party movie player does not establish legal redistribution rights.
- Do not add ads, affiliate identifiers, monetization scripts, or tracking in staging or production without explicit follow-up authorization.
- The KinoLab brand remains; domain decision is explicitly deferred until the owner asks to buy one.
- All production changes require a separate, explicit owner decision.

## Next executable decision

Owner runs the **build-only** staging GitHub workflow for the latest commit and reviews test results. Then owner separately approves staging publish and checks the admin-only dashboard as documented in `KINOLAB_ANALYTICS_SETUP.md`.
