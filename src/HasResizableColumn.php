<?php

namespace Asmit\ResizedColumn;

use Asmit\ResizedColumn\Setup\Concerns\LoadResizedColumn;

trait HasResizableColumn
{
    use LoadResizedColumn;

    public function bootedHasResizableColumn(): void
    {
        $this->loadColumnWidths();

        $this->seedStickyDefaults();
    }

    /**
     * Apply layout here (not in boot) so table() has already registered
     * ->dragReorderableColumns() / ->stickableColumns() on the registry.
     */
    public function rendering(): void
    {
        $this->applyResizedColumnLayout();
    }

    /**
     * Livewire trait hook — mirrors rendering() so layout is reapplied even
     * when only the trait hook path is invoked.
     */
    public function renderingHasResizableColumn(): void
    {
        $this->applyResizedColumnLayout();
    }
}
