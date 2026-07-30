import Sortable from 'sortablejs';
import { scheduleStickyRefresh } from './sticky-columns.js';

const sortableInstances = new WeakMap();

function slugifyColumnName(name) {
    return name.replace(/_/g, '-').replace(/\s+/g, '-');
}

function escapeClass(className) {
    if (!className || typeof className !== 'string') {
        return '';
    }

    return className.replace(/\./g, '\\.');
}

function columnIdFromHeader(header) {
    const columnId = header.getAttribute('data-column-id');

    if (columnId) {
        return columnId;
    }

    return slugifyColumnName(header.getAttribute('data-column-name') ?? '');
}

function destroySortableForRow(row) {
    const existing = sortableInstances.get(row);

    if (!existing) {
        return;
    }

    existing.destroy();
    sortableInstances.delete(row);
}

function createSortableForRow(row, onOrderChange) {
    destroySortableForRow(row);

    const sortable = Sortable.create(row, {
        handle: '.resized-col-drag',
        animation: 150,
        draggable: '[data-column-name]',
        filter: '[data-sticky]',
        preventOnFilter: true,
        onMove(evt) {
            if (evt.related?.matches('[data-sticky]') && evt.willInsertAfter === false) {
                return false;
            }
        },
        onEnd: () => {
            const order = Array.from(row.querySelectorAll('[data-column-name]'))
                .map((el) => el.getAttribute('data-column-name'));

            Promise.resolve(onOrderChange(order)).finally(() => {
                const table = row.closest('.fi-ta-table');

                requestAnimationFrame(() => {
                    refreshDragHandles(table);
                    scheduleStickyRefresh();
                });
            });
        },
    });

    sortableInstances.set(row, sortable);
}

function ensureDragHandleForHeader(header) {
    if (!header || header.hasAttribute('data-sticky')) {
        return;
    }

    header.classList.add('resized-reorderable-col');

    if (header.querySelector('.resized-col-drag')) {
        return;
    }

    const grip = document.createElement('button');
    grip.type = 'button';
    grip.classList.add('resized-col-drag');
    grip.setAttribute('aria-label', 'Drag to reorder');
    grip.setAttribute('title', 'Drag to reorder');
    header.prepend(grip);
}

function refreshDragHandles(table) {
    if (!table) {
        return;
    }

    table.querySelectorAll('thead th[data-column-name]:not([data-sticky])').forEach((header) => {
        ensureDragHandleForHeader(header);
    });
}

function unpinColumn(header) {
    const columnName = header.getAttribute('data-column-name');
    const wireId = header.closest('[wire\\:id]')?.getAttribute('wire:id');
    const component = wireId ? window.Livewire?.find(wireId) : null;

    if (columnName && typeof component?.toggleColumnSticky === 'function') {
        component.toggleColumnSticky(columnName);
    }
}

function ensureStickyPinForHeader(header) {
    // A ->sticky() column cannot be unpinned (toggleColumnSticky refuses), so it
    // keeps the plain CSS ::before pin rather than gaining a control that does
    // nothing. Only tables opted into ->stickableColumns() can unpin at all.
    if (header.hasAttribute('data-sticky-locked') || !header.hasAttribute('data-stickable')) {
        return;
    }

    header.classList.add('resized-has-pin-toggle');

    if (header.querySelector('.resized-sticky-pin')) {
        return;
    }

    const pin = document.createElement('button');
    pin.type = 'button';
    pin.classList.add('resized-sticky-pin', 'is-toggle', 'is-pinned');
    pin.setAttribute('aria-label', 'Unpin column');
    pin.setAttribute('title', 'Unpin column');
    pin.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        unpinColumn(header);
    });

    header.prepend(pin);
}

function refreshStickyPins(table) {
    if (!table) {
        return;
    }

    // Drop toggles left on headers the user just unpinned; the CSS ::before pin
    // covers every other pinned header.
    table.querySelectorAll('thead th[data-column-name]:not([data-sticky]) .resized-sticky-pin').forEach((pin) => {
        pin.closest('th')?.classList.remove('resized-has-pin-toggle');
        pin.remove();
    });

    table.querySelectorAll('thead th[data-column-name][data-sticky]').forEach((header) => {
        ensureStickyPinForHeader(header);
    });
}

function ensureResizeHandleForHeader(header) {
    if (!header?.hasAttribute('data-column-name')) {
        return;
    }

    header.classList.add('group/column-resize');
}

function refreshResizeHandles(table) {
    if (!table) {
        return;
    }

    table.querySelectorAll('thead th[data-column-name]').forEach((header) => {
        ensureResizeHandleForHeader(header);
    });
}

const boundResizeScrollWrappers = new WeakSet();

function getTableScrollWrapper(table) {
    return (
        table.closest('.fi-ta-content-ctn.fi-fixed-positioning-context')
        || table.closest('.fi-ta-content-ctn')
        || table.closest('.fi-ta-table-wrapper')
        || table.closest('[data-sticky-wrapper]')
    );
}

function getLastLeftStickyHeader(table) {
    const row = table.querySelector('thead tr');

    if (!row) {
        return null;
    }

    const stickyHeaders = Array.from(row.querySelectorAll('th[data-column-name]')).filter((header) => {
        return header.getAttribute('data-sticky-applied') === 'left'
            || header.getAttribute('data-sticky') === 'left';
    });

    return stickyHeaders[stickyHeaders.length - 1] ?? null;
}

function shouldShowResizeHandle(header, wrapper, table) {
    if (header.classList.contains('resized-column-is-resizing')) {
        return true;
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const isScrolled = wrapper.scrollLeft > 1;
    const isPinned = header.hasAttribute('data-sticky-applied') || header.hasAttribute('data-sticky');

    if (headerRect.right <= wrapperRect.left + 1 || headerRect.left >= wrapperRect.right - 1) {
        return false;
    }

    if (isScrolled && !isPinned) {
        const lastSticky = getLastLeftStickyHeader(table);

        if (lastSticky) {
            const stickyZoneRight = lastSticky.getBoundingClientRect().right;

            if (headerRect.right <= stickyZoneRight + 2) {
                return false;
            }
        }
    }

    return true;
}

function updateResizeHandleVisibility(wrapper, table) {
    const isScrolled = wrapper.scrollLeft > 1;
    table.classList.toggle('resized-column-is-scrolled', isScrolled);

    table.querySelectorAll('thead th[data-column-name]').forEach((header) => {
        header.classList.toggle(
            'resized-column-handle-visible',
            shouldShowResizeHandle(header, wrapper, table),
        );
    });
}

function updateResizeHandleVisibilityForWrapper(wrapper) {
    wrapper.querySelectorAll('.fi-ta-table, table.fi-ta-table').forEach((table) => {
        updateResizeHandleVisibility(wrapper, table);
    });
}

function bindResizeScroll(table) {
    const wrapper = getTableScrollWrapper(table);

    if (!wrapper || boundResizeScrollWrappers.has(wrapper)) {
        return;
    }

    boundResizeScrollWrappers.add(wrapper);

    const update = () => updateResizeHandleVisibilityForWrapper(wrapper);

    wrapper.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
}

function bindResizeHeaderHover(table) {
    const row = table.querySelector('thead tr');

    if (!row || row._resizeHoverBound) {
        return;
    }

    row._resizeHoverBound = true;

    row.addEventListener('mouseenter', () => {
        const wrapper = getTableScrollWrapper(table);

        if (wrapper) {
            updateResizeHandleVisibility(wrapper, table);
        }
    }, true);
}

function isTableReorderable(table) {
    return table?.querySelector('th[data-resized-reorderable="true"]') !== null;
}

function refreshTableChrome(table) {
    if (!table) {
        return;
    }

    refreshResizeHandles(table);
    refreshStickyPins(table);

    if (isTableReorderable(table)) {
        refreshDragHandles(table);
        setupSortableForTable(table);
    }

    bindResizeRows(table);
    bindResizeScroll(table);
    bindResizeHeaderHover(table);

    const wrapper = getTableScrollWrapper(table);

    if (wrapper) {
        updateResizeHandleVisibility(wrapper, table);
    }
}

const RESIZE_EDGE_ZONE_PX = 20;
const STICKY_PIN_ZONE_PX = 36;
const boundResizeRows = new WeakSet();

function getResizableHeaders(row) {
    return Array.from(row.querySelectorAll('th[data-column-name]'));
}

function isStickyHeader(header) {
    return header.hasAttribute('data-sticky')
        || header.hasAttribute('data-sticky-applied')
        || header.classList.contains('resized-sticky');
}

function isOnStickyPinZone(clientX, header) {
    if (!isStickyHeader(header)) {
        return false;
    }

    const { left } = header.getBoundingClientRect();

    return clientX >= left && clientX <= left + STICKY_PIN_ZONE_PX;
}

function isOnReorderGrip(header, clientX) {
    const dragHandle = header.querySelector('.resized-col-drag');

    if (!dragHandle) {
        return false;
    }

    const { left, right } = dragHandle.getBoundingClientRect();

    return clientX >= left - 4 && clientX <= right + 4;
}

function findHeaderForResizeAtX(row, clientX) {
    const headers = getResizableHeaders(row);

    for (let index = 0; index < headers.length; index++) {
        const header = headers[index];
        const { left, right } = header.getBoundingClientRect();

        // When a sticky header is covered by the next column, clicks on that
        // neighbour's left gutter should resize the preceding column.
        if (index > 0 && clientX >= left && clientX <= left + RESIZE_EDGE_ZONE_PX) {
            if (!isOnReorderGrip(header, clientX) && !isOnStickyPinZone(clientX, header)) {
                return headers[index - 1];
            }

            continue;
        }

        if (clientX >= right - RESIZE_EDGE_ZONE_PX && clientX <= right + 8) {
            if (!isOnStickyPinZone(clientX, header)) {
                return header;
            }
        }
    }

    return null;
}

function resolveResizeTarget(event) {
    if (event.target.closest('.resized-col-drag, .resized-sticky-pin')) {
        return null;
    }

    const row = event.target.closest('thead tr');

    if (!row) {
        return null;
    }

    const header = findHeaderForResizeAtX(row, event.clientX);

    if (!header) {
        return null;
    }

    return { header };
}

function beginColumnResize(header, event) {
    if (!header) {
        return;
    }

    const table = header.closest('.fi-ta-table');

    if (!table) {
        return;
    }

    const tableWrapper = header.closest('.fi-ta-content-ctn, .fi-ta-content')
        ?? header.closest('.fi-ta-ctn');

    if (!tableWrapper) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    header.classList.add('resized-column-is-resizing');
    document.body.classList.add('resized-column-resizing');

    const columnName = header.getAttribute('data-column-name');
    const columnId = columnIdFromHeader(header);
    const startX = event.pageX;
    const initialColumnWidth = Math.round(header.offsetWidth);
    const initialTableWidth = Math.round(table.offsetWidth);
    const initialTableWrapperWidth = Math.round(tableWrapper.offsetWidth);
    const minColumnWidth = 100;
    const maxColumnWidth = 1000;
    let newColumnWidth = 0;
    const usePointer = typeof event.pointerId === 'number';

    if (usePointer && event.target.setPointerCapture) {
        try {
            event.target.setPointerCapture(event.pointerId);
        } catch {
            // Ignore if capture is not supported on this target.
        }
    }

    const applyWidth = (width) => {
        header.style.maxWidth = `${width}px`;
        header.style.width = `${width}px`;
        header.style.minWidth = `${width}px`;

        table.querySelectorAll(`.${escapeClass(`fi-ta-cell-${columnId}`)}`).forEach((cell) => {
            cell.style.maxWidth = `${width}px`;
            cell.style.width = `${width}px`;
            cell.style.minWidth = `${width}px`;
        });
    };

    const onMove = (moveEvent) => {
        if (usePointer && moveEvent.pointerId !== event.pointerId) {
            return;
        }

        if (moveEvent.pageX === startX) {
            return;
        }

        newColumnWidth = Math.round(Math.min(
            maxColumnWidth,
            Math.max(
                minColumnWidth,
                initialColumnWidth + (moveEvent.pageX - startX),
            ),
        ));

        const newTableWidth = initialTableWidth - initialColumnWidth + newColumnWidth;
        table.style.width = `${newTableWidth > initialTableWrapperWidth ? newTableWidth : 'auto'}px`;

        applyWidth(newColumnWidth);
        scheduleStickyRefresh();
    };

    const onEnd = (endEvent) => {
        if (usePointer && endEvent.pointerId !== event.pointerId) {
            return;
        }

        header.classList.remove('resized-column-is-resizing');
        document.body.classList.remove('resized-column-resizing');

        if (usePointer && event.target.releasePointerCapture) {
            try {
                event.target.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore if capture was not set.
            }
        }

        if (newColumnWidth > 0 && columnName) {
            const wireRoot = header.closest('[wire\\:id]');
            const wireId = wireRoot?.getAttribute('wire:id');
            const component = wireId ? window.Livewire?.find(wireId) : null;

            if (component && typeof component.updateColumnWidth === 'function') {
                component.updateColumnWidth(columnName, newColumnWidth);
            }
        }

        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onEnd);
        document.removeEventListener('pointercancel', onEnd);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);

        const wrapper = getTableScrollWrapper(table);

        if (wrapper) {
            updateResizeHandleVisibility(wrapper, table);
        }

        scheduleStickyRefresh();
    };

    if (usePointer) {
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onEnd);
        document.addEventListener('pointercancel', onEnd);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
}

function handleResizePointerDown(event) {
    if (event.button !== 0) {
        return;
    }

    if (event.target.closest('.resized-col-drag, .resized-sticky-pin')) {
        return;
    }

    const target = resolveResizeTarget(event);

    if (!target) {
        return;
    }

    beginColumnResize(target.header, event);
}

function bindResizeRows(table) {
    table.querySelectorAll('thead tr').forEach((row) => {
        if (boundResizeRows.has(row)) {
            return;
        }

        boundResizeRows.add(row);
        row.addEventListener('pointerdown', handleResizePointerDown, { capture: true });
    });
}

function findResizedTables(root = document) {
    const tables = new Set();

    root.querySelectorAll('th[data-column-name]').forEach((header) => {
        const table = header.closest('.fi-ta-table, table.fi-ta-table');

        if (table) {
            tables.add(table);
        }
    });

    return tables;
}

function onOrderChangeForTable(table) {
    return (order) => {
        const wireRoot = table.closest('[wire\\:id]');
        const wireId = wireRoot?.getAttribute('wire:id');
        const component = wireId ? window.Livewire?.find(wireId) : null;

        if (component && typeof component.updateColumnOrder === 'function') {
            return component.updateColumnOrder(order);
        }
    };
}

function setupSortableForTable(table) {
    if (!isTableReorderable(table)) {
        return;
    }

    const row = table.querySelector('thead tr');

    if (!row) {
        return;
    }

    createSortableForRow(row, onOrderChangeForTable(table));
}

function bootstrapResizedTable(table) {
    if (!table) {
        return;
    }

    refreshTableChrome(table);
    scheduleStickyRefresh();
}

function bootstrapResizedTables(root = document) {
    findResizedTables(root).forEach((table) => bootstrapResizedTable(table));
}

function initExistingTables() {
    bootstrapResizedTables(document);
}

let livewireHooksBound = false;

function bindLivewireTableHooks() {
    if (livewireHooksBound || !window.Livewire) {
        return;
    }

    livewireHooksBound = true;

    const refresh = (payload = {}) => {
        requestAnimationFrame(() => {
            const root = payload.component?.el ?? payload.el ?? document;

            bootstrapResizedTables(root);
        });
    };

    window.Livewire.hook('commit', ({ succeed }) => {
        succeed(() => refresh({}));
    });

    try {
        window.Livewire.hook('morph.updated', refresh);
    } catch {
        // Hook may not exist in all Livewire versions.
    }
}

document.addEventListener('livewire:init', bindLivewireTableHooks, { once: true });
document.addEventListener('livewire:initialized', () => {
    bindLivewireTableHooks();
    bootstrapResizedTables(document);
}, { once: true });
document.addEventListener('livewire:navigated', () => bootstrapResizedTables(document));

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExistingTables, { once: true });
} else {
    initExistingTables();
}

document.addEventListener('resized-column:sticky-refreshed', (event) => {
    const table = event.target?.closest?.('.fi-ta-table, table.fi-ta-table')
        ?? (event.target?.matches?.('.fi-ta-table, table.fi-ta-table') ? event.target : null);

    if (!table) {
        return;
    }

    refreshTableChrome(table);

    const wrapper = getTableScrollWrapper(table);

    if (wrapper) {
        updateResizeHandleVisibility(wrapper, table);
    }
});

document.addEventListener('resized-column:table-scrolled', (event) => {
    const table = event.target?.closest?.('.fi-ta-table, table.fi-ta-table')
        ?? (event.target?.matches?.('.fi-ta-table, table.fi-ta-table') ? event.target : null);
    const wrapper = event.detail?.wrapper ?? (table ? getTableScrollWrapper(table) : null);

    if (table && wrapper) {
        updateResizeHandleVisibility(wrapper, table);
    }
});

document.addEventListener('alpine:init', () => {
    Alpine.data('resizedStickyPanel', () => ({
        open: false,
        columns: [],
        draftInitialized: false,

        toggle() {
            this.open = !this.open;

            if (this.open) {
                this.ensureDraft();
            }
        },

        tableRoot() {
            return this.$el.closest('[wire\\:id]') || this.$el.closest('.fi-ta') || document;
        },

        labelFor(th) {
            const btn = th.querySelector('.fi-ta-header-cell-sort-btn');
            let text = (btn && btn.getAttribute('aria-label')) || '';

            if (!text) {
                text = (th.textContent || '').replace(/[⋮]/g, '').trim();
            }

            return text || th.getAttribute('data-column-name');
        },

        refresh() {
            const root = this.tableRoot();
            this.columns = Array.from(root.querySelectorAll('thead [data-column-name]')).map((th) => ({
                name: th.getAttribute('data-column-name'),
                label: this.labelFor(th),
                pinned: th.hasAttribute('data-sticky'),
                locked: th.hasAttribute('data-sticky-locked'),
            }));
            this.draftInitialized = true;
        },

        ensureDraft() {
            if (!this.draftInitialized || !this.isDirty()) {
                this.refresh();
            }
        },

        livePinned() {
            const root = this.tableRoot();

            return Array.from(root.querySelectorAll('thead [data-column-name][data-sticky]'))
                .map((th) => th.getAttribute('data-column-name'))
                .filter(Boolean)
                .sort();
        },

        draftPinned() {
            return this.columns.filter((col) => col.pinned).map((col) => col.name).sort();
        },

        isDirty() {
            const live = this.livePinned();
            const draft = this.draftPinned();

            if (live.length !== draft.length) {
                return true;
            }

            return live.some((name, index) => name !== draft[index]);
        },

        toggleDraft(col) {
            if (col.locked) {
                col.pinned = true;

                return;
            }

            col.pinned = !col.pinned;
        },

        selectAll() {
            this.columns.forEach((col) => {
                col.pinned = true;
            });
        },

        deselectAll() {
            this.columns.forEach((col) => {
                if (!col.locked) {
                    col.pinned = false;
                }
            });
        },

        async apply() {
            if (!this.isDirty()) {
                return;
            }

            const names = this.columns
                .filter((col) => col.pinned || col.locked)
                .map((col) => col.name);
            await this.$wire.setStickyColumns(names);
            this.open = false;
            this.refresh();
            await this.$nextTick();
            scheduleStickyRefresh();
        },
    }));
});
