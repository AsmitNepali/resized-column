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

it('lifts the table toolbar above the sticky thead', function () {
    $css = file_get_contents(dirname(__DIR__, 2).'/resources/css/resized-column.css');

    preg_match(
        '/\.fi-ta-ctn \.fi-ta-header-ctn\s*\{(?<rules>[^}]*)\}/',
        $css,
        $matches,
    );

    expect($matches['rules'] ?? null)->not->toBeNull()
        ->and($matches['rules'])->toContain('position: relative');

    preg_match('/z-index:\s*(?<value>\d+)/', $matches['rules'], $zIndex);

    // Above the thead (19) so toolbar dropdowns are never painted over, below
    // Filament's topbar/sidebar chrome (30) so nav menus stay on top.
    expect($zIndex['value'] ?? null)->not->toBeNull()
        ->and((int) $zIndex['value'])->toBeGreaterThan(19)
        ->and((int) $zIndex['value'])->toBeLessThan(30);
});

it('lifts the toolbar above filament chrome while a toolbar modal is open', function () {
    $css = file_get_contents(dirname(__DIR__, 2).'/resources/css/resized-column.css');

    preg_match(
        '/\.fi-ta-ctn \.fi-ta-header-ctn:has\(\.fi-modal\.fi-modal-open\)\s*\{(?<rules>[^}]*)\}/',
        $css,
        $matches,
    );

    expect($matches['rules'] ?? null)->not->toBeNull();

    preg_match('/z-index:\s*(?<value>\d+)/', $matches['rules'], $zIndex);

    // A slide-over/modal column manager renders inside the toolbar, so the
    // toolbar's stacking context must clear the topbar (30) and the modal
    // overlay (40) while the modal is open.
    expect($zIndex['value'] ?? null)->not->toBeNull()
        ->and((int) $zIndex['value'])->toBeGreaterThan(40);
});
