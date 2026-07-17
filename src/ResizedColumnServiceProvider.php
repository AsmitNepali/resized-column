<?php

namespace Asmit\ResizedColumn;

use Asmit\ResizedColumn\Assets\ContentHashCss;
use Asmit\ResizedColumn\Assets\ContentHashJs;
use Filament\Support\Facades\FilamentAsset;
use Filament\Support\Facades\FilamentView;
use Filament\Tables\Columns\Column;
use Filament\Tables\Table;
use Filament\Tables\View\TablesRenderHook;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class ResizedColumnServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package->name('asmit-resized-column')
            ->hasViews()
            ->hasMigrations([
                'create_table_settings',
            ]);
    }

    public function packageBooted(): void
    {
        FilamentAsset::register([
            ContentHashJs::make('resized-column', __DIR__.'/../resources/dist/js/resized-column.js'),
            ContentHashCss::make('resized-column', __DIR__.'/../resources/css/resized-column.css'),
        ], 'asmit/resized-column');

        $this->registerTableMacros();
        $this->registerColumnMacros();
        $this->registerStickyPanelHook();

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

        /**
         * Enable our own drag-to-reorder column feature for this table.
         * Named distinctly from Filament's native reorderableColumns() (its
         * column-manager feature) so the two stay fully independent.
         *
         * Usage inside a Livewire component's table() method:
         *   return $table->columns([...])->dragReorderableColumns();
         */
        Table::macro('dragReorderableColumns', function (bool $condition = true): Table {
            /** @var Table $this */
            ResizedColumnTableRegistry::register(
                get_class($this->getLivewire()),
                reorderable: $condition,
            );

            return $this;
        });

        /**
         * Let users pin/unpin columns at runtime via a header toggle; the
         * selection persists per user (session + DB). Any ->sticky() calls
         * seed the initial selection.
         *
         * Usage inside a Livewire component's table() method:
         *   return $table->columns([...])->stickableColumns();
         */
        Table::macro('stickableColumns', function (bool $condition = true): Table {
            /** @var Table $this */
            ResizedColumnTableRegistry::register(
                get_class($this->getLivewire()),
                stickable: $condition,
            );

            return $this;
        });
    }

    /**
     * Inject a "Pin columns" dropdown next to the native column-manager
     * trigger, but only for tables opted into ->stickableColumns().
     */
    protected function registerStickyPanelHook(): void
    {
        FilamentView::registerRenderHook(
            TablesRenderHook::TOOLBAR_COLUMN_MANAGER_TRIGGER_BEFORE,
            function (array $scopes): string {
                $componentClass = $scopes[0] ?? null;

                if ($componentClass === null || ! ResizedColumnTableRegistry::isStickable($componentClass)) {
                    return '';
                }

                return view('asmit-resized-column::sticky-panel')->render();
            },
        );
    }

    protected function registerColumnMacros(): void
    {
        /**
         * Pin a column to a side of the table so it stays visible while
         * scrolling horizontally. Emits a `data-sticky` marker (see
         * StickyColumnRegistry / LoadResizedColumn::applyExtraAttributes)
         * that JS uses to position it.
         *
         * Usage inside a table's columns() definition:
         *   TextColumn::make('title')->sticky();
         */
        Column::macro('sticky', function (string $side = 'left'): Column {
            /** @var Column $this */
            StickyColumnRegistry::mark($this, $side);

            return $this;
        });
    }
}
