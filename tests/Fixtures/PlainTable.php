<?php

namespace Asmit\ResizedColumn\Tests\Fixtures;

use Asmit\ResizedColumn\HasResizableColumn;
use Filament\Actions\Concerns\InteractsWithActions;
use Filament\Actions\Contracts\HasActions;
use Filament\Schemas\Concerns\InteractsWithSchemas;
use Filament\Schemas\Contracts\HasSchemas;
use Filament\Support\Contracts\TranslatableContentDriver;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Livewire\Component;

/**
 * Default configuration: session persistence, no reorder, no sticky.
 *
 * HasResizableColumn is declared last, as the README prescribes: its booted
 * hook reads getTable(), so InteractsWithTable must boot first.
 */
class PlainTable extends Component implements HasActions, HasSchemas, HasTable
{
    use InteractsWithActions;
    use InteractsWithSchemas;
    use InteractsWithTable;
    use HasResizableColumn;

    public function makeFilamentTranslatableContentDriver(): ?TranslatableContentDriver
    {
        return null;
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('alpha'),
                TextColumn::make('beta'),
                TextColumn::make('gamma'),
            ]);
    }

    public function render(): string
    {
        return '<div></div>';
    }
}
