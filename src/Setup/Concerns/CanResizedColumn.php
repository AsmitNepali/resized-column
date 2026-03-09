<?php

namespace Asmit\ResizedColumn\Setup\Concerns;

use Asmit\ResizedColumn\ResizedColumnPlugin;

trait CanResizedColumn
{
    public static function preserveOnDB(): bool
    {
        // Priority 1: Filament panel plugin
        if (self::resizedColumnPlugged()) {
            return ResizedColumnPlugin::get()->isPreserveOnDBEnabled();
        }

        // Priority 2: Standalone config registered in AppServiceProvider::boot()
        if ($standalone = ResizedColumnPlugin::getStandaloneConfig()) {
            return $standalone->isPreserveOnDBEnabled();
        }

        return false;
    }

    public static function preserveOnSession(): bool
    {
        // Priority 1: Filament panel plugin
        if (self::resizedColumnPlugged()) {
            return ResizedColumnPlugin::get()->isPreserveOnSessionEnabled();
        }

        // Priority 2: Standalone config registered in AppServiceProvider::boot()
        if ($standalone = ResizedColumnPlugin::getStandaloneConfig()) {
            return $standalone->isPreserveOnSessionEnabled();
        }

        return config('resized-column.preserve_on_session', true);
    }
}
