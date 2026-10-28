# Brand Studio decisions

This is the durable agreement between the learner and agent. Keep it concise and update it only with agreed choices or actual evidence. `Not chosen yet` is a valid status. Persona cards are hypotheses unless supported by real research.

[LEARNING.md](LEARNING.md) holds the short, reviewable record of learner explanations and help received. Keep the brand decisions and implementation evidence here; link rather than duplicate them.

## Current stage

- Stage: Storefront, live style guide and first persuasion touch built and pushed on the feature branch; second persuasion touch, learner checks and keep still to do.
- Current feature: `BRAND-001` — first branded storefront and live style guide ([issue #1](https://github.com/mnguyenht/is117-brand-assignment/issues/1), branch `brand-001-first-branded-storefront`).
- Status: Audience, brief, visual direction and logo agreed; build done and checks passing.
- Next small decision: A second persuasion touch, then the learner's test explanation and browser checks.

## Product boundary

The product is the same white T-shirt throughout the comparison. The baseline offers a size selector and temporary demo bag. No real orders, payment, accounts, or persistence. Keep product facts stable between directions; do not add unsupported claims about materials, manufacturing, sustainability, fit, delivery, scarcity, reviews, or sales.

## Audience hypotheses

The primary need guides the page. Give the secondary card one contrasting need to check that same page; keep both cards brief.

| Tiny card                             | Primary audience                                                                                                                    | Secondary audience                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Person in a concrete situation        | Alex, a budget / value-conscious shopper; wearing situation not chosen yet                                                          | Fiona, who enjoys high-end buying; wearing situation not chosen yet                |
| Goal or meaning they seek             | A shirt that is "reliable while being cheap" and treated as "just a plain white T-shirt", not a fashion statement (learner's words) | Refinement, a story behind the product, and having her needs met (learner's words) |
| Concern before choosing               | Not chosen yet                                                                                                                      | Not chosen yet                                                                     |
| What the page should help them decide | Not chosen yet                                                                                                                      | Not chosen yet                                                                     |
| Evidence or assumption                | Assumption; not validated                                                                                                           | Assumption; not validated                                                          |

## Early brand brief

| Decision                                 | Agreement                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand name                               | Standard Issue (AI example; learner adopted it. No trademark check done)                                                                                                        |
| One-sentence promise                     | "A white T-shirt is a white T-shirt. But it'll be a good white T-shirt." (learner's words; "good" must not become specific quality claims we cannot support)                    |
| Primary archetype: the brand's character | Everyman (switched from Explorer: AI suggested it fits Alex's "nothing more, nothing less" need; learner approved)                                                              |
| Three voice traits                       | Curious, assured, plainspoken (learner's choice; all three words appeared in AI voice examples first)                                                                           |
| One example line in this voice           | Not chosen yet                                                                                                                                                                  |
| Learner's predicted audience effect      | "he'll check the price and knows its worth the price" (learner's words, unprompted; note: the demo shows only a clearly labeled fictional $28 price, so "worth it" is untested) |

## Visual decision

Compare two small hero previews before building the whole page. Hold the product, headline, supporting copy, and action identical. Use specific real design references and annotate visual choices, intended effect, and risk.

A simple original SVG wordmark is enough. Show small-size and one-color presentations; they may use the same asset when it works.

| Item                                              | Agreement or evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared headline / support / action                | AI draft from the learner's promise: "A white T-shirt is a white T-shirt." / "But it'll be a good white T-shirt." / "Choose your size". Compared with identical copy. After choosing B, learner changed the support line to "But it'll sure be a great white T-shirt" (B only; A keeps the compared copy). "Great" stays general, with no specific quality claims                                                                                                                                  |
| Modernist preview, reference, and annotations     | [public/explorations/modernist.html](public/explorations/modernist.html), after Müller-Brockmann, _Der Film_ (1960, MoMA); notes in [docs/explorations/brand-001-heroes.md](docs/explorations/brand-001-heroes.md)                                                                                                                                                                                                                                                                                 |
| Postmodernist preview, reference, and annotations | [public/explorations/postmodernist.html](public/explorations/postmodernist.html), after Weingart, _Kunsthalle Basel Kunstkredit 76-77_ (1977, MoMA); same notes file                                                                                                                                                                                                                                                                                                                               |
| Chosen direction and reason                       | Postmodernist (B), learner's preference; learner asked to "implament more of the package labeling standard issue theme" — a reversible `label-try` adjustment (kraft paper, crate stamp, label-maker tape, hang tag) is in place. Learner's reason: "the general feel of everything conveys it well, the tag is still more of just a little spark… It's about having the theming of everything consistent… carried from the usage of proper texturing." Link to Alex's need is implied, not stated |
| Original SVG logo                                 | Crate-stamp wordmark, [public/assets/standard-issue-wordmark.svg](public/assets/standard-issue-wordmark.svg). AI proposed it from the preview's stamp; learner: "the [wordmark] is fine by itself". After the review page, learner approved keeping it as is ("Nah looks good"), naming no specific detail. No trademark check                                                                                                                                                                     |
| Monochrome and small-size variants                | One file serves both: the artwork is a single ink color (#111). Text uses system monospace fonts (Consolas on Windows), so letter shapes may differ on other systems                                                                                                                                                                                                                                                                                                                               |
| Logo review at actual use size                    | AI viewed [public/explorations/logo.html](public/explorations/logo.html) in Chromium: readable at 175 × 30 px nav size on kraft; at 117 × 20 px the lettering is barely legible, so 30 px tall is the minimum. Learner observation pending                                                                                                                                                                                                                                                         |
| Shared palette, typography, spacing, and assets   | In [public/styles.css](public/styles.css), shared by storefront and guide. Colours: kraft paper #dcc8a4 with a fibre texture, ink #111, price-sticker accent #f7d33c, label stock #f4efe4, muted #4d4232. Type: Arial Black on label tape, Georgia italic for the supporting line, Helvetica/Arial for body, Consolas for labels. Components: `.label-tape`, `.hang-tag`, a halftone image panel and hazard-bar footer. Assets: `standard-issue-wordmark.svg`, `white-shirt-cutout.svg`            |

## Ethical persuasion

Choose two applications that help the visitor make a voluntary, informed decision. Record their real implementation and mechanism rather than a principle name alone. Required size selection or validation alone does not establish consistency. Do not invent social proof, scarcity, authority, or product facts.

| Principle      | Actual copy or interaction                                                                                                                                   | Visitor benefit / factual support                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reciprocity    | "How to wear it." section on the storefront, labelled "Free tip, no purchase needed": three plain styling tips (with jeans, under an open shirt, on its own) | Useful advice given freely, with no claims about the shirt. AI proposed it; learner chose it over a similarity line, saying "the rest of the website is already bold enough" |
| Not chosen yet | Not chosen yet                                                                                                                                               | Second application still needed for BRAND-001                                                                                                                                |

## BRAND-001 — first branded storefront and live style guide

**Scope:** turn the working neutral storefront into the chosen brand's first coherent page. Keep the existing size selector and demo bag usable. Do not add checkout or all future features.

Keep when:

- The learner has chosen the audience hypotheses, brief, visual direction, and logo; the page visibly expresses those choices.
- Two annotated hero directions compare modernist/postmodernist thinking with the same content and real source links.
- The selected SVG logo works at small size and in one color; the presentations may share one asset.
- The storefront and live style guide share CSS variables, typography, components, and assets; they do not drift into separate identities.
- Two ethical persuasion applications are visible and their claims are supportable.
- Prepared checks pass, the agent has reviewed the slice and discussed one actual check, and the learner has reported a browser impression plus keyboard/mobile observations.
- The issue, branch, commit, and PR explain this feature in the learner's repository; agreed decisions and actual evidence are saved here. The learner has approved keeping and merging the change, and the merge into `main` is verified. Publishing is a separate choice.

## Evidence

Write a short result and link only evidence that exists. A passing browser check is evidence for its assertions, not customer research or proof of full accessibility.

| Spec ID   | Files                                                                                                                                                                                                                                                                                                                      | Issue / PR                                                                                   | Actual checks and observations                                                                                                                                                                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BRAND-001 | `public/index.html`, `public/styleguide.html`, `public/styles.css`, `public/assets/standard-issue-wordmark.svg`, `public/assets/white-shirt-cutout.svg`, `public/explorations/`, `docs/explorations/brand-001-heroes.md`, `tests/browser/development.spec.js` (refresh test now edits the cutout shirt the store displays) | [Issue #1](https://github.com/mnguyenht/is117-brand-assignment/issues/1); PR not created yet | 2026-10-28: `npm run check` passes (format, lint, 7/7 server, 10/10 browser incl. axe on all three pages). Run via Git Bash script shell because the lint script's single quotes fail under Windows cmd. AI viewed all three pages at 1280 and 375 px. Persuasion not built; learner observations pending |

## Later

No follow-up is selected. After keeping `BRAND-001`, choose one next cycle: perhaps a brand story, a supported fit guide, or richer demo-bag behavior. Agree its scope and add one new spec ID at that time.
