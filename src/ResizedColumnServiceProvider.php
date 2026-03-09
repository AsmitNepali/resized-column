<?php

namespace Asmit\ResizedColumn;

use Filament\Support\Assets\Css;
use Filament\Support\Assets\Js;
use Filament\Support\Facades\FilamentAsset;
use Filament\Tables\Table;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class ResizedColumnServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package->name('asmit-resized-column')
            ->hasMigrations([
                'create_table_settings',
            ]);
    }

    public function packageBooted(): void
    {
        FilamentAsset::register([
            Js::make('resized-column', __DIR__.'/../resources/dist/js/resized-column.js'),
            Css::make('resized-column', __DIR__.'/../resources/css/resized-column.css'),
        ], 'asmit/resized-column');

        $this->registerTableMacros();

        // Register publishable migrations
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../database/migrations/create_table_settings.php.stub' => database_path('migrations/'.date('Y_m_d_His', time()).'_create_table_settings_table.php'),
            ], 'resized-column-migrations');
        }
    }

    protected function registerTableMacros(): void
    {
        /**
         * Persist resized column widths to the database for this table.
         *
         * Usage inside a Livewire component's table() method:
         *   return $table->columns([...])->preserveColumnWidthsInDatabase();
         */
        Table::macro('preserveColumnWidthsInDatabase', function (bool $condition = true): Table {
            /** @var Table $this */
            ResizedColumnTableRegistry::register(
                get_class($this->getLivewire()),
                preserveOnDb: $condition,
            );

            return $this;
        });

        /**
         * Control whether resized column widths are persisted in the session for this table.
         *
         * Usage inside a Livewire component's table() method:
         *   return $table->columns([...])->preserveColumnWidthsInSession(false);
         */
        Table::macro('preserveColumnWidthsInSession', function (bool $condition = true): Table {
            /** @var Table $this */
            ResizedColumnTableRegistry::register(
                get_class($this->getLivewire()),
                preserveOnSession: $condition,
            );

            return $this;
        });
    }
}
