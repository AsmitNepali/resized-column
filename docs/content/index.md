---
seo:
  title: Resizable Columns for Filament
  description: Resize, reorder, and pin Filament table columns — with widths, order, and pinned selection persisted per user.
  ogImage: /og-image.png
---

::u-page-hero
#title
Resizable Columns

#description
Let users resize, reorder, and pin Filament table columns.

Widths, column order, and pinned columns persist per user — in the session or the database — and reapply on load.

#links
  :::u-button
  ---
  color: primary
  size: xl
  to: /getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: simple-icons:github
  size: xl
  to: https://github.com/AsmitNepali/resized-column
  variant: outline
  ---
  GitHub
  :::
::

<div class="text-center max-w-4xl mx-auto">

![Resizable Columns Preview](/preview.png){:zoom="false" class="mx-auto max-w-full h-auto rounded-lg shadow-lg"}

</div>

::u-page-section
#title
Why Resizable Columns?

#features
  :::u-page-feature
  ---
  icon: i-lucide-move-horizontal
  ---
  #title
  Drag to Resize

  #description
  Grab a column edge and drag. Widths persist per user and reapply on the next visit.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-grip-vertical
  ---
  #title
  Drag to Reorder

  #description
  A grip handle on each header lets users reorder columns (SortableJS). Opt-in per table.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-pin
  ---
  #title
  Sticky (Pinned) Columns

  #description
  Pin columns so they stay visible while the table scrolls horizontally — dev-declared or user-controlled.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-database
  ---
  #title
  Session or Database

  #description
  Store per user in the session (default, zero config) or the database (works across browsers and devices).
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  ---
  #title
  One Row, Everything

  #description
  Widths, order, and pinned selection share a single persisted row per user — no extra migrations.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-blocks
  ---
  #title
  Panel or Standalone

  #description
  Works inside a Filament panel and in standalone Livewire tables — same trait, same API.
  :::
::
