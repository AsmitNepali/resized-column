// Debug script for ResizedColumn drag and drop functionality
console.log('🔧 ResizedColumn Debug Script Loaded');

// Enhanced debug function to test column ordering
window.debugResizedColumn = {
    testColumnOrder: function () {
        console.log('🧪 Testing column ordering...');

        // Find all draggable columns
        const columns = document.querySelectorAll('[data-column-name][draggable="true"]');
        console.log(`📊 Found ${columns.length} draggable columns:`);

        columns.forEach((column, index) => {
            const name = column.getAttribute('data-column-name');
            const isDraggable = column.getAttribute('draggable') === 'true';
            const hasAlpineData = column.hasAttribute('x-data');
            console.log(`  ${index + 1}. ${name} - Draggable: ${isDraggable}, Alpine: ${hasAlpineData}`);
        });

        return columns;
    },

    testLivewireConnection: function () {
        console.log('🔗 Testing Livewire connection...');

        // Check if Livewire is available
        console.log('🔍 Alpine.js available:', typeof Alpine !== 'undefined');
        console.log('🔍 window.Livewire available:', typeof window.Livewire !== 'undefined');

        // Find Livewire component
        const wireElement = document.querySelector('[wire\\:id]');
        if (wireElement) {
            const wireId = wireElement.getAttribute('wire:id');
            console.log('✅ Found Livewire component with ID:', wireId);

            if (window.Livewire) {
                const component = window.Livewire.find(wireId);
                console.log('🔍 Livewire component found:', !!component);
                if (component) {
                    console.log('🔍 updateColumnOrder method available:', typeof component.updateColumnOrder === 'function');
                    console.log('🔍 updateColumnWidth method available:', typeof component.updateColumnWidth === 'function');
                }
            }
        } else {
            console.log('❌ No Livewire component found');
        }
    },

    simulateColumnReorder: function () {
        console.log('🎬 Simulating column reorder...');

        const testOrder = {
            'name': 0,
            'email': 1,
            'created_at': 2
        };

        // Try to find the first column with Alpine.js data
        const firstColumn = document.querySelector('[data-column-name][x-data]');
        if (firstColumn) {
            // Try to access the Alpine.js component
            if (firstColumn._x_dataStack && firstColumn._x_dataStack[0]) {
                const alpine = firstColumn._x_dataStack[0];
                if (alpine.saveColumnOrder) {
                    console.log('✅ Calling saveColumnOrder directly via Alpine.js');
                    alpine.saveColumnOrder(testOrder);
                } else {
                    console.log('❌ saveColumnOrder method not found in Alpine.js component');
                }
            } else {
                console.log('❌ Alpine.js data stack not found');
            }
        }

        console.log('📤 Event dispatched with order:', testOrder);
    },

    inspectDragState: function () {
        console.log('🔍 Inspecting drag state...');
        console.log('Global drag state:', window.resizedColumnDragState);

        const draggingColumns = document.querySelectorAll('.column-dragging');
        const dragOverColumns = document.querySelectorAll('.column-drag-over');
        const tableDragging = document.querySelectorAll('.table-dragging');

        console.log(`📊 Dragging columns: ${draggingColumns.length}`);
        console.log(`📊 Drag over columns: ${dragOverColumns.length}`);
        console.log(`📊 Table dragging: ${tableDragging.length}`);

        return {
            globalState: window.resizedColumnDragState,
            draggingColumns,
            dragOverColumns,
            tableDragging
        };
    },

    checkDatabase: function () {
        console.log('💾 To check database, run in Laravel tinker:');
        console.log('php artisan tinker');
        console.log('\\Asmit\\ResizedColumn\\Models\\TableSetting::all()');
        console.log('Schema::hasTable("table_settings")');
        console.log('Schema::hasColumn("table_settings", "column_order")');
    },

    testDragDrop: function () {
        console.log('🧪 Testing drag and drop programmatically...');

        const columns = document.querySelectorAll('[data-column-name][draggable="true"]');
        if (columns.length < 2) {
            console.log('❌ Need at least 2 draggable columns to test');
            return;
        }

        const sourceCol = columns[0];
        const targetCol = columns[1];

        console.log(`🎬 Simulating drag from ${sourceCol.getAttribute('data-column-name')} to ${targetCol.getAttribute('data-column-name')}`);

        // Simulate drag start
        const dragStartEvent = new DragEvent('dragstart', {
            dataTransfer: new DataTransfer(),
            bubbles: true
        });
        dragStartEvent.dataTransfer.setData('text/plain', sourceCol.getAttribute('data-column-name'));
        sourceCol.dispatchEvent(dragStartEvent);

        // Wait a bit
        setTimeout(() => {
            // Simulate drop
            const dropEvent = new DragEvent('drop', {
                dataTransfer: dragStartEvent.dataTransfer,
                bubbles: true,
                clientX: targetCol.getBoundingClientRect().left + 10
            });
            targetCol.dispatchEvent(dropEvent);

            console.log('✅ Drag and drop simulation completed');
        }, 100);
    },

    clearDragState: function () {
        console.log('🧹 Clearing all drag states...');

        // Clear global state
        window.resizedColumnDragState = null;

        // Remove all drag classes
        const allColumns = document.querySelectorAll('[data-column-name]');
        allColumns.forEach(col => {
            col.classList.remove(
                'column-dragging',
                'column-drag-over',
                'drop-before',
                'drop-after',
                'column-switching'
            );
        });

        // Remove table dragging class
        const tables = document.querySelectorAll('.table-dragging');
        tables.forEach(table => {
            table.classList.remove('table-dragging');
        });

        console.log('✅ Drag state cleared');
    },

    testVisualSwitching: function () {
        console.log('🎬 Testing visual column switching...');

        const columns = document.querySelectorAll('[data-column-name][draggable="true"]');
        if (columns.length < 2) {
            console.log('❌ Need at least 2 draggable columns to test');
            return;
        }

        const firstCol = columns[0];
        const secondCol = columns[1];

        console.log(`🔄 Testing visual switch between ${firstCol.getAttribute('data-column-name')} and ${secondCol.getAttribute('data-column-name')}`);

        // Add switching animation classes
        columns.forEach(col => col.classList.add('column-switching'));

        // Simulate the visual switch
        const container = firstCol.parentNode;
        container.insertBefore(firstCol, secondCol.nextSibling);

        setTimeout(() => {
            console.log('🔄 Reversing the switch...');
            container.insertBefore(firstCol, secondCol);

            setTimeout(() => {
                columns.forEach(col => col.classList.remove('column-switching'));
                console.log('✅ Visual switching test completed');
            }, 300);
        }, 1500);
    },

    inspectSwitchState: function () {
        console.log('🔍 Inspecting visual switch state...');

        const switchingColumns = document.querySelectorAll('.column-switching');
        const globalState = window.resizedColumnDragState;

        console.log(`📊 Switching columns: ${switchingColumns.length}`);
        console.log('🌍 Global drag state:', globalState);

        if (globalState?.originalOrder) {
            console.log('📋 Original order stored:', globalState.originalOrder.map(c => c.columnName));
        }

        return {
            switchingColumns,
            globalState,
            originalOrder: globalState?.originalOrder
        };
    }
};

// Auto-run some basic checks when the page loads
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        console.log('🔧 === ResizedColumn Debug Info ===');
        window.debugResizedColumn.testColumnOrder();
        window.debugResizedColumn.testLivewireConnection();

        console.log('🔧 === Available Debug Methods ===');
        console.log('🔧 - debugResizedColumn.testColumnOrder()');
        console.log('🔧 - debugResizedColumn.testLivewireConnection()');
        console.log('🔧 - debugResizedColumn.simulateColumnReorder()');
        console.log('🔧 - debugResizedColumn.inspectDragState()');
        console.log('🔧 - debugResizedColumn.testDragDrop()');
        console.log('🔧 - debugResizedColumn.clearDragState()');
        console.log('🔧 - debugResizedColumn.testVisualSwitching()');
        console.log('🔧 - debugResizedColumn.inspectSwitchState()');
        console.log('🔧 - debugResizedColumn.checkDatabase()');
    }, 1000);
});

// Listen for custom events
document.addEventListener('column-order-changed', function (event) {
    console.log('📡 Column order changed event received:', event.detail);
});

// Global error handler for drag and drop
window.addEventListener('error', function (event) {
    if (event.message.includes('drag') || event.message.includes('column')) {
        console.error('🔥 Drag and drop error:', event.error);
    }
});

console.log('✅ Debug script ready!'); 