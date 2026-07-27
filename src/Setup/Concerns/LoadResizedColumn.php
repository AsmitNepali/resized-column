<?php

namespace Asmit\ResizedColumn\Setup\Concerns;

use Asmit\ResizedColumn\Models\TableSetting;
use Asmit\ResizedColumn\ResizedColumnTableRegistry;
use Asmit\ResizedColumn\Setup\Setup;
use Asmit\ResizedColumn\StickyColumnRegistry;
use Filament\Tables\Columns\Column;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Renderless;

trait LoadResizedColumn
{
    private const ORDER_KEY = '__order';

    private const STICKY_KEY = '__sticky';

    /**
     * @var array<string, array{width: string|null}>
     */
    protected array $columnWidths = [];

    /**
     * @var array<int, string>
     */
    protected array $columnOrder = [];

    /**
     * User-pinned (sticky) column names.
     *
     * @var array<int, string>
     */
    protected array $stickyColumns = [];

    /**
     * Whether the user's sticky selection was loaded from persistence. When
     * false, the dev-declared ->sticky() defaults seed the selection.
     */
    protected bool $stickyPersisted = false;

    /**
     * (Re)apply header/cell attributes to every column. Called on boot and
     * after runtime changes (e.g. sticky toggle) so the current render
     * reflects the new state without a page refresh.
     */
    protected function applyAllColumnAttributes(): void
    {
        foreach ($this->getCurrentTableColumns() as $columnName => $column) {
            $this->applyExtraAttributes($columnName, $column);
        }
    }

    private function applyExtraAttributes(string $columnName, Column $column): void
    {
        /**
         * @var Column $column
         */
        $isSticky = in_array($columnName, $this->stickyColumns, true);
        $width = $this->columnWidths[$columnName]['width'] ?? null;
        $styles = $this->getColumnStyles($width, $isSticky);

        $columnId = $this->getColumnHtmlId($columnName);
        $reorderable = ResizedColumnTableRegistry::isReorderable(static::class) ? 'true' : 'false';

        $stickyHeader = [];
        $stickyCell = [];

        if ($isSticky) {
            $stickyHeader = ['data-sticky' => 'left', 'class' => 'resized-sticky'];
            $stickyCell = ['data-sticky' => 'left', 'class' => 'resized-sticky'];
        }

        if (ResizedColumnTableRegistry::isStickable(static::class)) {
            $stickyHeader['data-stickable'] = 'true';
        }

        $column->extraHeaderAttributes([
            'x-data' => "resizedColumn(`{$columnName}`, `{$columnId}`, {$reorderable})",
            'data-column-name' => $columnName,
            ...$styles['header'],
            ...$stickyHeader,
        ])
            ->extraCellAttributes([
                ...$styles['cell'],
                ...$stickyCell,
            ]);
    }

    /**
     * Seed the sticky selection from dev-declared ->sticky() columns when the
     * user has no persisted selection yet.
     */
    protected function seedStickyDefaults(): void
    {
        $defaults = [];

        foreach ($this->getTable()->getColumns() as $name => $column) {
            if (StickyColumnRegistry::side($column) !== null) {
                $defaults[] = $name;
            }
        }

        if ($defaults === []) {
            return;
        }

        if (! $this->stickyPersisted) {
            $this->stickyColumns = $defaults;

            return;
        }

        if ($this->stickyColumns === []) {
            $this->stickyColumns = $defaults;
        }
    }

    /**
     * Toggle a column's pinned (sticky) state and persist the selection.
     */
    public function toggleColumnSticky(string $columnName): void
    {
        if (! ResizedColumnTableRegistry::isStickable(static::class)) {
            return;
        }

        if (in_array($columnName, $this->stickyColumns, true)) {
            $this->stickyColumns = array_values(array_diff($this->stickyColumns, [$columnName]));
        } else {
            $this->stickyColumns[] = $columnName;
        }

        $this->stickyPersisted = true;

        $this->applyStickyColumnOrder();

        // Re-apply to the current render: applyAllColumnAttributes() already
        // ran in the boot hook before this action, so without this call the
        // new sticky state would only appear after a page refresh.
        $this->applyAllColumnAttributes();

        if (self::isPreservedOnDB()) {
            $this->persistColumnWidthsToDatabase();
        }

        $this->persistColumnWidthsToSession();
    }

    /**
     * Replace the pinned (sticky) selection and persist it.
     *
     * @param  list<string>  $columnNames
     */
    public function setStickyColumns(array $columnNames): void
    {
        if (! ResizedColumnTableRegistry::isStickable(static::class)) {
            return;
        }

        $allowed = array_keys($this->getTable()->getColumns());

        $this->stickyColumns = array_values(array_unique(array_filter(
            $columnNames,
            fn (mixed $name): bool => is_string($name) && in_array($name, $allowed, true),
        )));

        $this->stickyPersisted = true;

        $this->applyStickyColumnOrder();

        $this->applyAllColumnAttributes();

        if (self::isPreservedOnDB()) {
            $this->persistColumnWidthsToDatabase();
        }

        $this->persistColumnWidthsToSession();
    }

    /**
     * Move pinned columns into a contiguous block at the start of the table.
     * Sticky positioning only works reliably when pinned columns are adjacent.
     */
    protected function applyStickyColumnOrder(): void
    {
        if ($this->stickyColumns === []) {
            return;
        }

        $table = $this->getTable();
        $columns = $table->getColumns();

        if ($columns === []) {
            return;
        }

        $stickyLookup = array_flip($this->stickyColumns);
        $orderedSticky = [];
        $nonSticky = [];

        foreach ($this->stickyColumns as $name) {
            if (isset($columns[$name])) {
                $orderedSticky[$name] = $columns[$name];
            }
        }

        foreach ($columns as $name => $column) {
            if (! isset($stickyLookup[$name])) {
                $nonSticky[$name] = $column;
            }
        }

        $ordered = array_merge($orderedSticky, $nonSticky);
        $this->columnOrder = array_keys($ordered);

        $table->columns(array_values($ordered));
    }

    /**
     * Reorder the table's columns to match the saved column order,
     * appending any columns not present in the saved order at the end.
     */
    protected function applyColumnOrder(): void
    {
        if (empty($this->columnOrder)) {
            return;
        }

        $table = $this->getTable();
        $columns = $table->getColumns();

        if (empty($columns)) {
            return;
        }

        $ordered = [];

        foreach ($this->columnOrder as $name) {
            if (isset($columns[$name])) {
                $ordered[$name] = $columns[$name];
            }
        }

        foreach ($columns as $name => $column) {
            if (! isset($ordered[$name])) {
                $ordered[$name] = $column;
            }
        }

        $table->columns(array_values($ordered));
    }

    /**
     * @return array{header: array<string, string>, cell: array<string, string>}
     */
    protected function getColumnStyles(?string $width, bool $isSticky = false): array
    {
        if (! $width) {
            return ['header' => [], 'cell' => []];
        }

        $style = "min-width: {$width}px; width: {$width}px; max-width: {$width}px";
        $cellStyle = $isSticky ? $style : "{$style}; overflow: hidden";

        return [
            'header' => ['style' => $style],
            'cell' => ['style' => $cellStyle],
        ];
    }

    /**
     * Retrieves the table's columns.
     *
     * @return array<string, Column>
     */
    #[Computed(cache: true)]
    protected function getCurrentTableColumns(): array
    {
        return $this->getTable()->getColumns();
    }

    #[Renderless]
    public function updateColumnWidth(string $columnName, string $newWidth): void
    {
        $this->columnWidths[$columnName]['width'] = $newWidth;

        if (self::isPreservedOnDB()) {
            $this->persistColumnWidthsToDatabase();
        }

        $this->persistColumnWidthsToSession();
    }

    /**
     * @param  array<int, string>  $order
     */
    public function updateColumnOrder(array $order): void
    {
        $this->columnOrder = array_values(array_filter($order, 'is_string'));

        // Re-apply to the current render: bootedHasResizableColumn() ran its
        // applyColumnOrder() before this action, so without this call the new
        // order would only take effect on the next request.
        $this->applyColumnOrder();
        $this->applyStickyColumnOrder();
        $this->applyAllColumnAttributes();

        if (self::isPreservedOnDB()) {
            $this->persistColumnWidthsToDatabase();
        }

        $this->persistColumnWidthsToSession();
    }

    /**
     * Persist column widths to the database.
     * This method can be overridden to customize database operations.
     */
    protected function persistColumnWidthsToDatabase(): void
    {
        TableSetting::updateOrCreate(
            [
                'user_id' => $this->getUserId(),
                'resource' => $this->getResourceModelFullPath(),
            ],
            ['styles' => $this->persistBlob()]
        );
    }

    /**
     * Persist column widths to the session.
     * This method can be overridden to customize session storage.
     */
    protected function persistColumnWidthsToSession(): void
    {
        session()->put($this->getSessionKey(), $this->persistBlob());
    }

    /**
     * Merge width entries and column order back into one persistable blob.
     *
     * @return array<string, mixed>
     */
    protected function persistBlob(): array
    {
        $blob = $this->columnWidths;

        if (! empty($this->columnOrder)) {
            $blob[self::ORDER_KEY] = $this->columnOrder;
        }

        if ($this->stickyPersisted) {
            $blob[self::STICKY_KEY] = array_values($this->stickyColumns);
        }

        return $blob;
    }

    /**
     * Get the current user ID for column width storage.
     * This method can be overridden to customize user identification.
     */
    protected function getUserId()
    {
        return Auth::id();
    }

    protected function getResourceModelFullPath(): string
    {
        if (method_exists($this, 'getRelationship')) { // @phpstan-ignore-line

            $relationShipModelInstance = $this->getRelationship(); // @phpstan-ignore-line

            return $relationShipModelInstance->getModel()::class;
        } elseif (! method_exists($this, 'getModel')) { // @phpstan-ignore-line
            return static::class;
        } else {
            return static::getModel();
        }
    }

    private function getColumnHtmlId(string $columnName): string
    {
        return str($columnName)->camel()->kebab()->toString();
    }

    protected function getSessionKey(): string
    {
        $modelName = Str::snake(class_basename($this->getResourceModelFullPath()));

        return "tables.{$modelName}_columns_style";
    }

    protected function loadColumnWidths(): void
    {
        if (self::isPreservedOnSession()) {
            $this->loadColumnWidthsFromSession();
        }

        if (self::isPreservedOnDB() && blank($this->columnWidths) && blank($this->columnOrder)) {
            $this->loadColumnWidthsFromDatabase();
        }
    }

    /**
     * Load column widths from the session.
     * This method can be overridden to customize session retrieval.
     */
    protected function loadColumnWidthsFromSession(): void
    {
        $this->hydrateFromBlob(session($this->getSessionKey()) ?: []);
    }

    /**
     * Load column widths from the database.
     * This method can be overridden to customize database retrieval.
     */
    protected function loadColumnWidthsFromDatabase(): void
    {
        $blob = TableSetting::query()
            ->where('user_id', $this->getUserId())
            ->where('resource', $this->getResourceModelFullPath())
            ->value('styles') ?? [];

        $this->hydrateFromBlob($blob);

        $this->persistColumnWidthsToSession();
    }

    /**
     * Split a persisted blob into width entries and the column order list.
     *
     * @param  array<string, mixed>  $blob
     */
    protected function hydrateFromBlob(array $blob): void
    {
        $this->columnOrder = $blob[self::ORDER_KEY] ?? [];

        if (array_key_exists(self::STICKY_KEY, $blob)) {
            $this->stickyColumns = $blob[self::STICKY_KEY];
            $this->stickyPersisted = true;
        }

        unset($blob[self::ORDER_KEY], $blob[self::STICKY_KEY]);
        $this->columnWidths = $blob;
    }

    public static function isPreservedOnDB(): bool
    {
        // Priority 1: Per-table config set via ->preserveColumnWidthsInDatabase() macro
        if (ResizedColumnTableRegistry::has(static::class)) {
            return ResizedColumnTableRegistry::shouldPreserveOnDb(static::class) ?? false;
        }

        // Priority 2: Global config — standalone (AppServiceProvider) or panel plugin
        return Setup::preserveOnDB();
    }

    public static function isPreservedOnSession(): bool
    {
        // Priority 1: Per-table config set via ->preserveColumnWidthsInSession() macro
        if (ResizedColumnTableRegistry::has(static::class)) {
            return ResizedColumnTableRegistry::shouldPreserveOnSession(static::class) ?? true;
        }

        // Priority 2: Global config — standalone (AppServiceProvider) or panel plugin
        return Setup::preserveOnSession();
    }
}
