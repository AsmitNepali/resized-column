# Nuxt Docs + Landing Site — Design

Date: 2026-07-24
Package: `asmit/resized-column` (Filament plugin)
Repo: AsmitNepali/resized-column

## Goal

Documentation website for the `resized-column` package, built with Nuxt, styled
like the Nuxt UI Pro docs/landing template (https://landing-template.nuxt.dev/).
Scope: **full docs site** (sidebar nav, search, dark mode) **plus a landing
page** (marketing hero + feature grid).

## Stack

- Nuxt UI Pro `docs` starter template (`npx nuxi init -t github:nuxt-ui-pro/docs`).
- Nuxt 3, `@nuxt/content` (Markdown), `@nuxt/ui-pro`, built-in search + dark mode.
- Lives in the `docs/` subfolder of the package repo (isolated npm project).
- Static generation (`nuxi generate`) → output `docs/.output/public`.

## Structure

```
docs/
  nuxt.config.ts        # baseURL /resized-column/, ssr false (static)
  app.config.ts         # site title, nav, links, colors
  content/
    index.yml           # landing page (hero + features)  OR app/pages/index.vue
    docs/
      1.getting-started/
        1.installation.md
        2.usage.md
      2.features/
        1.resizing.md
        2.reordering.md
        3.sticky-columns.md
      3.storage.md
      4.standalone-livewire.md
      5.customization.md
  public/               # cover image, favicon
```

## Landing page

- Hero: title "Resizable Columns", tagline (from README intro), install command
  `composer require asmit/resized-column`, CTA buttons: "Get Started" → docs,
  "GitHub" → repo.
- Feature grid from README Features list: drag-to-resize, drag-to-reorder,
  sticky/pinned columns, user-controlled pinning, per-user persistence,
  session + DB storage, Filament panel + standalone Livewire support.
- Cover image from `images/cover.jpg`.

## Docs pages (ported from README)

| Page | Source (README section) |
|------|-------------------------|
| installation.md | Installation, Registering the Plugin, Publishing assets/migrations |
| usage.md | Usage (HasResizableColumn trait) |
| resizing.md | resize feature overview |
| reordering.md | Drag-to-Reorder Columns |
| sticky-columns.md | Sticky (Pinned) Columns |
| storage.md | Storage Configuration, config priority |
| standalone-livewire.md | Using Outside the Filament Panel (Options A/B) |
| customization.md | Configuration Options, custom DB storage, troubleshooting |

## Deploy

- GitHub Pages, static.
- `.github/workflows/docs.yml` — build on push to main, deploy `docs/.output/public`.
- `nuxt.config.ts`: `app.baseURL = '/resized-column/'`, `ssr: false`,
  `nitro.prerender` crawl links.

## Non-goals

- No changes to the PHP package or root `package.json`.
- No versioned docs, i18n, or blog.
- Docs `npm` project stays isolated in `docs/` (own package.json / lockfile).
