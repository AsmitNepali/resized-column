<?php

it('ships built css and js assets in resources/dist', function () {
    $packageRoot = dirname(__DIR__, 2);

    expect($packageRoot.'/resources/dist/css/resized-column.css')->toBeFile()
        ->and($packageRoot.'/resources/dist/js/resized-column.js')->toBeFile()
        ->and(md5_file($packageRoot.'/resources/dist/css/resized-column.css'))
        ->toBe(md5_file($packageRoot.'/resources/css/resized-column.css'));
});

it('registers filament assets from the dist directory', function () {
    $providerPath = dirname(__DIR__, 2).'/src/ResizedColumnServiceProvider.php';
    $source = file_get_contents($providerPath);

    expect($source)
        ->toContain('../resources/dist/js/resized-column.js')
        ->toContain('../resources/dist/css/resized-column.css')
        ->not->toContain('../resources/css/resized-column.css');
});
