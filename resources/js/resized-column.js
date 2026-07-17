import Sortable from 'sortablejs';

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
                this.tableWrapper = this.$el.closest(this.tableWrapperContentSelector);

                if (!this.column || !this.table || !this.tableWrapper) return null;

                this.initializeColumnLayout();
                this.setupReorder();
                this.onLivewireUpdate();

                this.positionStickyColumns();
                window.addEventListener('column-resized', () => this.positionStickyColumns());
            },

            initializeColumnLayout() {
                this.column.classList.add('relative', 'group/column-resize');
                this.createHandleBar();
                if (reorderable && !this.column.hasAttribute('data-sticky')) this.createDragHandle();
                this.createStickyPin();
            },

            pinSvg() {
                return '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M9.828.722a.5.5 0 0 1 .707 0l3.943 3.944a.5.5 0 0 1-.219.828l-2.31.66-2.573 2.573 1.06 3.006a.5.5 0 0 1-.117.518l-.707.707a.5.5 0 0 1-.707 0L6.229 9.7l-3.238 3.238a.5.5 0 0 1-.707-.707L5.522 8.99 2.79 6.257a.5.5 0 0 1 0-.707l.707-.707a.5.5 0 0 1 .518-.117l3.006 1.06 2.573-2.573.66-2.31a.5.5 0 0 1 .174-.281z"/></svg>';
            },

            createStickyPin() {
                const pinned = this.column.hasAttribute('data-sticky');
                const existing = this.column.querySelector('.resized-sticky-pin');

                // Only pinned columns show a small static indicator; toggling
                // happens in the toolbar "Pin columns" panel.
                if (!pinned) {
                    if (existing) existing.remove();
                    return;
                }

                if (existing) return;

                const pin = document.createElement('span');
                pin.classList.add('resized-sticky-pin');
                pin.setAttribute('title', 'Pinned column');
                pin.innerHTML = this.pinSvg();

                const target = this.column.querySelector('.fi-ta-header-cell-sort-btn') || this.column;
                target.prepend(pin);
            },

            createDragHandle() {
                this.column.classList.add('resized-reorderable-col');
                if (this.column.querySelector('.resized-col-drag')) return;
                const grip = document.createElement('button');
                grip.type = 'button';
                grip.classList.add('resized-col-drag');
                grip.setAttribute('title', 'Drag to reorder');
                grip.innerHTML = '&#8942;&#8942;';
                this.column.prepend(grip);
            },

            setupReorder() {
                if (!reorderable) return;

                const row = this.column.closest('thead tr');
                if (!row || row.dataset.resizedSortable === 'true') return;
                row.dataset.resizedSortable = 'true';

                Sortable.create(row, {
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
                            .map(el => el.getAttribute('data-column-name'));
                        this.callLivewireMethod('updateColumnOrder', [order]);
                    },
                });
            },

            createHandleBar() {
                this.handleBar = document.createElement('button');
                this.handleBar.type = 'button';
                this.handleBar.classList.add('column-resize-handle-bar');

                const existingHandleBar = this.column.querySelector('.column-resize-handle-bar');
                if (existingHandleBar) existingHandleBar.remove();

                this.column.appendChild(this.handleBar);
                this.handleBar.addEventListener('mousedown', this.startResize(this.column));
            },

            startResize(column) {
                return (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleBar.classList.add('active');

                    const startX = e.pageX;
                    const initialColumnWidth = Math.round(column.offsetWidth);
                    const initialTableWidth = Math.round(this.table.offsetWidth);
                    const initialTableWrapperWidth = Math.round(this.tableWrapper.offsetWidth);

                    let newColumnWidth = 0;

                    const onMouseMove = (e) => {
                        if (e.pageX === startX) return;

                        newColumnWidth = Math.round(Math.min(this.maxColumnWidth, Math.max(this.minColumnWidth, initialColumnWidth + (e.pageX - startX) - 16)));

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
                const bodyCells = this.table.querySelectorAll(`.${this.getEscapedSelectorFromClass(bodyCellId)}`);
                bodyCells.forEach(cell => {
                    this.setColumnWidthAttribute(cell, width);
                    cell.style.overflow = 'hidden';
                });
            },

            setColumnWidthAttribute(column, width) {
                column.style.maxWidth = `${width}px`;
                column.style.width = `${width}px`;
                column.style.minWidth = `${width}px`;
            },

            getEscapedSelectorFromClass(className) {
                if (!className || typeof className !== 'string') return '';
                return className.replace(/\./g, "\\.");
            },

            positionStickyColumns() {
                if (!this.table) return;

                const stickyHeaders = Array.from(
                    this.table.querySelectorAll('thead [data-sticky="left"]')
                );
                if (!stickyHeaders.length) return;

                let offset = 0;
                stickyHeaders.forEach((header, index) => {
                    const columnName = header.getAttribute('data-column-name');
                    const zIndex = 20 - index;

                    this.applyStickyStyle(header, offset, zIndex);
                    // Header cells have no opaque background of their own
                    // (Filament tints a wrapper / uses translucency), so a
                    // sticky header would let scrolled columns bleed through.
                    // Paint it with the real header colour so it stays solid.
                    header.style.backgroundColor = this.opaqueBackground(header);

                    const bodyId = this.tableBodyCellPrefix
                        + this.slugifyColumnName(columnName);
                    this.table
                        .querySelectorAll(`.${this.getEscapedSelectorFromClass(bodyId)}`)
                        .forEach(cell => this.applyStickyStyle(cell, offset, zIndex - 1));

                    offset += header.offsetWidth;
                });
            },

            applyStickyStyle(el, left, zIndex) {
                el.style.position = 'sticky';
                el.style.left = `${left}px`;
                el.style.zIndex = `${zIndex}`;
            },

            // First fully-opaque background up the ancestor chain (including the
            // element itself). Matches the header's visible colour on any theme
            // instead of hard-coding one that breaks on custom palettes.
            opaqueBackground(el) {
                let node = el;
                while (node && node !== document.documentElement) {
                    const match = getComputedStyle(node)
                        .backgroundColor.match(/^rgba?\(([^)]+)\)/);
                    if (match) {
                        const [r, g, b, a] = match[1].split(',').map(v => parseFloat(v));
                        if (a === undefined || a >= 1) return `rgb(${r}, ${g}, ${b})`;
                    }
                    node = node.parentElement;
                }
                return 'rgb(255, 255, 255)';
            },

            slugifyColumnName(name) {
                return name.replace(/_/g, '-').replace(/\s+/g, '-');
            },

            debounce(func, wait) {
                let debounceItem;
                return function executedFunction(...args) {
                    clearTimeout(debounceItem);
                    const later = () => {
                        clearTimeout(debounceItem);
                        func(...args);
                    };
                    debounceItem = setTimeout(later, wait);
                };
            },

            onLivewireUpdate() {
                window.Livewire.hook('morph.updated', () => {
                    this.initializeColumnLayout();
                    this.setupReorder();
                    this.positionStickyColumns();
                });
            },
        };
    });

    Alpine.data('resizedStickyPanel', () => ({
        open: false,
        columns: [],

        toggle() {
            this.open = !this.open;
            if (this.open) this.refresh();
        },

        tableRoot() {
            // Prefer the Livewire component root — it always wraps both the
            // toolbar (where this panel lives) and the table, so the header
            // scan is reliable regardless of Filament's inner wrapper classes.
            return this.$el.closest('[wire\\:id]') || this.$el.closest('.fi-ta') || document;
        },

        labelFor(th) {
            const btn = th.querySelector('.fi-ta-header-cell-sort-btn');
            let text = (btn && btn.getAttribute('aria-label')) || '';
            if (!text) text = (th.textContent || '').replace(/[⋮]/g, '').trim();
            return text || th.getAttribute('data-column-name');
        },

        refresh() {
            const root = this.tableRoot();
            this.columns = Array.from(root.querySelectorAll('thead [data-column-name]')).map((th) => ({
                name: th.getAttribute('data-column-name'),
                label: this.labelFor(th),
                pinned: th.hasAttribute('data-sticky'),
            }));
        },

        togglePin(col) {
            col.pinned = !col.pinned;
            this.$wire.toggleColumnSticky(col.name);
        },
    }));
});
