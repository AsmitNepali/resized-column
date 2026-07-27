<?php

use Asmit\ResizedColumn\Tests\Fixtures\ResizedColumnLayoutHarness;

it('reapplies saved column order after the table is rebuilt', function () {
    $harness = new ResizedColumnLayoutHarness;

    $harness->bootTable();
    $harness->setColumnOrderForTest(['gamma', 'beta', 'alpha']);
    $harness->rendering();

    expect(array_keys($harness->getTable()->getColumns()))
        ->toBe(['gamma', 'beta', 'alpha']);

    $harness->rebuildTable();

    expect(array_keys($harness->getTable()->getColumns()))
        ->toBe(['alpha', 'beta', 'gamma']);

    $harness->rendering();

    expect(array_keys($harness->getTable()->getColumns()))
        ->toBe(['gamma', 'beta', 'alpha']);
});

it('marks reorderable headers when dragReorderableColumns is enabled', function () {
    $harness = new ResizedColumnLayoutHarness;

    $harness->bootTable();
    $harness->rendering();

    $alpha = $harness->getTable()->getColumns()['alpha'];

    expect($alpha->getExtraHeaderAttributes()['class'] ?? '')
        ->toContain('resized-reorderable-col')
        ->and($alpha->getExtraHeaderAttributes()['data-resized-reorderable'] ?? null)
        ->toBe('true');
});

it('exposes a rendering hook for reapplied layout', function () {
    $reflection = new ReflectionClass(ResizedColumnLayoutHarness::class);

    expect($reflection->hasMethod('rendering'))->toBeTrue();
});
