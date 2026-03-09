<?php

namespace Asmit\ResizedColumn;

/**
 * Per-component-class registry for table-level column width persistence config.
 * Populated by the ->preserveColumnWidthsInDatabase() / ->preserveColumnWidthsInSession()
 * macros on Filament's Table.
 */
class ResizedColumnTableRegistry
{
    /** @var array<class-string, array{preserveOnDb: bool, preserveOnSession: bool}> */
    private static array $configs = [];

    public static function register(
        string $componentClass,
        ?bool $preserveOnDb = null,
        ?bool $preserveOnSession = null,
    ): void {
        $existing = static::$configs[$componentClass] ?? [];

        static::$configs[$componentClass] = [
            'preserveOnDb'      => $preserveOnDb      ?? $existing['preserveOnDb']      ?? false,
            'preserveOnSession' => $preserveOnSession ?? $existing['preserveOnSession'] ?? true,
        ];
    }

    public static function shouldPreserveOnDb(string $componentClass): ?bool
    {
        return static::$configs[$componentClass]['preserveOnDb'] ?? null;
    }

    public static function shouldPreserveOnSession(string $componentClass): ?bool
    {
        return static::$configs[$componentClass]['preserveOnSession'] ?? null;
    }

    public static function has(string $componentClass): bool
    {
        return isset(static::$configs[$componentClass]);
    }
}
