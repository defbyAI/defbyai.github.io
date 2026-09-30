defbyai.github.io
==================

A simple website for `defby.ai`

## zeroPL privacy policy

`src/pages/zeropl/privacy.astro` builds the public `/zeropl/privacy` route.
It uses the site's logo, Asta Sans typography, gray background, and green accents.
Korean and English policies are rendered as static HTML; JavaScript enhances the
language switch, while both complete policies remain available without it.

`src/data/zeropl-privacy.json` mirrors the approved app resource at
`zeropl/Sources/ZeroplCore/Resources/privacy-policy.json`. When the app policy
changes, copy the reviewed JSON into this repository and review the introductory
summaries in the page. The effective date, contact, and canonical URL come from
the JSON. The site does not need the app repository to build.

Run `npm run astro check` and `npm run build`, then inspect `/zeropl/privacy`
with `npm run preview`. GitHub Pages publishes the route when the branch is
merged into `main` and its existing deployment workflow succeeds.
