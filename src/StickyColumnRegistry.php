<?php

namespace Asmit\ResizedColumn;

use Filament\Tables\Columns\Column;
use WeakMap;

/**
 * Records which columns are pinned (sticky) and on which side.
 * Keyed by the Column instance via WeakMap so entries clear with the object
 * and no dynamic properties are set on Filament classes.
 */
class StickyColumnRegistry
{
    /** @var WeakMap<Column, string>|null */
    private static ?WeakMap $sides = null;

    public static function mark(Column $column, string $side): void
    {
        static::$sides ??= new WeakMap;
        static::$sides[$column] = $side;
    }

    public static function side(Column $column): ?string
    {
        return static::$sides[$column] ?? null;
    }
}
