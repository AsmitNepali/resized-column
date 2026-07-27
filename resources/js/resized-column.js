import Sortable from 'sortablejs';
import { scheduleStickyRefresh } from './sticky-columns.js';

const wireMorphHooks = new Set();
const sortableInstances = new WeakMap();

function slugifyColumnName(name) {
    return name.replace(/_/g, '-').replace(/\s+/g, '-');
}

function columnIdFromHeader(header) {
    const xData = header.getAttribute('x-data') ?? '';
    const match = xData.match(/resizedColumn\(\s*`[^`]*`\s*,\s*`([^`]+)`/);

    if (match?.[1]) {
        return match[1];
    }

    return slugifyColumnName(header.getAttribute('data-column-name') ?? '');
}

function resolveTable(wireId, tableSelector) {
    return document.querySelector(`[wire\\:id="${wireId}"] ${tableSelector}`);
}

function escapeClass(className) {
    if (!className || typeof className !== 'string') {
        return '';
    }

    return className.replace(/\./g, '\\.');
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
        filter: '[data-sticky], .column-resize-handle-bar',
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
                    requestAnimationFrame(() => {
                        refreshDragHandles(table);
                        scheduleStickyRefresh();
                    });
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
    grip.setAttribute('title', 'Drag to reorder');
    grip.innerHTML = '&#8942;&#8942;';
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

function ensureStickyPinForHeader(header) {
    if (!header?.hasAttribute('data-sticky')) {
        return;
    }

    if (header.querySelector('.resized-sticky-pin')) {
        return;
    }

    const pin = document.createElement('span');
    pin.classList.add('resized-sticky-pin');
    pin.setAttribute('aria-hidden', 'true');
    pin.setAttribute('title', 'Pinned column');
    header.prepend(pin);
}

function refreshStickyPins(table) {
    if (!table) {
        return;
    }

    table.querySelectorAll('thead th[data-column-name][data-sticky]').forEach((header) => {
        ensureStickyPinForHeader(header);
    });
}

function ensureResizeHandleForHeader(header) {
    if (!header || !header.hasAttribute('data-column-name')) {
        return null;
    }

    header.classList.add('group/column-resize');

    const existing = header.querySelector('.column-resize-handle-bar');

    if (existing) {
        return existing;
    }

    const bar = document.createElement('button');
    bar.type = 'button';
    bar.classList.add('column-resize-handle-bar');
    bar.setAttribute('aria-label', 'Resize column');
    bar.setAttribute('title', 'Resize column');

    const line = document.createElement('span');
    line.classList.add('column-resize-handle-line');
    line.setAttribute('aria-hidden', 'true');
    bar.appendChild(line);

    header.appendChild(bar);

    return bar;
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

function isHandleWithinHeader(header, handle) {
    const headerRect = header.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const inset = 1;

    return handleRect.right <= headerRect.right + inset
        && handleRect.left >= headerRect.left - inset
        && handleRect.top >= headerRect.top - inset
        && handleRect.bottom <= headerRect.bottom + inset;
}

function shouldShowResizeHandle(header, handle, wrapper, table) {
    if (handle.classList.contains('active')) {
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

    return isHandleWithinHeader(header, handle);
}

function updateResizeHandleVisibility(wrapper, table) {
    const isScrolled = wrapper.scrollLeft > 1;
    table.classList.toggle('resized-column-is-scrolled', isScrolled);

    table.querySelectorAll('thead th[data-column-name] .column-resize-handle-bar').forEach((handle) => {
        const header = handle.closest('th[data-column-name]');

        if (!header) {
            return;
        }

        handle.classList.toggle('is-visible', shouldShowResizeHandle(header, handle, wrapper, table));
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

function refreshTableChrome(table) {
    if (!table) {
        return;
    }

    refreshResizeHandles(table);
    refreshStickyPins(table);
    bindResizeRows(table);
    bindResizeScroll(table);
    bindResizeHeaderHover(table);

    const wrapper = getTableScrollWrapper(table);

    if (wrapper) {
        updateResizeHandleVisibility(wrapper, table);
    }
}

const RESIZE_EDGE_ZONE_PX = 20;
const boundResizeRows = new WeakSet();

function getResizableHeaders(row) {
    return Array.from(row.querySelectorAll('th[data-column-name]')).filter((header) => {
        header.classList.add('group/column-resize');

        return header.querySelector('.column-resize-handle-bar') !== null;
    });
}

function findHeaderForResizeAtX(row, clientX) {
    const headers = getResizableHeaders(row);

    for (let index = 0; index < headers.length; index++) {
        const header = headers[index];
        const { left, right } = header.getBoundingClientRect();

        // When a sticky header is covered by the next column, clicks on that
        // neighbour's left gutter should resize the preceding column.
        if (index > 0 && clientX >= left && clientX <= left + RESIZE_EDGE_ZONE_PX) {
            return headers[index - 1];
        }

        if (clientX >= right - RESIZE_EDGE_ZONE_PX && clientX <= right + 8) {
            return header;
        }
    }

    return null;
}

function resolveResizeTarget(event) {
    const row = event.target.closest('thead tr');

    if (!row) {
        return null;
    }

    const handleBar = event.target.closest('.column-resize-handle-bar');

    if (handleBar) {
        const header = handleBar.closest('th[data-column-name]');

        if (header) {
            return { header, handleBar };
        }
    }

    const header = findHeaderForResizeAtX(row, event.clientX);

    if (!header) {
        return null;
    }

    const resolvedHandle = header.querySelector('.column-resize-handle-bar');

    if (!resolvedHandle) {
        return null;
    }

    return { header, handleBar: resolvedHandle };
}

function beginColumnResize(header, event, handleBar = null) {
    const activeHandleBar = handleBar ?? event.target.closest('.column-resize-handle-bar');

    if (!activeHandleBar || !header) {
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

    activeHandleBar.classList.add('active');
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

    if (usePointer) {
        activeHandleBar.setPointerCapture?.(event.pointerId);
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

        activeHandleBar.classList.remove('active');
        header.classList.remove('resized-column-is-resizing');
        document.body.classList.remove('resized-column-resizing');

        if (usePointer) {
            activeHandleBar.releasePointerCapture?.(event.pointerId);
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

    const target = resolveResizeTarget(event);

    if (!target) {
        return;
    }

    beginColumnResize(target.header, event, target.handleBar);
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

function initExistingTables() {
    document.querySelectorAll('.fi-ta-table, table.fi-ta-table').forEach((table) => {
        refreshTableChrome(table);
    });
}

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
    Alpine.data('resizedColumn', function (columnName, columnId, reorderable = false) {
        return {
            tableWrapper: null,
            table: null,
            column: null,
            minColumnWidth: 100,
            maxColumnWidth: 1000,
            handleBar: null,
            tableWrapperContentSelector: '.fi-ta-content-ctn, .fi-ta-content',
            tableSelector: '.fi-ta-table',
            tableBodyCellPrefix: 'fi-ta-cell-',
            debounceTime: 500,

            init() {
                this.column = this.$el;
                this.table = this.$el.closest(this.tableSelector);
                this.tableWrapper = this.$el.closest(this.tableWrapperContentSelector)
                    ?? this.$el.closest('.fi-ta-ctn');

                if (!this.column || !this.table) {
                    return;
                }

                this.initializeColumnLayout();
                this.setupReorder();
                this.registerTableHooks();

                this.$nextTick(() => {
                    scheduleStickyRefresh();
                    refreshTableChrome(this.table);
                });
            },

            isTableCoordinator() {
                const row = this.column.closest('thead tr');

                return row?.querySelector('[data-column-name]') === this.column;
            },

            registerTableHooks() {
                if (!this.isTableCoordinator()) {
                    return;
                }

                const root = this.$el.closest('[wire\\:id]');
                const wireId = root?.getAttribute('wire:id');

                if (!wireId || wireMorphHooks.has(wireId)) {
                    return;
                }

                wireMorphHooks.add(wireId);

                const tableSelector = this.tableSelector;

                window.Livewire.hook('morph.updated', ({ component }) => {
                    if (component?.id !== wireId) {
                        return;
                    }

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            const table = resolveTable(wireId, tableSelector);

                            if (!table) {
                                return;
                            }

                            refreshTableChrome(table);

                            if (reorderable) {
                                const row = table.querySelector('thead tr');

                                if (row) {
                                    refreshDragHandles(table);

                                    createSortableForRow(row, (order) => {
                                        const livewireComponent = window.Livewire?.find(wireId);

                                        if (livewireComponent && typeof livewireComponent.updateColumnOrder === 'function') {
                                            return livewireComponent.updateColumnOrder(order);
                                        }
                                    });
                                }
                            }

                            scheduleStickyRefresh();
                        });
                    });
                });

                this.onColumnResized = () => {
                    scheduleStickyRefresh();
                };

                window.addEventListener('column-resized', this.onColumnResized);
            },

            initializeColumnLayout() {
                this.column.classList.add('relative');
                this.column.classList.add('group/column-resize');
                this.createHandleBar();
                ensureStickyPinForHeader(this.column);

                if (reorderable && !this.column.hasAttribute('data-sticky')) {
                    this.createDragHandle();
                }
            },

            createDragHandle() {
                ensureDragHandleForHeader(this.column);
            },

            setupReorder() {
                if (!reorderable || !this.isTableCoordinator()) {
                    return;
                }

                const row = this.column.closest('thead tr');

                if (!row) {
                    return;
                }

                createSortableForRow(row, (order) => {
                    const wireRoot = this.$el.closest('[wire\\:id]');
                    const wireId = wireRoot?.getAttribute('wire:id');
                    const component = wireId ? window.Livewire?.find(wireId) : null;

                    if (component && typeof component.updateColumnOrder === 'function') {
                        return component.updateColumnOrder(order);
                    }
                });
            },

            createHandleBar() {
                this.handleBar = ensureResizeHandleForHeader(this.column);
            },

            startResize(column) {
                return (event) => beginColumnResize(column, event);
            },

            callLivewireMethod(method, params = []) {
                try {
                    if (this.$wire && typeof this.$wire[method] === 'function') {
                        return this.$wire[method](...params);
                    }
                } catch (error) {
                    // swallow — table will re-render on next Livewire round-trip
                }
            },

            applyColumnWidth(column, width) {
                this.setColumnWidthAttribute(column, width);

                const bodyCellId = this.tableBodyCellPrefix + columnId;
                const bodyCells = this.table.querySelectorAll(`.${escapeClass(bodyCellId)}`);

                bodyCells.forEach((cell) => {
                    this.setColumnWidthAttribute(cell, width);

                    if (!cell.classList.contains('resized-sticky')) {
                        cell.style.overflow = 'hidden';
                    } else {
                        cell.style.removeProperty('overflow');
                    }
                });
            },

            setColumnWidthAttribute(column, width) {
                column.style.maxWidth = `${width}px`;
                column.style.width = `${width}px`;
                column.style.minWidth = `${width}px`;
            },

            debounce(func, wait) {
                let debounceItem;

                return function executedFunction(...args) {
                    clearTimeout(debounceItem);
                    debounceItem = setTimeout(() => {
                        func(...args);
                    }, wait);
                };
            },
        };
    });

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
