# Starter review — October 25, 2026

This is instructor maintenance evidence, not a completed student assignment or a study of student learning. `BRAND-001` and the learner's brand decisions remain pending in the template.

## Actual checks

- `npm ci` / locked dependency installation: verified during release preparation.
- `npm run check`: formatting, ESLint, HTML validation, Stylelint, four server integration cases, and nine Chromium browser cases pass locally.
- Browser cases cover missing-size feedback, adding valid sizes, emptying the bag, keyboard controls, all three pages' local links/assets and automated axe checks, and 375px layouts without horizontal overflow.
- Computer Use browser review exercised missing-size feedback, selecting M, adding an item, and clearing the bag. The storefront, live style guide, and studio overview were visually inspected.
- These checks do not establish complete accessibility, customer response, or branding quality.

## Coaching simulation

A separate reviewer read the actual coaching instructions and traced hypothetical learner replies. No real student participated, and the simulation did not create a completed brand or claim human browser observations.

| Simulated reply                                        | Expected useful response                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| “I don't know; make it professional.”                  | Offer one concrete audience hypothesis, then wait for a keep-or-adjust decision.                              |
| “Explorer means green mountains; say only three left.” | Separate brand character from visual choices; reject unsupported scarcity and ask about the intended meaning. |
| “I like A; do the whole site.”                         | Keep the real choice, resolve the smallest missing brand decision, then implement the agreed slice.           |
| “Looks good.”                                          | Ask for one visible detail; do not invent keyboard, mobile, or customer evidence.                             |

The trace could connect a hypothetical audience to a brief, same-copy previews, a logo choice, and interface decisions without requiring approval of every CSS value. Actual previews, sources, checks, and learner observations would still be required before keeping a student feature.

## Friction fixed

- Matched the documented Node requirement to the supported dependency engines.
- Allowed the coach to propose compact cards from actual replies, label assumptions, and ask for correction instead of conducting a field-by-field interview.
- Aligned the studio's six numbered stages with the README.
- Made the two persuasion applications consistent across the site and instructions.
- Renamed the instructor's link “SPEC template”; learner decisions belong in their local copy.
- Kept student issues/PRs in their own repository and added a guard against pushing a solution to the instructor template.
- Split overview-only CSS from the shared storefront/style-guide styles.
- Configured HTML validation to cooperate with Prettier rather than reporting conflicting formatting demands.

## Release verification

Fresh SSH-clone and hosted deployment results are recorded in the release pull request. The README remains the only student onboarding path.
