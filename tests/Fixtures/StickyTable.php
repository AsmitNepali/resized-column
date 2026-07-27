<?php

namespace Asmit\ResizedColumn\Tests\Fixtures;

use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

/**
 * User-controlled pinning (->stickableColumns()) with one dev-declared
 * sticky column (beta) that users may not unpin.
 */
class StickyTable extends PlainTable
{
    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('alpha'),
                TextColumn::make('beta')->sticky(),
                TextColumn::make('gamma'),
            ])
            ->stickableColumns();
    }
}
