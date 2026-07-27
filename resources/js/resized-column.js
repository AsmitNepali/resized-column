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
        filter: '[data-sticky]',
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
                        const table = resolveTable(wireId, tableSelector);

                        if (!table) {
                            return;
                        }

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

                this.onColumnResized = () => {
                    scheduleStickyRefresh();
                };

                window.addEventListener('column-resized', this.onColumnResized);
            },

            initializeColumnLayout() {
                this.column.classList.add('relative');

                if (this.column.hasAttribute('data-sticky')) {
                    this.column.classList.remove('group/column-resize');
                    this.column.querySelector('.column-resize-handle-bar')?.remove();
                } else {
                    this.column.classList.add('group/column-resize');
                    this.createHandleBar();
                }

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
                this.handleBar = document.createElement('button');
                this.handleBar.type = 'button';
                this.handleBar.classList.add('column-resize-handle-bar');

                this.column.querySelector('.column-resize-handle-bar')?.remove();

                this.column.appendChild(this.handleBar);
                this.handleBar.addEventListener('mousedown', this.startResize(this.column));
            },

            startResize(column) {
                return (e) => {
                    if (!this.tableWrapper) {
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();
                    this.handleBar.classList.add('active');

                    const startX = e.pageX;
                    const initialColumnWidth = Math.round(column.offsetWidth);
                    const initialTableWidth = Math.round(this.table.offsetWidth);
                    const initialTableWrapperWidth = Math.round(this.tableWrapper.offsetWidth);

                    let newColumnWidth = 0;

                    const onMouseMove = (moveEvent) => {
                        if (moveEvent.pageX === startX) {
                            return;
                        }

                        newColumnWidth = Math.round(Math.min(
                            this.maxColumnWidth,
                            Math.max(
                                this.minColumnWidth,
                                initialColumnWidth + (moveEvent.pageX - startX) - 16,
                            ),
                        ));

                        const newTableWidth = initialTableWidth - initialColumnWidth + newColumnWidth;
                        this.table.style.width = `${newTableWidth > initialTableWrapperWidth ? newTableWidth : 'auto'}px`;

                        this.applyColumnWidth(column, newColumnWidth);
                        this.$dispatch('column-resized');
                    };

                    const onMouseUp = () => {
                        this.handleBar.classList.remove('active');

                        this.debounce(() => {
                            this.callLivewireMethod('updateColumnWidth', [columnName, newColumnWidth]);
                        }, this.debounceTime)();

                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                };
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
