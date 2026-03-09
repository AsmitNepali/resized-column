<?php

namespace Asmit\ResizedColumn;

use Filament\FilamentManager;
use Asmit\ResizedColumn\Plugin\Concerns\CanResizedColumn;
use Asmit\ResizedColumn\Plugin\Concerns\CanBeStandalone;
use Filament\Contracts\Plugin;
use Filament\Panel;

class ResizedColumnPlugin implements Plugin
{
    use CanResizedColumn;
    use CanBeStandalone;

    public static function make(): static
    {
        return app(static::class);
    }

    public static function get(): Plugin|FilamentManager
    {
        return filament(app(static::class)->getId());
    }

    public function getId(): string
    {
        return 'asmit-resized-column';
    }

    public function register(Panel $panel): void
    {
        //
    }

    public function boot(Panel $panel): void
    {
        //
    }
}
