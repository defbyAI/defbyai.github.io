# Repository Guidelines

## Project Structure & Module Organization
This repository builds the `defby.ai` website with Astro, deploys via GitHub Pages, and serves on a custom domain.

- `src/pages/`: route-based pages (`index.astro`, `about.astro`)
- `src/components/`: reusable UI blocks
- `src/layouts/`: shared page layouts
- `public/`: static assets and `CNAME`
- `design_draft/`: design references only (not production output)
- `.github/workflows/`: CI/CD workflow for Pages deployment

Keep page logic in `src/pages/`, move repeated markup to `src/components/`, and store optimized images under `public/`.

## Build, Test, and Development Commands
- `npm ci`: install pinned dependencies for consistent CI/local builds
- `npm run dev`: start Astro local server
- `npm run build`: production build (must pass before PR merge)
- `npm run preview`: verify built output locally
- `npm run astro check`: Astro type/content checks

If scripts change, update this section in the same PR.

## Coding Style & Naming Conventions
- Use 2-space indentation in `.astro`, `.ts`, and config files.
- Component/layout files: `PascalCase` (for example, `HeroSection.astro`).
- Route files and assets: lowercase kebab-case (for example, `privacy-policy.astro`, `hero-bg.webp`).
- Prefer small, composable components over large page-level blocks.

Run formatter/lint rules defined in `package.json` before opening a PR.

## Testing Guidelines
There is no separate unit-test suite yet; quality gate is build + checks.

- Required before PR: `npm run astro check` and `npm run build`
- For UI/content changes, verify target pages in `npm run dev` and `npm run preview`
- Validate internal links, metadata, and 404 behavior for newly added routes

## Deployment & Domain (GitHub Pages + defby.ai)
- Deploy from `main` via GitHub Actions in `.github/workflows/`.
- Keep `public/CNAME` committed with `defby.ai`.
- Set `site` in `astro.config.*` to `https://defby.ai`.
- Configure DNS at domain provider for GitHub Pages and enforce one canonical host (`defby.ai` or `www`) with redirect.

Any change to deploy/domain settings must include a short PR note with the exact setting changed.

## Commit & Pull Request Guidelines
- Commit format: `type(scope): summary` (for example, `feat(home): add hero section`)
- Use focused commits per logical change
- PRs must include: purpose, changed paths, local verification commands run, and screenshots for UI updates
