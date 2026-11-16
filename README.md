defbyai.github.io
==================

A simple website for `defby.ai`

## zeroPL introduction draft

`/zeropl/` (English) and `/ko/zeropl/` (Korean) share
`src/components/zeropl/ProductPage.astro` and copy in `src/data/zeropl.ts`.
The page introduces on-device translation, iPhone Duo layouts,
web video, AirPlay, PiP, background playback, network drives, and gestures.
The home page links to both languages.

The hero shows Cosmos Laundromat in the installed Mac player. The platform
comparison uses the same Big Buck Bunny frame at 01:07 on Mac, iPad, and iPhone
Duo. Use the Light and Dark controls to switch the physical mobile captures
across the page. The Mac player uses a dark appearance in both system modes.
The translation demo is a 19-second recording of zeroPL on macOS. It includes
Sintel's English dialogue and the Korean subtitles generated during playback.
The browser demo shows Big Buck Bunny in the built-in browser and mini-player
on iPhone Duo.

Optimized app captures are in `public/zeropl/captures/`. Film excerpts, posters,
and caption assets are in `public/zeropl/media/`. Each demo links to the bilingual film credits section,
including the original attribution, CC BY 3.0 license, selected range, and edits.
See [MEDIA-LICENSES.md](MEDIA-LICENSES.md) for exact sources and preparation notes.
The icon comes from zeroPL's `Resources/AppIcon/zeropl.png`. No external app
repository or remote media is needed to build. Store/download links await
confirmed URLs.

The Duo section animates five poses with a Three.js foldable model and real
light and dark app captures. Scroll through the section or select a pose with
the buttons. The renderer loads near the section and adapts to display density
and zoom. Reduced motion uses manual capture switching, and short viewports
keep the pose controls in the normal page flow.
The default captures, Sintel recording, and film credits are available
without JavaScript.

Run `npm run astro check` and `npm run build`. Inspect both routes in
`npm run dev` and `npm run preview`, including narrow widths, keyboard selection,
the Light and Dark switch, language links, and reduced-motion mode.

## zeroPL privacy policy

`src/pages/zeropl/privacy.astro` builds the public `/zeropl/privacy` route.
It uses the site's logo, Asta Sans typography, and shared palette with an ivory background.
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
