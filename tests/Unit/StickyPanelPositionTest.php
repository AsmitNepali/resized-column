<?php

use Asmit\ResizedColumn\ResizedColumnTableRegistry;
use Asmit\ResizedColumn\StickyPanel;
use Asmit\ResizedColumn\Tests\Fixtures\StickyTable;
use Filament\Tables\Filters\Filter;
use Livewire\Livewire;

beforeEach(function () {
    ResizedColumnTableRegistry::reset();
    session()->flush();
});

/*
 * Filament gates the column-manager trigger position behind
 * `$hasFiltersTrigger || $hasColumnManager`. When neither holds, the package
 * has to fall back to the search position or the panel never renders.
 */
it('reports no column manager trigger for a table with no filters or toggleable columns', function () {
    $table = Livewire::test(StickyTable::class)->instance()->getTable();

    expect(StickyPanel::rendersColumnManagerTrigger($table))->toBeFalse();
});

it('reports a column manager trigger once the table has one', function () {
    $table = Livewire::test(StickyTable::class)->instance()->getTable();

    $table->columnManager();

    expect(StickyPanel::rendersColumnManagerTrigger($table))->toBeTrue();
});

it('reports a column manager trigger for a table with a filters dropdown', function () {
    $table = Livewire::test(StickyTable::class)->instance()->getTable();

    $table->filters([Filter::make('active')]);

    expect(StickyPanel::rendersColumnManagerTrigger($table))->toBeTrue();
});
