# BRAND-001 hero explorations

Two hero directions for **Standard Issue** (Everyman; primary audience Alex). Both use the same shirt image, headline, supporting line, action and facts. The copy is an AI draft built from the learner's promise.

- Headline: "A white T-shirt is a white T-shirt."
- Support: "But it'll be a good white T-shirt."
- Action: "Choose your size" (links to the storefront size selector)
- Facts: White; S, M, L, XL; $28, fictional demo price

Live previews (with `npm run dev` running): [modernist](http://127.0.0.1:5173/explorations/modernist.html), [postmodernist](http://127.0.0.1:5173/explorations/postmodernist.html). Source: `public/explorations/`.

## A — Modernist

**Reference:** Josef Müller-Brockmann, _Der Film_, 1960, offset lithograph. MoMA, object 57.1960. <https://www.moma.org/collection/works/4882> (image viewed on the MoMA page, 2026-10-27).

**Design choices**

1. One dark field with a single oversized grotesk headline. Like _der Film_, the headline is set in two tones: the first half recedes in grey and the second half is white.
2. A strict 12-column grid. The brand name and the facts are small, set in one red, and aligned to the same columns as the poster's dates and venue text.
3. The shirt sits in a plain, unframed light panel, and nothing decorates it.

**Intended effect on Alex:** the page reads as organised and no-nonsense. The price and sizes are easy to find, which supports Alex's predicted move: "check the price."

**Risk:** the dark field can feel cold or premium, which works against an Everyman brand and suggests Fiona more than Alex.

## B — Postmodernist

**Reference:** Wolfgang Weingart, _Kunsthalle Basel Kunstkredit 76-77_, 1977, lithograph. MoMA, object 208.2006. <https://www.moma.org/collection/works/101455> (image viewed on the MoMA page, 2026-10-27).

**Design choices**

1. Layering. The headline sits in solid black knocked-out strips that overlap a tilted, halftone-screened shirt photo, like Weingart's stacked type bars over photography.
2. Mixed visual languages. The headline is a heavy grotesk, the support line an italic serif, and the facts a monospace "care label". That label quotes an everyday object that comes with every real T-shirt.
3. Heavy diagonal black bars in the corner, taken from the poster's striped wedges.

**Intended effect on Alex:** the page feels ordinary and familiar, like labels, tags and stamps, but with some energy. Its humour matches "a white T-shirt is a white T-shirt."

**Risk:** the busier composition may read as trying too hard, against the "nothing more, nothing less" promise. The tilted label is also harder to scan quickly.

## Checks

- Viewed at 1280×800 and 375×812 in Chromium. Copy is identical, the image loads, and neither page scrolls sideways. Two layout bugs were fixed during review: in A the headline overlapped the shirt, and in B "T-shirt" broke at its hyphen.
- Fonts are system stacks (Helvetica/Arial, Arial Black, Georgia, Consolas). No web fonts are loaded.
