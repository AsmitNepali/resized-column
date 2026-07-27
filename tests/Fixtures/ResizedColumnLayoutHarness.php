<?php

namespace Asmit\ResizedColumn\Tests\Fixtures;

use Asmit\ResizedColumn\HasResizableColumn;
use Filament\Support\Contracts\TranslatableContentDriver;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Livewire\Component;

class ResizedColumnLayoutHarness extends Component implements HasTable
{
    use HasResizableColumn;
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
                TextColumn::make('beta'),
                TextColumn::make('gamma'),
            ])
            ->dragReorderableColumns();
    }

    public function bootTable(): void
    {
        $this->table = $this->table(Table::make($this));
    }

    public function rebuildTable(): void
    {
        $this->bootTable();
    }

    /**
     * @param  list<string>  $order
     */
    public function setColumnOrderForTest(array $order): void
    {
        $this->columnOrder = $order;
    }

    public function applyLayoutForTest(): void
    {
        $this->applyResizedColumnLayout();
    }

    public function render(): string
    {
        return '<div></div>';
    }
}
