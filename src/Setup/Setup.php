<?php

namespace Asmit\ResizedColumn\Setup;

use Asmit\ResizedColumn\Setup\Concerns\CanResizedColumn;

class Setup
{
    use CanResizedColumn;

    public static function resizedColumnPlugged(): bool
    {
        try {
            if (!filament()->hasPlugin('asmit-resized-column')) {
                return false;
            }
            return filament()->hasPlugin('asmit-resized-column') && filament()->getDefaultPanel();
        } catch (\Exception $e) {
            return false;
        }
    }
}
