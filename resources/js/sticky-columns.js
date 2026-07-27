/**
 * Sticky column engine adapted from zeeshantariq/filament-sticky-columns
 * (MIT). Reads [data-sticky] on Filament table cells and applies offsets.
 */

const ATTR = 'data-sticky';
const ATTR_OFFSET = 'data-sticky-offset';
const ATTR_Z = 'data-sticky-z-index';
const APPLIED_ATTR = 'data-sticky-applied';
const PIN_ATTR = 'data-sticky-pin-icon';

let bootScheduled = false;
let stickyRefreshPending = false;
let livewireHooksBound = false;

function getPossibleTableWrappersSelector() {
    return [
        '.fi-ta-table-wrapper',
        '.fi-ta-content-ctn.fi-fixed-positioning-context',
        '.fi-ta-content-ctn',
        '[data-sticky-wrapper]',
    ].join(', ');
}

function findNearestHorizontalScrollParent(el) {
    let cur = el?.parentElement ?? null;

    while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        const canScrollX =
            (cs.overflowX === 'auto' || cs.overflowX === 'scroll')
            && cur.scrollWidth > cur.clientWidth;

        if (canScrollX) {
            return cur;
        }

        cur = cur.parentElement;
    }

    return null;
}

function getStickyDecl(cell) {
    if (!cell) {
        return null;
    }

    if (cell.hasAttribute?.(ATTR)) {
        return cell;
    }

    if (cell.querySelector) {
        return cell.querySelector(`[${ATTR}]`);
    }

    return null;
}

function resetStickyPresentation() {
    document.querySelectorAll(`[${PIN_ATTR}], .resized-sticky-pin`).forEach((el) => el.remove());

    document.querySelectorAll(`[${APPLIED_ATTR}]`).forEach((el) => {
        el.removeAttribute(APPLIED_ATTR);
        el.classList.remove('sticky-shadow-active');
        el.style.position = '';
        el.style.left = '';
        el.style.right = '';
        el.style.zIndex = '';
        el.style.removeProperty('overflow');
    });
}

function getReferenceCells(table) {
    const headerCells = Array.from(table.querySelectorAll('thead th'));

    if (headerCells.some((cell) => getStickyDecl(cell))) {
        return headerCells;
    }

    const firstBodyRow = table.querySelector('tbody tr');

    if (firstBodyRow) {
        return Array.from(firstBodyRow.children);
    }

    return Array.from(table.querySelectorAll('th, td'));
}

function buildStickyMap(cells) {
    const map = {};
    let leftAcc = 0;
    let rightAcc = 0;
    let leftStickyIndex = 0;
    let rightStickyIndex = 0;

    cells.forEach((cell, idx) => {
        const decl = getStickyDecl(cell);

        if (decl?.getAttribute(ATTR) === 'left') {
            const manual = decl.getAttribute(ATTR_OFFSET);

            map[idx] = {
                position: 'left',
                offset: manual !== null ? parseInt(manual, 10) : leftAcc,
                zIndex: parseInt(
                    decl.getAttribute(ATTR_Z) || String(10 + leftStickyIndex),
                    10,
                ),
            };

            leftAcc += cell.offsetWidth || 0;
            leftStickyIndex++;
        }
    });

    [...cells].reverse().forEach((cell, revIdx) => {
        const idx = cells.length - 1 - revIdx;
        const decl = getStickyDecl(cell);

        if (decl?.getAttribute(ATTR) === 'right') {
            const manual = decl.getAttribute(ATTR_OFFSET);

            map[idx] = {
                position: 'right',
                offset: manual !== null ? parseInt(manual, 10) : rightAcc,
                zIndex: parseInt(
                    decl.getAttribute(ATTR_Z) || String(10 + rightStickyIndex),
                    10,
                ),
            };

            rightAcc += cell.offsetWidth || 0;
            rightStickyIndex++;
        }
    });

    return map;
}

function getCellColSpan(cell) {
    const span = cell.colSpan;

    return span && span > 1 ? span : 1;
}

function ensureStickyHeaderPin(cell) {
    if (cell.querySelector(`[${PIN_ATTR}], .resized-sticky-pin`)) {
        return;
    }

    const target =
        cell.querySelector('.fi-ta-header-cell-sort-btn')
        || cell.firstElementChild
        || cell;

    const pin = document.createElement('span');
    pin.setAttribute(PIN_ATTR, '');
    pin.classList.add('resized-sticky-pin');
    pin.setAttribute('aria-hidden', 'true');
    pin.setAttribute('title', 'Pinned column');
    pin.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M9.828.722a.5.5 0 0 1 .707 0l3.943 3.944a.5.5 0 0 1-.219.828l-2.31.66-2.573 2.573 1.06 3.006a.5.5 0 0 1-.117.518l-.707.707a.5.5 0 0 1-.707 0L6.229 9.7l-3.238 3.238a.5.5 0 0 1-.707-.707L5.522 8.99 2.79 6.257a.5.5 0 0 1 0-.707l.707-.707a.5.5 0 0 1 .518-.117l3.006 1.06 2.573-2.573.66-2.31a.5.5 0 0 1 .174-.281z"/></svg>';

    target.insertBefore(pin, target.firstChild);
}

function applyStickyStyles(cell, config, isHeader) {
    cell.style.position = 'sticky';
    cell.style[config.position] = `${config.offset}px`;
    cell.style.zIndex = String(isHeader ? config.zIndex + 10 : config.zIndex);
    cell.setAttribute(APPLIED_ATTR, config.position);

    if (isHeader) {
        ensureStickyHeaderPin(cell);
    }
}

function applyStickyToRow(cells, stickyMap, isHeader) {
    let logicalIdx = 0;

    cells.forEach((cell) => {
        const colSpan = getCellColSpan(cell);

        if (colSpan > 1) {
            logicalIdx += colSpan;

            return;
        }

        const config = stickyMap[logicalIdx];

        if (config) {
            applyStickyStyles(cell, config, isHeader);
        }

        logicalIdx += colSpan;
    });
}

function processTable(table) {
    const referenceCells = getReferenceCells(table);
    const stickyMap = buildStickyMap(referenceCells);

    if (!Object.keys(stickyMap).length) {
        return;
    }

    ['thead', 'tbody', 'tfoot'].forEach((section) => {
        table.querySelectorAll(`${section} tr`).forEach((row) => {
            applyStickyToRow(Array.from(row.children), stickyMap, section === 'thead');
        });
    });
}

function applyStickyColumns() {
    document.querySelectorAll('.fi-ta-table, table.fi-ta-table').forEach((table) => {
        if (!table.querySelector(`[${ATTR}]`)) {
            return;
        }

        const existingWrapper =
            table.closest(getPossibleTableWrappersSelector())
            || table.querySelector(getPossibleTableWrappersSelector());

        if (!existingWrapper) {
            const scrollParent = findNearestHorizontalScrollParent(table);

            if (scrollParent) {
                scrollParent.setAttribute('data-sticky-wrapper', 'true');
            }
        }

        table.style.borderCollapse = 'separate';
        table.style.borderSpacing = '0';

        processTable(table);
    });
}

function getScrollWrapperForTable(table) {
    return (
        table.closest('.fi-ta-content-ctn.fi-fixed-positioning-context')
        || table.closest('.fi-ta-content-ctn')
        || table.closest('.fi-ta-table-wrapper')
        || table.closest('[data-sticky-wrapper]')
        || findNearestHorizontalScrollParent(table)
    );
}

function updateTableScrollShadow(wrapper, table) {
    const atLeft = wrapper.scrollLeft <= 1;
    const atRight = wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth - 1;

    table
        .querySelectorAll('.sticky-shadow-active')
        .forEach((el) => el.classList.remove('sticky-shadow-active'));

    const headerRow = table.querySelector('thead tr');

    if (!headerRow) {
        return;
    }

    if (!atLeft) {
        const leftStickyHeaders = Array.from(headerRow.children).filter(
            (cell) => cell.getAttribute(APPLIED_ATTR) === 'left',
        );
        const lastLeftSticky = leftStickyHeaders[leftStickyHeaders.length - 1];

        if (lastLeftSticky) {
            const columnIndex = Array.from(headerRow.children).indexOf(lastLeftSticky);

            table.querySelectorAll('thead tr, tbody tr, tfoot tr').forEach((row) => {
                row.children[columnIndex]?.classList.add('sticky-shadow-active');
            });
        }
    }

    if (!atRight) {
        const rightStickyHeaders = Array.from(headerRow.children).filter(
            (cell) => cell.getAttribute(APPLIED_ATTR) === 'right',
        );
        const firstRightSticky = rightStickyHeaders[0];

        if (firstRightSticky) {
            const columnIndex = Array.from(headerRow.children).indexOf(firstRightSticky);

            table.querySelectorAll('thead tr, tbody tr, tfoot tr').forEach((row) => {
                row.children[columnIndex]?.classList.add('sticky-shadow-active');
            });
        }
    }
}

function updateWrapperScrollShadows(wrapper) {
    wrapper.querySelectorAll('.fi-ta-table, table.fi-ta-table').forEach((table) => {
        updateTableScrollShadow(wrapper, table);
    });
}

function bindScrollShadows() {
    document.querySelectorAll('.fi-ta-table, table.fi-ta-table').forEach((table) => {
        if (!table.querySelector(`[${ATTR}]`)) {
            return;
        }

        const wrapper = getScrollWrapperForTable(table);

        if (!wrapper) {
            return;
        }

        if (!wrapper._resizedStickyBound) {
            wrapper._resizedStickyBound = true;

            const update = () => updateWrapperScrollShadows(wrapper);

            wrapper.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update, { passive: true });
        }

        updateTableScrollShadow(wrapper, table);
    });
}

export function refreshStickyColumns() {
    resetStickyPresentation();
    applyStickyColumns();
    bindScrollShadows();
}

export function scheduleStickyRefresh() {
    stickyRefreshPending = true;

    if (bootScheduled) {
        return;
    }

    bootScheduled = true;

    const run = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bootScheduled = false;

                if (!stickyRefreshPending) {
                    return;
                }

                stickyRefreshPending = false;
                refreshStickyColumns();

                if (stickyRefreshPending) {
                    scheduleStickyRefresh();
                }
            });
        });
    };

    run();
}

function bindLivewireHooks() {
    if (!window.Livewire || livewireHooksBound) {
        return;
    }

    livewireHooksBound = true;

    window.Livewire.hook('commit', ({ succeed }) => {
        succeed(scheduleStickyRefresh);
    });

    try {
        window.Livewire.hook('morph.updated', scheduleStickyRefresh);
    } catch {
        // Hook may not exist in all Livewire versions.
    }
}

export function initStickyColumns() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', refreshStickyColumns, { once: true });
    } else {
        refreshStickyColumns();
    }

    bindLivewireHooks();
    document.addEventListener('livewire:init', bindLivewireHooks);
    document.addEventListener('livewire:initialized', bindLivewireHooks);
    document.addEventListener('livewire:navigated', scheduleStickyRefresh);
    document.addEventListener('livewire:update', scheduleStickyRefresh);
    document.addEventListener('alpine:initialized', refreshStickyColumns);

    window.ResizedColumnSticky = { refresh: refreshStickyColumns };
}

initStickyColumns();
