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
 * Traits in alphabetical order, which is what Laravel Pint's ordered_traits
 * rule writes: HasResizableColumn boots before InteractsWithTable has built
 * the table. Nothing in the boot path may depend on getTable().
 */
class PintOrderedTable extends Component implements HasActions, HasSchemas, HasTable
{
    use HasResizableColumn;
    use InteractsWithActions;
    use InteractsWithSchemas;
    use InteractsWithTable;

    public function makeFilamentTranslatableContentDriver(): ?TranslatableContentDriver
    {
        return null;
    }

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

    public function render(): string
    {
        return '<div></div>';
    }
}
