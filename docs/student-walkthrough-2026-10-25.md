# Full student walkthrough — October 25, 2026

The assignment was implemented in a new template copy and fresh SSH clone: [completed trial and conversation evidence](https://github.com/kaw393939/is117-brand-studio-trial-1025/pull/2). The instructor template remains neutral and unfinished.

**Method:** a separate agent supplied short simulated learner replies. The coach used real files, terminal Git, sources, browser controls, checks, commits and GitHub delivery. Existing class SSH and Node setup were used; this was not a new student account or clean operating-system setup. ChatGPT desktop's project-picker UI was not controlled. No real student or customer participated, so this is a practical walkthrough, not evidence of learning or audience response.

## What the whole exercise revealed

The sequence could produce persona hypotheses, a brand brief, two researched visual studies, a revised SVG wordmark, a shared live guide and a working branded page. The useful learning moments were specific disagreements and observations: the simulated learner rejected copy that felt like a campus campaign, interpreted an icon as wedding rings, preferred one composition for its café feeling, and noticed that the phone layout hid the shirt until after the purchase controls.

| Friction                                                              | Instruction or implementation correction                                                                                                  |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| The first feature sounded smaller than its deliverables.              | Name it the first branded storefront and live style guide, and state the scope before agreeing to it.                                     |
| Decisions and previews could be saved before Git work began.          | Create the learner's issue and branch immediately after scope agreement.                                                                  |
| Persona and logo instructions could expand into unnecessary projects. | One primary need leads; the secondary supplies one contrasting check. A simple wordmark and useful size/color presentations are enough.   |
| A/B choices initially required opening separate text links.           | Present the current renders together or as paired screenshots at matching viewports, with live links.                                     |
| A missing typography class survived lint.                             | AI must inspect actual fonts, content, images and controls before presenting the comparison; refresh screenshots when code changes.       |
| Required size validation was an overly loose persuasion example.      | Require an explained mechanism and visitor benefit; ordinary validation alone does not establish consistency.                             |
| Shared CSS did not automatically update a guide's written examples.   | Compare actual logo, type, color roles, controls and voice; distinguish baseline checks from branding completion.                         |
| “Approved” and “keep” left the approver and delivery state unclear.   | The learner reviews the concrete PR and decides whether to merge; no outside class reviewer is required. Publishing is a separate choice. |
| Copied README/status wording could become false after completion.     | Update the student's opening status and own deployment link. A new chat reads the actual SPEC stage and resumes instead of restarting.    |

An image-access fallback was added so a caption cannot be mistaken for visual inspection. The starter's one-color logo preview now uses a flat black treatment rather than grayscale. None of these changes supplies a finished student brand.

The final publishing check found that terminal Git was authenticated while the browser was signed out: the repository's Pages settings returned a 404. The README now explains the separate browser login. Publishing in this trial used the authenticated GitHub CLI; the signed-in settings UI was not verified.

## Checks and judgment did different jobs

The fresh copy passed installation and all 13 baseline cases. The completed trial passed formatting/lint, four server integration cases and twelve Chromium cases. Additional checks covered the studies' matching offer, their working controls, rendered identity agreement between shop and guide, and the phone shopping flow.

The first phone layout still put the product below the purchase panel despite passing functional tests. Reviewing the actual 375px screenshot exposed that mismatch with the visitor's task. The revised compact product preview appears before size selection, with a regression check for that ordering. This is a concrete reason to combine deterministic checks with visual review; neither proves customer response or complete accessibility.

Computer Use verified the keyboard journey from Skip to content through size M and Add. In role-play, the learner distinguished focus from selection and explained that a negative test must check both the error message and the unchanged bag count. The dialogue, original and revised screenshots, source references and actual command evidence remain in the trial repository, with simulated statements labeled.

## Remaining limits

The walkthrough shows that the project can be completed and that its instructions can guide meaningful revisions. It cannot tell us whether actual students will make independent choices, find the outfit advice useful, or stay engaged. The short coaching path still depends on the agent honoring real pauses and offering a small example when the learner is unsure. A class pilot would test that assumption.

In the final role-play debrief, the simulated learner said they could mostly react to AI proposals and keep saying yes without understanding the archetype or persuasion mechanism. The coach instructions now replace one yes/no approval with the learner's explanation of how an actual proposed element helps their visitor. That prompt can expose a weak connection; it does not itself establish understanding or transfer to the next feature.

See the trial PR for actual merge, CI and publication evidence. The instructor fix is tracked in [issue #3](https://github.com/kaw393939/is117-brand-studio/issues/3).
