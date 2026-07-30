<?php

use Asmit\ResizedColumn\ResizedColumnTableRegistry;
use Asmit\ResizedColumn\Tests\Fixtures\PintOrderedTable;
use Asmit\ResizedColumn\Tests\Fixtures\PlainTable;
use Asmit\ResizedColumn\Tests\Fixtures\StickyTable;
use Illuminate\Foundation\Auth\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

beforeEach(function () {
    ResizedColumnTableRegistry::reset();
    session()->flush();
    Asmit\ResizedColumn\ResizedColumnPlugin::getStandaloneConfig()?->preserveOnDB(false);

    $this->actingAs((new User)->forceFill(['id' => 7]));
});

it('pins dev-declared sticky columns and moves them to the front', function () {
    $component = Livewire::test(StickyTable::class);

    expect(array_keys(columnsOf($component->instance())))->toBe(['beta', 'alpha', 'gamma']);

    $beta = columnsOf($component->instance())['beta'];

    expect($beta->getExtraHeaderAttributes()['data-sticky'])->toBe('left')
        ->and($beta->getExtraHeaderAttributes()['data-sticky-locked'])->toBe('true')
        ->and($beta->getExtraHeaderAttributes()['class'])->toContain('resized-sticky')
        ->and($beta->getExtraCellAttributes()['data-sticky'])->toBe('left');
});

it('marks headers stickable when the table opts into stickableColumns', function () {
    $component = Livewire::test(StickyTable::class);

    expect(columnsOf($component->instance())['alpha']->getExtraHeaderAttributes()['data-stickable'])
        ->toBe('true');
});

it('pins a column at runtime and persists the selection', function () {
    $component = Livewire::test(StickyTable::class)
        ->call('toggleColumnSticky', 'gamma');

    expect(array_keys(columnsOf($component->instance())))->toBe(['beta', 'gamma', 'alpha'])
        ->and(columnsOf($component->instance())['gamma']->getExtraHeaderAttributes()['data-sticky'])
        ->toBe('left');

    expect(session('tables.sticky_table_columns_style')['__sticky'])
        ->toBe(['beta', 'gamma']);
});

it('unpins a user-pinned column', function () {
    $component = Livewire::test(StickyTable::class)
        ->call('toggleColumnSticky', 'gamma')
        ->call('toggleColumnSticky', 'gamma');

    expect(session('tables.sticky_table_columns_style')['__sticky'])->toBe(['beta'])
        ->and(columnsOf($component->instance())['gamma']->getExtraHeaderAttributes())
        ->not->toHaveKey('data-sticky');
});

it('refuses to unpin a dev-declared sticky column', function () {
    Livewire::test(StickyTable::class)
        ->call('toggleColumnSticky', 'beta');

    expect(array_keys(columnsOf(Livewire::test(StickyTable::class)->instance())))
        ->toBe(['beta', 'alpha', 'gamma']);
});

it('ignores sticky toggles on a table that is not stickable', function () {
    $component = Livewire::test(PlainTable::class)
        ->call('toggleColumnSticky', 'alpha');

    expect(columnsOf($component->instance())['alpha']->getExtraHeaderAttributes())
        ->not->toHaveKey('data-sticky')
        ->and(session('tables.plain_table_columns_style'))->toBeNull();
});

it('replaces the whole selection with setStickyColumns', function () {
    $component = Livewire::test(StickyTable::class)
        ->call('setStickyColumns', ['gamma', 'alpha']);

    // Dev-declared sticky columns are merged back in and lead the order.
    expect(session('tables.sticky_table_columns_style')['__sticky'])
        ->toBe(['beta', 'gamma', 'alpha'])
        ->and(array_keys(columnsOf($component->instance())))
        ->toBe(['beta', 'gamma', 'alpha']);
});

it('drops unknown column names passed to setStickyColumns', function () {
    Livewire::test(StickyTable::class)
        ->call('setStickyColumns', ['gamma', 'nope', 42]);

    expect(session('tables.sticky_table_columns_style')['__sticky'])
        ->toBe(['beta', 'gamma']);
});

it('restores a persisted sticky selection on the next mount', function () {
    session()->put('tables.sticky_table_columns_style', ['__sticky' => ['gamma']]);

    $component = Livewire::test(StickyTable::class);

    expect(array_keys(columnsOf($component->instance())))->toBe(['beta', 'gamma', 'alpha']);
});

it('persists sticky selection to the database when global preserveOnDB is enabled', function () {
    Asmit\ResizedColumn\ResizedColumnPlugin::standalone()->preserveOnDB();

    Livewire::test(StickyTable::class)
        ->call('setStickyColumns', ['gamma']);

    $setting = Asmit\ResizedColumn\Models\TableSetting::query()
        ->where('user_id', 7)
        ->where('resource', StickyTable::class)
        ->sole();

    expect($setting->styles['__sticky'])->toBe(['beta', 'gamma']);

    session()->flush();

    expect(array_keys(columnsOf(Livewire::test(StickyTable::class)->instance())))
        ->toBe(['beta', 'gamma', 'alpha']);
});

it('boots with traits in Pint order, where the table does not exist yet', function () {
    $component = Livewire::test(PintOrderedTable::class);

    expect(array_keys(columnsOf($component->instance())))->toBe(['beta', 'alpha', 'gamma'])
        ->and(columnsOf($component->instance())['beta']->getExtraHeaderAttributes()['data-sticky'])
        ->toBe('left');

    $component->call('setStickyColumns', ['gamma']);

    expect(session('tables.pint_ordered_table_columns_style')['__sticky'])
        ->toBe(['beta', 'gamma']);
});
