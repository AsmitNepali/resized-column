<div x-data="resizedStickyPanel()" class="resized-sticky-panel">
    <button
        type="button"
        x-on:click="toggle()"
        class="resized-sticky-panel-trigger"
        title="Pin columns"
    >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9.828.722a.5.5 0 0 1 .707 0l3.943 3.944a.5.5 0 0 1-.219.828l-2.31.66-2.573 2.573 1.06 3.006a.5.5 0 0 1-.117.518l-.707.707a.5.5 0 0 1-.707 0L6.229 9.7l-3.238 3.238a.5.5 0 0 1-.707-.707L5.522 8.99 2.79 6.257a.5.5 0 0 1 0-.707l.707-.707a.5.5 0 0 1 .518-.117l3.006 1.06 2.573-2.573.66-2.31a.5.5 0 0 1 .174-.281z" />
        </svg>
    </button>

    <div
        x-show="open"
        x-cloak
        x-on:click.outside="open = false"
        x-transition.opacity
        class="resized-sticky-panel-menu"
    >
        <p class="resized-sticky-panel-heading">Pin columns</p>

        <template x-for="col in columns" :key="col.name">
            <label class="resized-sticky-panel-item">
                <input
                    type="checkbox"
                    class="fi-checkbox-input"
                    :checked="col.pinned"
                    x-on:change="togglePin(col)"
                />
                <span x-text="col.label"></span>
            </label>
        </template>

        <p x-show="columns.length === 0" class="resized-sticky-panel-empty">No columns</p>
    </div>
</div>
