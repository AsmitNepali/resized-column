<?php

namespace Asmit\ResizedColumn;

use Asmit\ResizedColumn\Setup\Concerns\LoadResizedColumn;

trait HasResizableColumn
{
    use LoadResizedColumn;

    /**
     * Nothing here may touch $this->getTable(): Livewire boots traits in
     * declaration order, and Pint's ordered_traits rule sorts this one above
     * InteractsWithTable, so the table is not built yet. Anything needing it
     * belongs in the rendering hooks below.
     */
    public function bootedHasResizableColumn(): void
    {
        $this->loadColumnWidths();
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
