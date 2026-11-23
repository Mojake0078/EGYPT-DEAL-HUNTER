# Affiliate monetization research — Egypt

- Research date: 2026-11-23
- Purpose: product and channel planning only; not legal advice. Re-check each provider's terms before activation.

## Current public program evidence

### Noon Egypt

Noon's official affiliate site currently advertises a free signup, custom links/codes, sharing through social platforms, analytics/support, and commissions of up to 10% on qualifying orders.

- Program: https://affiliates.noon.com/ar
- FAQ: https://affiliates.noon.com/ar/questions?category=general
- Terms: https://affiliates.noon.com/ar/terms

**Planning:** best first candidate for social-first deal sharing, subject to account approval, Egypt eligibility, category exclusions, attribution rules, and the current agreement.

### Jumia Egypt

Jumia's official Egypt affiliate page describes a pay-per-sale program. Its public instructions currently say applicants need an active, high-traffic blog, submit the registration form, and wait for approval. It describes commission when a referred buyer purchases through the affiliate link.

- Program: https://www.jumia.com.eg/sp-jumia-affiliate/
- Registration link is provided from the official page.

**Planning:** candidate after we have a public site/blog with original editorial content and sufficient traffic. Do not assume a Facebook group alone meets its stated application requirements.

### Amazon Egypt

Amazon Egypt has an active Associates portal. Its public welcome page advertises earnings up to 9% on qualifying purchases/programs. The current policies are more restrictive and must be read before using it.

- Program: https://affiliate-program.amazon.eg/welcome
- Policies: https://affiliate-program.amazon.eg/help/operating/policies/

Key policy points observed on 2026-11-23:

1. Unless Amazon otherwise agrees, an Associate's Site must not have price-tracking and/or price-alert functionality (policy section 6(y)). That conflicts directly with EGYPT DEAL HUNTER's core product-watch feature.
2. Amazon requires the approved Site(s) to be identified in the application and Special Links to be correctly formatted with the assigned Associates ID.
3. If prices are displayed in a price-comparison format alongside other retailers, the policy requires displaying the lowest new Amazon price and, if Amazon provides it, the lowest used Amazon price.
4. Price/availability display is subject to Amazon's approved data/link requirements; the policy says it may be shown only when served by Amazon or obtained through Creators API/PA API under the relevant license.
5. Amazon's policy requires clear disclosures and restricts use of its content and Special Links on sites/platforms that are not the approved Site.

**Planning:** do not enable Amazon affiliate links on the price-tracking/comparison website until Amazon gives written confirmation/exception for this exact use case and approves the relevant site/channel. Keep ordinary original product links separate from affiliate links. Ask Amazon support for written clarification before implementation.

## Facebook distribution

A Facebook Page or Group can be a distribution channel, but it is not the same as having an approved affiliate site/account. Before automated publishing, confirm:
- the relevant affiliate program allows the exact Facebook Page/Group or social profile to be registered/used;
- Meta's current branded-content/affiliate disclosure and spam rules for that account type;
- every post discloses the commercial/affiliate relationship clearly;
- links point directly to the correct product and do not use deceptive cloaking or redirect chains.

Meta announced an affiliate-link feature for eligible creators through Professional Dashboard / Affiliate Partnerships in 2026, but availability and eligible partners can vary by account, country and format. Treat this as an optional channel, not a guaranteed Egypt-wide API.

## Product implementation rules

- Store `originalProductUrl` and `affiliateUrl` separately; never overwrite the original.
- Affiliate URLs are generated only by an approved program adapter and only for approved stores/products/channels.
- Store program, tag/campaign, destination URL, generated-at time and the source account/site used.
- Never manufacture affiliate query parameters or use generic URL shorteners to disguise destinations.
- Keep posting human-approved initially. Log the post URL, timestamp, deal snapshot and disclosure text.
- Revenue is earned only from qualifying attributed purchases under the program's rules, not merely from a click or a product appearing in the report.

## Recommended rollout

1. Build the hourly Deal Radar and spreadsheet report without affiliate dependencies.
2. Apply to Noon and verify account/channel eligibility; add its link adapter after approval.
3. Build an original public editorial site and traffic, then apply to Jumia and verify the active requirements.
4. Request written permission from Amazon for price tracking/alerts and comparison use before enabling Amazon affiliate links.
5. Add Facebook publishing as a review queue first; automate only after channel and affiliate terms are confirmed.
