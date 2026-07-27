<div x-data="resizedStickyPanel()" class="resized-sticky-panel">
    {{ $triggerAction }}

    <div
        x-show="open"
        x-cloak
        x-on:click.outside="open = false"
        x-transition.opacity
        class="resized-sticky-panel-menu"
    >
        <p class="resized-sticky-panel-heading">{{ __('asmit-resized-column::sticky-panel.heading') }}</p>

        <div class="resized-sticky-panel-bulk" x-show="columns.length > 0">
            <button type="button" class="resized-sticky-panel-bulk-btn resized-sticky-panel-bulk-btn--select" x-on:click="selectAll()">
                Select all
            </button>
            <button type="button" class="resized-sticky-panel-bulk-btn resized-sticky-panel-bulk-btn--deselect" x-on:click="deselectAll()">
                Deselect all
            </button>
        </div>

        <template x-for="col in columns" :key="col.name">
            <label
                class="resized-sticky-panel-item"
                x-bind:class="{ 'resized-sticky-panel-item--locked': col.locked }"
            >
                <x-filament::input.checkbox
                    x-bind:checked="col.pinned"
                    x-bind:disabled="col.locked"
                    x-on:change="toggleDraft(col)"
                />

                <span x-text="col.label"></span>
            </label>
        </template>

        <p x-show="columns.length === 0" class="resized-sticky-panel-empty">No columns</p>

        <div class="resized-sticky-panel-footer" x-show="columns.length > 0">
            <x-filament::button
                size="sm"
                x-bind:disabled="! isDirty()"
                x-on:click="apply()"
            >
                Apply
            </x-filament::button>
        </div>
    </div>
</div>
