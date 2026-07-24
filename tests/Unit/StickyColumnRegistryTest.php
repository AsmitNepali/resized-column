<?php

use Asmit\ResizedColumn\StickyColumnRegistry;
use Filament\Tables\Columns\TextColumn;

it('returns null for an unmarked column', function () {
    expect(StickyColumnRegistry::side(TextColumn::make('title')))->toBeNull();
});

it('records the pinned side per column instance', function () {
    $left = TextColumn::make('title');
    $right = TextColumn::make('actions');

    StickyColumnRegistry::mark($left, 'left');
    StickyColumnRegistry::mark($right, 'right');

    expect(StickyColumnRegistry::side($left))->toBe('left');
    expect(StickyColumnRegistry::side($right))->toBe('right');
});

it('overwrites the side on a repeated mark', function () {
    $col = TextColumn::make('title');

    StickyColumnRegistry::mark($col, 'left');
    StickyColumnRegistry::mark($col, 'right');

    expect(StickyColumnRegistry::side($col))->toBe('right');
});

it('registers a ->sticky() macro that marks the column', function () {
    $col = TextColumn::make('title')->sticky('right');

    expect(StickyColumnRegistry::side($col))->toBe('right');
});

it('defaults the ->sticky() macro to the left side', function () {
    $col = TextColumn::make('title')->sticky();

    expect(StickyColumnRegistry::side($col))->toBe('left');
});
