# Nuxt Docs + Landing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Nuxt UI Pro docs + landing site for the `asmit/resized-column` Filament package, in the `docs/` subfolder, deployable to GitHub Pages.

**Architecture:** Scaffold the official Nuxt UI Pro `docs` template into `docs/`. Landing page (hero + feature grid) is content-driven; docs pages are Markdown ported from README with an auto-generated sidebar + built-in search. Static generation, deployed to GitHub Pages under `/resized-column/`.

**Tech Stack:** Nuxt 3, `@nuxt/ui-pro`, `@nuxt/content`, Nuxt UI Pro docs template.

## Global Constraints

- Site lives entirely in `docs/`; isolated npm project (own `package.json` + lockfile). Never modify root `package.json` or the PHP package.
- baseURL = `/resized-column/` (GitHub Pages project site).
- Static only: `ssr: false` or `nuxi generate`; no runtime server.
- No commits by the agent — staging only; user commits via Polyscope UI button.
- Package name in copy: **Resizable Columns**; composer name `asmit/resized-column`; repo `https://github.com/AsmitNepali/resized-column`.
- Verification is build + render (no unit tests for content).

---

### Task 1: Scaffold the Nuxt UI Pro docs template

**Files:**
- Create: `docs/` (entire Nuxt project)

**Interfaces:**
- Produces: a working Nuxt project in `docs/` with `package.json`, `nuxt.config.ts`, `app.config.ts`, `content/` dir.

- [ ] **Step 1: Clean the stray `docs/` contents**

The current `docs/` holds only leftover `node_modules`. Remove them so the scaffold is clean, but preserve the spec/plan folder.

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
mv docs/superpowers /tmp/ps-superpowers
rm -rf docs
```

- [ ] **Step 2: Scaffold the template**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
npx nuxi@latest init docs -t github:nuxt-ui-pro/docs --packageManager npm --no-gitInit
```

Expected: `docs/` created with `nuxt.config.ts`, `app.config.ts`, `content/`, `app/`.

- [ ] **Step 3: Restore the spec/plan folder**

```bash
mv /tmp/ps-superpowers docs/superpowers
```

- [ ] **Step 4: Install dependencies**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs && npm install
```

Expected: `node_modules` populated, no fatal errors.

- [ ] **Step 5: Verify dev server boots**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs && timeout 40 npm run dev
```

Expected: Nuxt prints "Local: http://localhost:3000" before timeout kills it. If it reaches that line, PASS.

- [ ] **Step 6: Ensure docs project is gitignored appropriately**

Confirm `docs/.gitignore` (from template) ignores `node_modules`, `.nuxt`, `.output`, `dist`. If missing any, add them.

- [ ] **Step 7: Stage**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
git add docs
```

---

### Task 2: Configure site metadata, nav, and static build

**Files:**
- Modify: `docs/nuxt.config.ts`
- Modify: `docs/app.config.ts`

**Interfaces:**
- Consumes: scaffolded config files from Task 1.
- Produces: baseURL + static build config; site title "Resizable Columns"; header nav with Docs + GitHub link; footer.

- [ ] **Step 1: Read the scaffolded configs**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs
cat nuxt.config.ts app.config.ts
```

Note the exact existing keys before editing (template shape may differ from below — merge, don't blind-overwrite).

- [ ] **Step 2: Set baseURL + static prerender in `nuxt.config.ts`**

Add/merge inside `defineNuxtConfig({ ... })`:

```ts
app: {
  baseURL: '/resized-column/',
},
ssr: true,
nitro: {
  prerender: {
    crawlLinks: true,
    routes: ['/'],
    autoSubfolderIndex: false,
  },
},
```

(Static output comes from `nuxi generate`; `crawlLinks` walks the sidebar so every doc page is prerendered.)

- [ ] **Step 3: Set site identity in `app.config.ts`**

Merge into the existing `defineAppConfig({ ... })` (keep template's `ui` colors or set brand color `green`):

```ts
seo: {
  siteName: 'Resizable Columns',
},
header: {
  title: 'Resizable Columns',
  to: '/',
  links: [
    {
      icon: 'i-simple-icons-github',
      to: 'https://github.com/AsmitNepali/resized-column',
      target: '_blank',
      'aria-label': 'GitHub',
    },
  ],
},
footer: {
  credits: `MIT Licensed · © ${new Date().getFullYear()} Asmit Nepal`,
},
```

Field names vary by template version — align keys to whatever `app.config.ts` already defines (e.g. `header.links` vs `header.nav`). Match existing shape.

- [ ] **Step 4: Verify build with baseURL**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs && npx nuxi generate
```

Expected: build completes, `.output/public/` created, no errors. Prerendered HTML references `/resized-column/` asset paths.

- [ ] **Step 5: Stage**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
git add docs/nuxt.config.ts docs/app.config.ts
```

---

### Task 3: Build the landing page

**Files:**
- Modify or Create: `docs/content/index.yml` (or `docs/app/pages/index.vue` if the template is component-driven — check which the scaffold uses)
- Reference: cover image (added in Task 5)

**Interfaces:**
- Consumes: Nuxt UI Pro landing components (`UPageHero`, `UPageSection`, `UPageFeature`, `UButton`) already available from the template.
- Produces: `/` landing route with hero + feature grid.

- [ ] **Step 1: Determine landing mechanism**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs
ls content app/pages 2>/dev/null
cat content/index.yml 2>/dev/null || cat app/pages/index.vue 2>/dev/null
```

If `content/index.yml` exists → edit it (content-driven). Else edit `app/pages/index.vue`.

- [ ] **Step 2: Write the hero + features (content-driven `index.yml` form)**

```yaml
title: Resizable Columns for Filament
description: Resize, reorder, and pin Filament table columns — with per-user persistence across sessions and devices.
hero:
  links:
    - label: Get Started
      to: /getting-started/installation
      icon: i-lucide-arrow-right
      trailing: true
      size: xl
    - label: GitHub
      to: https://github.com/AsmitNepali/resized-column
      icon: i-simple-icons-github
      size: xl
      color: neutral
      variant: subtle
      target: _blank
  cta:
    label: composer require asmit/resized-column
    icon: i-lucide-terminal
sections:
  - title: Everything users want from a table
    features:
      - title: Drag to resize
        description: Users drag column borders to set widths that stick.
        icon: i-lucide-move-horizontal
      - title: Drag to reorder
        description: Grip handle on each header reorders columns, persisted per user.
        icon: i-lucide-grip-vertical
      - title: Sticky (pinned) columns
        description: Pin columns so they stay visible while scrolling horizontally.
        icon: i-lucide-pin
      - title: User-controlled pinning
        description: A Filament-styled "Pin columns" dropdown lets users pin/unpin themselves.
        icon: i-lucide-list-checks
      - title: Persists per user
        description: Widths, order, and pins share one row — session or database storage.
        icon: i-lucide-database
      - title: Panels & standalone Livewire
        description: Works in Filament panels and in plain Livewire components without a panel.
        icon: i-lucide-layers
```

If the template is component-driven, port the same content into `app/pages/index.vue` using `<UPageHero>` + `<UPageGrid>`/`<UPageFeature>`. Keep identical copy.

- [ ] **Step 3: Verify landing renders**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs && timeout 40 npm run dev
```

Open http://localhost:3000/ — hero title, install command, two buttons, six feature cards visible.

- [ ] **Step 4: Stage**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
git add docs/content docs/app 2>/dev/null; true
```

---

### Task 4: Port README into docs pages

**Files:**
- Create: `docs/content/1.getting-started/1.installation.md`
- Create: `docs/content/1.getting-started/2.usage.md`
- Create: `docs/content/2.features/1.resizing.md`
- Create: `docs/content/2.features/2.reordering.md`
- Create: `docs/content/2.features/3.sticky-columns.md`
- Create: `docs/content/3.storage.md`
- Create: `docs/content/4.standalone-livewire.md`
- Create: `docs/content/5.customization.md`
- Delete: any template sample docs under `docs/content/` (e.g. `1.getting-started/*` demo files, `2.essentials/`) that are not ours.

**Interfaces:**
- Consumes: `@nuxt/content` numeric-prefix ordering → sidebar order. Each file needs frontmatter `title` + `description`.
- Produces: 8 docs routes with an auto-generated sidebar and working search.

- [ ] **Step 1: Remove template sample content**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs/content
ls -R
# delete every sample doc EXCEPT index.yml and the superpowers folder is under docs/ root, not content/
rm -rf 1.getting-started 2.essentials 3.* index.md 2>/dev/null; true
mkdir -p 1.getting-started 2.features
```

- [ ] **Step 2: `1.getting-started/1.installation.md`**

````md
---
title: Installation
description: Install the package, register the plugin, and publish assets.
---

## Install via Composer

```bash
composer require asmit/resized-column
```

## Register the plugin

Add the plugin to your Filament panel in `app/Providers/Filament/AdminPanelProvider.php`:

```php
use Asmit\ResizedColumn\ResizedColumnPlugin;

public function panel(Panel $panel): Panel
{
    return $panel
        // ... other configuration
        ->plugins([
            ResizedColumnPlugin::make()
                ->preserveOnDB() // Enable database storage (optional)
        ]);
}
```

## Publish Filament assets

```bash
php artisan filament:assets
```

## Publish and run migrations

Only needed if you use database storage.

```bash
php artisan vendor:publish --provider="Asmit\ResizedColumn\ResizedColumnServiceProvider" --tag=resized-column-migrations
php artisan migrate
```
````

- [ ] **Step 3: `1.getting-started/2.usage.md`**

````md
---
title: Usage
description: Enable resizable columns with the HasResizableColumn trait.
---

Add the `HasResizableColumn` trait to your Filament List page or custom page class. This enables the resizable column feature for all tables on that page.

```php
use Asmit\ResizedColumn\HasResizableColumn;

class ListUsers extends ListRecords
{
    use HasResizableColumn;

    protected static string $resource = UserResource::class;

    // Your existing table definition...
}
```
````

- [ ] **Step 4: `2.features/1.resizing.md`**

````md
---
title: Resizing Columns
description: Drag column borders to resize; widths persist per user.
---

Once the `HasResizableColumn` trait is on your page, every column becomes resizable. Drag a column's border to set its width. Widths are saved per user (session by default, or database) and reapplied on the next visit.

See [Storage](/storage) to control where widths are saved.
````

- [ ] **Step 5: `2.features/2.reordering.md`**

````md
---
title: Reordering Columns
description: Let users drag columns into a new order.
---

Chain `->dragReorderableColumns()` on the table (opt-in per table). A grip handle appears on each column header; drag it to reorder. The order persists per user and is reapplied on load.

```php
public function table(Table $table): Table
{
    return $table
        ->columns([
            TextColumn::make('name'),
            TextColumn::make('email'),
        ])
        ->dragReorderableColumns();
}
```

::note
Sticky columns are excluded from dragging, and a column cannot be dropped before a sticky one. Reorder currently supports flat column tables (no column groups).
::
````

- [ ] **Step 6: `2.features/3.sticky-columns.md`**

````md
---
title: Sticky (Pinned) Columns
description: Pin columns so they stay visible during horizontal scroll.
---

## Dev-declared default

Mark a column sticky with `->sticky()`:

```php
TextColumn::make('name')->sticky();
```

## User-controlled pinning

Enable `->stickableColumns()` on the table to let users pin/unpin columns themselves via a **"Pin columns" dropdown** in the toolbar (next to the column-manager icon). Any `->sticky()` calls seed the initial selection; once a user changes it, their choice is remembered.

```php
public function table(Table $table): Table
{
    return $table
        ->columns([
            TextColumn::make('name')->sticky(), // pinned by default
            TextColumn::make('email'),
            TextColumn::make('created_at'),
        ])
        ->dragReorderableColumns()
        ->stickableColumns();
}
```

The user's pinned selection persists per user (session + database) alongside widths and order — no extra migration. Sticky is left-pin only in the current version.
````

- [ ] **Step 7: `3.storage.md`**

````md
---
title: Storage
description: Session vs database storage, and configuration priority.
---

The package provides two storage mechanisms:

1. **Session storage** (default) — stores settings in the user's session. No database required. Browser/device specific.
2. **Database storage** (optional) — stores settings in the database. Requires the `table_settings` migration. Works across browsers/devices for the same user.

Enable database storage in your panel configuration:

```php
ResizedColumnPlugin::make()
    ->preserveOnDB(true) // Enable database storage
```

## Configuration priority

When deciding whether to save to the database, the package checks configuration in this order. **The first match wins.**

| Priority | Method | Scope |
|----------|--------|-------|
| **1 — Highest** | `->preserveColumnWidthsInDatabase()` table macro | Single table only |
| **2** | `ResizedColumnPlugin::standalone()` in `AppServiceProvider` | All components, no panel required |
| **3 — Lowest** | `ResizedColumnPlugin::make()` in panel provider | Inside a Filament panel |
````

- [ ] **Step 8: `4.standalone-livewire.md`**

````md
---
title: Standalone Livewire
description: Use resizable columns in Livewire components without a Filament panel.
---

Filament tables can be used in any Livewire component without a panel, and this package fully supports that. Add the `HasResizableColumn` trait just as you would inside a panel.

```php
use Asmit\ResizedColumn\HasResizableColumn;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Livewire\Component;

class UsersTable extends Component implements HasForms, HasTable
{
    use InteractsWithForms;
    use InteractsWithTable;
    use HasResizableColumn;

    public function table(Table $table): Table
    {
        return $table
            ->query(User::query())
            ->columns([
                TextColumn::make('name'),
                TextColumn::make('email'),
            ]);
    }

    public function render(): View
    {
        return view('livewire.users-table');
    }
}
```

## Enabling database storage outside the panel

There's no `AdminPanelProvider` here, so use one of two options.

### Option A — App-wide via `AppServiceProvider`

Call `ResizedColumnPlugin::standalone()` once in `AppServiceProvider::boot()`. This stores a shared config for the whole request that every `HasResizableColumn` component picks up automatically.

```php
// app/Providers/AppServiceProvider.php
use Asmit\ResizedColumn\ResizedColumnPlugin;

public function boot(): void
{
    ResizedColumnPlugin::standalone()
        ->preserveOnDB();

    // Optionally disable session storage app-wide:
    // ResizedColumnPlugin::standalone()->preserveOnDB()->preserveOnSession(false);
}
```

### Option B — Per table via table macro

Chain `->preserveColumnWidthsInDatabase()` at the end of your `table()` method. Only affects that table; overrides global config.

::warning
Always call this as the **last** method in the chain, after `->columns()`, `->filters()`, `->actions()`, and all other table configuration. This ensures the Livewire component reference is fully resolved when the macro runs.
::

```php
public function table(Table $table): Table
{
    return $table
        ->query(User::query())
        ->columns([
            TextColumn::make('name'),
            TextColumn::make('email'),
        ])
        ->filters([...])
        ->actions([...])
        ->preserveColumnWidthsInDatabase();   // ← always last
}
```

Combine both macros for full per-table control:

```php
->preserveColumnWidthsInDatabase()      // save to DB
->preserveColumnWidthsInSession(false)  // disable session for this table
```
````

- [ ] **Step 9: `5.customization.md`**

````md
---
title: Customization & Troubleshooting
description: Override storage methods, custom database storage, and fixes.
---

## Configuration options

Override any of these methods in your class to customize behavior:

| Method | Description |
|--------|-------------|
| `persistColumnWidthsToDatabase()` | Customize how column widths are saved to the database |
| `persistColumnWidthsToSession()` | Customize how column widths are saved to the session |
| `loadColumnWidthsFromDatabase()` | Customize how column widths are loaded from the database |
| `loadColumnWidthsFromSession()` | Customize how column widths are loaded from the session |
| `getUserId()` | Customize how user identification is handled |

## Example: custom database storage

```php
use Asmit\ResizedColumn\HasResizableColumn;

class ListUsers extends ListRecords
{
    use HasResizableColumn;

    protected function persistColumnWidthsToDatabase(): void
    {
        YourCustomModel::updateOrCreate(
            [
                'user_id' => $this->getUserId(),
                'resource' => $this->getResourceModelFullPath(), // e.g. 'App\Models\User'
            ],
            ['settings' => $this->columnWidths]
        );
    }
}
```

## Troubleshooting

### CSS styles not loading

If the resize handles don't display correctly:

1. Publish the Filament assets:
   ```bash
   php artisan filament:assets
   ```
2. Clear your browser cache or hard refresh (Ctrl+F5).
````

- [ ] **Step 10: Verify sidebar, pages, and search**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs && timeout 45 npm run dev
```

Open http://localhost:3000/getting-started/installation — page renders, sidebar lists all 8 pages in order, search (Cmd+K) finds "sticky". Check no 404s on the nav links.

- [ ] **Step 11: Stage**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
git add docs/content
```

---

### Task 5: Add cover image and favicon

**Files:**
- Create: `docs/public/cover.jpg` (copy of root `images/cover.jpg`)
- Modify: landing page to reference `/cover.jpg` (baseURL-prefixed automatically by Nuxt `<NuxtImg>`/asset handling)
- Optional: `docs/public/favicon.ico`

**Interfaces:**
- Consumes: existing `images/cover.jpg` at repo root.
- Produces: hero/preview image on landing page.

- [ ] **Step 1: Copy the cover image**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
cp images/cover.jpg docs/public/cover.jpg
```

- [ ] **Step 2: Reference it in the landing hero**

In `content/index.yml` (or `index.vue`), add under `hero:`:

```yaml
  image: /cover.jpg
```

(For component-driven templates, add `<img src="/cover.jpg">` inside the hero slot. Nuxt prefixes `baseURL` for `public/` assets at build time.)

- [ ] **Step 3: Verify image loads in dev and in generate**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs && npx nuxi generate
ls .output/public/cover.jpg
```

Expected: file present in output; landing shows the image.

- [ ] **Step 4: Stage**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
git add docs/public docs/content docs/app 2>/dev/null; true
```

---

### Task 6: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/docs.yml`

**Interfaces:**
- Consumes: `docs/` static build via `npm run generate`.
- Produces: GH Pages deployment of `docs/.output/public` on push to `main`.

- [ ] **Step 1: Confirm the generate script exists**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs
grep -E '"generate"|"build"' package.json
```

If no `generate` script, add `"generate": "nuxi generate"` to `docs/package.json` scripts.

- [ ] **Step 2: Write the workflow**

```yaml
# .github/workflows/docs.yml
name: Deploy docs to GitHub Pages

on:
  push:
    branches: [main]
    paths: ['docs/**', '.github/workflows/docs.yml']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: docs
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: docs/package-lock.json
      - run: npm ci
      - run: npm run generate
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.output/public

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify workflow YAML is valid**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/docs.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 4: Stage**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak
git add .github/workflows/docs.yml docs/package.json
```

---

### Task 7: Final full-build verification

**Files:** none (verification only)

- [ ] **Step 1: Clean build from scratch**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs
rm -rf .nuxt .output
npm run generate
```

Expected: build succeeds, `.output/public/index.html` and each docs page HTML exist.

- [ ] **Step 2: Confirm baseURL in output**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs
grep -o '/resized-column/_nuxt' .output/public/index.html | head -1
```

Expected: matches (assets are prefixed with `/resized-column/`).

- [ ] **Step 3: Serve output and spot-check**

```bash
cd /Users/asmit/.polyscope/clones/3dd7ed13/tropic-yak/docs
timeout 20 npx serve .output/public -l 4000
```

Note: static server won't apply baseURL routing; use dev server for full nav check. This step only confirms files serve without crashing.

- [ ] **Step 4: Report**

Summarize: landing renders, 8 docs pages render, sidebar + search work, static build clean, workflow valid. Hand back to user to commit via Polyscope and enable GitHub Pages (Settings → Pages → Source: GitHub Actions).

---

## Notes for the implementer

- Nuxt UI Pro template internals (config key names, whether landing is `index.yml` or `index.vue`, sample content layout) vary by template version. **Always read the scaffolded files first** (Task 1 output) and adapt the exact keys — the code blocks here are the target content, not a guarantee of the template's current shape.
- `::note` / `::warning` are `@nuxt/content` MDC callout components shipped with the template. If a callout name errors, check the template's available prose components and swap to the equivalent.
- Do not commit — stage only. The user commits via Polyscope.
