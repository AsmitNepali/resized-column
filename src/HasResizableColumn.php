<?php

namespace Asmit\ResizedColumn;

use Asmit\ResizedColumn\Setup\Concerns\LoadResizedColumn;

trait HasResizableColumn
{
    use LoadResizedColumn;

    public function bootedHasResizableColumn(): void
    {
        $this->loadColumnWidths();

        $this->applyColumnOrder();

        $this->seedStickyDefaults();

        $this->applyAllColumnAttributes();
    }
}
