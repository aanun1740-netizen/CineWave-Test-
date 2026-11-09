# KinoLab-Test: five free guest film choices

## Decision and scope

Owner approved implementing this **only in KinoLab-Test**. The **full catalog**, film posters, titles, descriptions, search and trailers remain visible to guests. The **external Watch URLs are not changed**. Guests may open the Watch links for any five **distinct film/catalog entries** for free. Re-opening the same chosen film does not consume another choice. On an attempted sixth new title, the Watch button opens a registration prompt instead of navigating to the third-party website.

- Prompt and guest counter are fully localized in Armenian, Russian and English.
- Register and Sign In go to existing KinoLab Auth flows; registration is **free**.
- Signed-in members have no KinoLab guest-choice limit; Admin permissions remain entirely separate and unchanged.
- Movies and series are counted as individual catalog titles (all episodes of one TV title count as one choice).
- The gate applies to Watch links in featured hero, movie rows, film details, TV episode links and internal video Watch routes.
- Guest choices are stored solely as a bounded list of five **internal catalog IDs** in this device's localStorage (`kinolab:guest-films-v1`), not names, IPs, external URLs, search queries or device fingerprints.
- No payment, Premium, ad scripts, tracking IDs or backend migration required.

## Meaning and limitations

This is a **soft registration incentive, not DRM or a secure access/paywall**: the external URLs remain available in the publicly readable Supabase movie catalog and on the independent provider sites. Guests can also clear browser data or use a separate device. Do not claim that this feature prevents someone who knows an external URL from visiting it independently. Do not use this for paid content or copyrighted content without proper authorization.

Clicking Watch counts a choice, not completed playback. KinoLab cannot see whether the third-party player actually started or how long a movie was watched. Existing privacy notice has been updated in all three languages to disclose localStorage choice history.

## Staging review before publication

1. Run the **build-only** KinoLab-Test GitHub Actions workflow (`publish=false`) on latest staging HEAD; confirm all unit and E2E tests are green.
2. Get separate owner approval for **staging-only** deployment. Do not touch main KinoLab, production Supabase or domain.
3. Open the staging site in an Incognito tab; visit the catalog and open five different movies using their Watch buttons, without signing in.
4. Verify each of those first five Watch links opens the original provider URL in a new tab; no changed URL and no embedded iframe.
5. Reopen one of the same five films; should still be permitted and show 5 / 5.
6. Click Watch on a sixth distinct film from the hero, catalog card or detail panel; a trilingual free-registration popup should appear, with no external redirect.
7. Close the popup and verify catalog, search, descriptions and trailers continue working.
8. Select Register / Log in; verify existing account flows and that a signed-in user can open any Watch link.
9. Verify Admin/Studio add-edit-publish flows still work and no production resources were modified.
10. Recheck on mobile and in all three languages.

The free limit applies per browser/device through localStorage, not per globally identified person. Avoid interpreting the result as a revenue guarantee or unique-user identity.

## Rollback

If staging UI breaks, deploy the last approved staging build via SHA-gated workflow. This feature has no database migration and leaves public external Watch URLs unchanged; rollback does not modify users' local browser values.
