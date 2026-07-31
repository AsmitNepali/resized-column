<?php

/**
 * Filament renders the toolbar's column manager and filter dropdowns into
 * .fi-dropdown-panel, which sits at z-index 20. The sticky thead comes later in
 * the DOM, so an equal z-index makes it paint over those panels.
 */
it('keeps the sticky thead below filament dropdown panels', function () {
    $css = file_get_contents(dirname(__DIR__, 2).'/resources/css/resized-column.css');

    preg_match(
        '/\.fi-ta-content-ctn \.fi-ta-table>thead>tr\s*\{(?<rules>[^}]*)\}/',
        $css,
        $matches,
    );

    expect($matches['rules'] ?? null)->not->toBeNull();

    preg_match('/z-index:\s*(?<value>\d+)/', $matches['rules'], $zIndex);

    expect($zIndex['value'] ?? null)->not->toBeNull()
        ->and((int) $zIndex['value'])->toBeLessThan(20)
        ->and((int) $zIndex['value'])->toBeGreaterThan(11);
});
