<?php

namespace Asmit\ResizedColumn\Tests\Fixtures;

use Filament\Tables\Table;

/**
 * Opts into database persistence via the ->preserveColumnWidthsInDatabase() macro.
 */
class DatabaseTable extends PlainTable
{
    public function table(Table $table): Table
    {
        return parent::table($table)
            ->dragReorderableColumns()
            ->preserveColumnWidthsInDatabase();
    }
}
