<?php

use Asmit\ResizedColumn\Models\TableSetting;
use Asmit\ResizedColumn\ResizedColumnTableRegistry;
use Asmit\ResizedColumn\Tests\Fixtures\DatabaseTable;
use Asmit\ResizedColumn\Tests\Fixtures\PlainTable;
use Illuminate\Foundation\Auth\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

beforeEach(function () {
    ResizedColumnTableRegistry::reset();
    session()->flush();

    // Settings rows are keyed by Auth::id(), so DB persistence needs a user.
    $this->actingAs((new User)->forceFill(['id' => 7]));
});

it('applies the resized width to the header and cell attributes on the next render', function () {
    // updateColumnWidth() is #[Renderless] — the browser already resized the
    // column, so the width only reaches the markup on the following request.
    Livewire::test(PlainTable::class)
        ->call('updateColumnWidth', 'alpha', '240');

    $alpha = columnsOf(Livewire::test(PlainTable::class)->instance())['alpha'];

    expect($alpha->getExtraHeaderAttributes()['style'])
        ->toBe('min-width: 240px; width: 240px; max-width: 240px')
        ->and($alpha->getExtraCellAttributes()['style'])
        ->toBe('min-width: 240px; width: 240px; max-width: 240px; overflow: hidden');
});

it('persists a resized width to the session', function () {
    Livewire::test(PlainTable::class)
        ->call('updateColumnWidth', 'alpha', '240');

    expect(session('tables.plain_table_columns_style'))
        ->toBe(['alpha' => ['width' => '240']]);
});

it('rehydrates widths from the session on mount', function () {
    session()->put('tables.plain_table_columns_style', ['beta' => ['width' => '180']]);

    $component = Livewire::test(PlainTable::class);

    expect(columnsOf($component->instance())['beta']->getExtraHeaderAttributes()['style'])
        ->toBe('min-width: 180px; width: 180px; max-width: 180px');
});

it('tags every header with the column name and html id', function () {
    $component = Livewire::test(PlainTable::class);

    $attributes = columnsOf($component->instance())['alpha']->getExtraHeaderAttributes();

    expect($attributes['data-column-name'])->toBe('alpha')
        ->and($attributes['data-column-id'])->toBe('alpha')
        ->and($attributes['class'])->toContain('group/column-resize');
});

it('does not mark headers reorderable unless dragReorderableColumns is enabled', function () {
    $component = Livewire::test(PlainTable::class);

    $attributes = columnsOf($component->instance())['alpha']->getExtraHeaderAttributes();

    expect($attributes)->not->toHaveKey('data-resized-reorderable')
        ->and($attributes)->not->toHaveKey('data-stickable');
});

it('reorders columns and persists the order for the next request', function () {
    $component = Livewire::test(DatabaseTable::class)
        ->call('updateColumnOrder', ['gamma', 'alpha', 'beta']);

    expect(array_keys(columnsOf($component->instance())))
        ->toBe(['gamma', 'alpha', 'beta']);

    // A fresh mount rebuilds the table, then reapplies the saved order.
    expect(array_keys(columnsOf(Livewire::test(DatabaseTable::class)->instance())))
        ->toBe(['gamma', 'alpha', 'beta']);
});

it('appends unknown and missing columns after the saved order', function () {
    $component = Livewire::test(PlainTable::class)
        ->call('updateColumnOrder', ['gamma', 'unknown-column']);

    expect(array_keys(columnsOf($component->instance())))
        ->toBe(['gamma', 'alpha', 'beta']);
});

it('ignores non-string entries in a submitted column order', function () {
    $component = Livewire::test(PlainTable::class)
        ->call('updateColumnOrder', ['gamma', 42, null, 'alpha']);

    expect(array_keys(columnsOf($component->instance())))
        ->toBe(['gamma', 'alpha', 'beta']);
});

it('writes widths and order to the database when the table opts in', function () {
    Livewire::test(DatabaseTable::class)
        ->call('updateColumnWidth', 'alpha', '300')
        ->call('updateColumnOrder', ['beta', 'alpha', 'gamma']);

    $setting = TableSetting::query()
        ->where('resource', DatabaseTable::class)
        ->sole();

    expect($setting->styles)->toBe([
        'alpha' => ['width' => '300'],
        '__order' => ['beta', 'alpha', 'gamma'],
    ]);
});

it('keeps widths out of the database for a session-only table', function () {
    Livewire::test(PlainTable::class)
        ->call('updateColumnWidth', 'alpha', '300');

    expect(TableSetting::count())->toBe(0);
});

it('loads persisted widths from the database when the session is empty', function () {
    TableSetting::create([
        'user_id' => 7,
        'resource' => DatabaseTable::class,
        'styles' => [
            'gamma' => ['width' => '420'],
            '__order' => ['gamma', 'beta', 'alpha'],
        ],
    ]);

    $component = Livewire::test(DatabaseTable::class);

    expect(array_keys(columnsOf($component->instance())))->toBe(['gamma', 'beta', 'alpha'])
        ->and(columnsOf($component->instance())['gamma']->getExtraHeaderAttributes()['style'])
        ->toBe('min-width: 420px; width: 420px; max-width: 420px');

    // The database read is mirrored into the session so later requests skip it.
    expect(session('tables.database_table_columns_style'))
        ->toBe(['gamma' => ['width' => '420'], '__order' => ['gamma', 'beta', 'alpha']]);
});

it('scopes database rows per user', function () {
    TableSetting::create([
        'user_id' => 99,
        'resource' => DatabaseTable::class,
        'styles' => ['gamma' => ['width' => '420']],
    ]);

    $component = Livewire::test(DatabaseTable::class);

    expect(columnsOf($component->instance())['gamma']->getExtraHeaderAttributes())
        ->not->toHaveKey('style');
});

it('marks headers as reorderable when dragReorderableColumns is enabled', function () {
    $component = Livewire::test(DatabaseTable::class);

    $attributes = columnsOf($component->instance())['alpha']->getExtraHeaderAttributes();

    expect($attributes['data-resized-reorderable'])->toBe('true')
        ->and($attributes['class'])->toContain('resized-reorderable-col');
});
