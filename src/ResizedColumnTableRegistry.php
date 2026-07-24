<?php

namespace Asmit\ResizedColumn;

/**
 * Per-component-class registry for table-level column width persistence config.
 * Populated by the ->preserveColumnWidthsInDatabase() / ->preserveColumnWidthsInSession()
 * / ->dragReorderableColumns() / ->stickableColumns() macros on Filament's Table.
 */
class ResizedColumnTableRegistry
{
    /** @var array<class-string, array{preserveOnDb: bool, preserveOnSession: bool, reorderable: bool, stickable: bool, stickyPanelActionModifier: ?\Closure}> */
    private static array $configs = [];

    public static function register(
        string $componentClass,
        ?bool $preserveOnDb = null,
        ?bool $preserveOnSession = null,
        ?bool $reorderable = null,
        ?bool $stickable = null,
    ): void {
        $existing = static::$configs[$componentClass] ?? [];

        static::$configs[$componentClass] = [
            'preserveOnDb' => $preserveOnDb ?? $existing['preserveOnDb'] ?? false,
            'preserveOnSession' => $preserveOnSession ?? $existing['preserveOnSession'] ?? true,
            'reorderable' => $reorderable ?? $existing['reorderable'] ?? false,
            'stickable' => $stickable ?? $existing['stickable'] ?? false,
            'stickyPanelActionModifier' => $existing['stickyPanelActionModifier'] ?? null,
        ];
    }

    public static function stickyPanelAction(string $componentClass, ?\Closure $modifier): void
    {
        if (! isset(static::$configs[$componentClass])) {
            static::register($componentClass);
        }

        static::$configs[$componentClass]['stickyPanelActionModifier'] = $modifier;
    }

    public static function getStickyPanelActionModifier(string $componentClass): ?\Closure
    {
        return static::$configs[$componentClass]['stickyPanelActionModifier'] ?? null;
    }

    public static function isStickable(string $componentClass): bool
    {
        return static::$configs[$componentClass]['stickable'] ?? false;
    }

    public static function shouldPreserveOnDb(string $componentClass): ?bool
    {
        return static::$configs[$componentClass]['preserveOnDb'] ?? null;
    }

    public static function shouldPreserveOnSession(string $componentClass): ?bool
    {
        return static::$configs[$componentClass]['preserveOnSession'] ?? null;
    }

    public static function isReorderable(string $componentClass): bool
    {
        return static::$configs[$componentClass]['reorderable'] ?? false;
    }

    public static function has(string $componentClass): bool
    {
        return isset(static::$configs[$componentClass]);
    }

    public static function reset(): void
    {
        static::$configs = [];
    }
}
