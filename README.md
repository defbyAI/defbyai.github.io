defbyai.github.io
==================

A simple website for `defby.ai`

## zeroPL introduction draft

`/en/zeropl/` (English) and `/ko/zeropl/` (Korean) share
`src/components/zeropl/ProductPage.astro` and copy in `src/data/zeropl.ts`.
The page introduces on-device translation, iPhone Duo layouts,
web video, AirPlay, PiP, background playback, network drives, and gestures.
The home page product link and the general entry at `/zeropl/` use the first
supported language in the browser’s preference list, with English as the fallback.
Choosing EN or 한국어 saves that preference. Auto restores the browser setting.
Explicit language URLs can be shared and language switches retain the current section.

The hero plays a seven-second silent excerpt of Cosmos Laundromat as iPhone Duo
unfolds from portrait to landscape. The replay button starts the scene again. The platform
comparison uses the same Big Buck Bunny frame at 01:07 on Mac, iPad, and iPhone
Duo. The title video and device captures follow the system’s light or dark appearance
and update when it changes. The Mac player uses a dark appearance in both system modes.
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
system appearance changes during playback, language links, and reduced-motion mode.

## twoRT introduction draft

The English `/en/twort/` and Korean `/ko/twort/` routes share a product page.
The general entry at `/twort/` uses the same browser or saved language preference
as zeroPL. Both products keep the section and query string when switching languages.
The opening animation unfolds iPhone Duo, then places it next to a 21.5-inch
16:9 monitor at the same scale. The Duo shows field notes and the monitor shows
a separate photo editor. Run `node scripts/twort-duo-title/render.mjs` with
Chrome, FFmpeg, and ImageMagick to rebuild the four language and appearance
variants. The five illustrated postures follow `DuoSessionLayout` in twoRT’s
`DuoRemoteSession.swift` when “Match device aspect
ratio” is selected. A sixth tab shows the seated Duo with its lower trackpad
and a 60-key keyboard. The WebGL model uses the same millimetre scale as the Duo,
with a 294 × 110 mm footprint and 19.05 mm key pitch.
The keyboard finish and illustrated app screens follow the system appearance.
[PFU specifications](https://www.pfu.ricoh.com/hhkeyboard/brochures/hhkb-series.pdf)
The USB-C monitor demo follows the four modes in `ExternalDisplayArrangement.swift`
and their output routing in `ClientExternalDisplay.swift`. Each mode places the
unfolded landscape Duo on the left, scaled against the 21.5-inch monitor on the right.
The camera and microphone demo shows a call on the connected Mac using the iPhone
or iPad for video and audio. Its two portraits are AI-generated and labeled in
the demo. The status bar uses the unfolded Notes example from the
[Apple iPhone Duo design guide](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo#Dynamic-layouts).
The coast photographs were also generated for the site. The icon is from twoRT's
`design/app-icon/production/guest/guest-default.png`. The
optimized assets live in `public/twort/`. The setup section links to the
[official Connect releases](https://github.com/defbyAI/twoRT-Connect/releases/latest).

## twoRT privacy policy

`src/data/twort-privacy.json` holds the supplied Korean and English publication
copy for twoRT and twoRT Connect. The product footers link to the corresponding
language at `/twort/privacy#ko` and `/twort/privacy#en`. Opening
`/twort/privacy` without a language anchor uses the shared language preference.

Before publication, the operator needs to supply the publisher’s public name
and the same effective date in both languages. The Gmail contact, person
handling privacy requests, and retention and deletion terms for support mail
and attachments also need confirmation. Review provider contracts and actual
processing locations for applicable disclosures, including hosting, mail and
the Google Fonts requests made by the site.

## zeroPL privacy policy

`src/pages/zeropl/privacy.astro` builds the public `/zeropl/privacy` route.
It uses the site's logo, Asta Sans typography, and shared palette with an ivory background.
Korean and English policies are rendered as static HTML. The bare policy URL uses
the product language preference. Language-specific section links open the matching
policy. Both complete policies remain available without JavaScript.

`src/data/zeropl-privacy.json` mirrors the approved app resource at
`zeropl/Sources/ZeroplCore/Resources/privacy-policy.json`. When the app policy
changes, copy the reviewed JSON into this repository and review the introductory
summaries in the page. The effective date, contact, and canonical URL come from
the JSON. The site does not need the app repository to build.

Run `npm run astro check` and `npm run build`, then inspect `/zeropl/privacy`
with `npm run preview`. GitHub Pages publishes the route when the branch is
merged into `main` and its existing deployment workflow succeeds.
