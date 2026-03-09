<?php

namespace Asmit\ResizedColumn\Plugin\Concerns;

trait CanUseInStandalone
{
    private static ?self $standaloneConfig = null;

    /**
     * Returns a standalone config instance for use outside a Filament panel.
     *
     * Call once in AppServiceProvider::boot() and chain any config methods:
     *
     *   ResizedColumnPlugin::standalone()->preserveOnDB();
     *   ResizedColumnPlugin::standalone()->preserveOnDB()->preserveOnSession(false);
     */
    public static function standalone(): static
    {
        if (static::$standaloneConfig === null) {
            static::$standaloneConfig = new static();
        }

        return static::$standaloneConfig;
    }

    /**
     * Returns the standalone config instance, or null if standalone() was never called.
     * Used internally by Setup to fall back to standalone config when no panel is present.
     */
    public static function getStandaloneConfig(): ?static
    {
        return static::$standaloneConfig;
    }
}
