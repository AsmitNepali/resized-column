<?php

use Asmit\ResizedColumn\Assets\ContentHashCss;
use Asmit\ResizedColumn\Assets\ContentHashJs;

it('versions a css asset by its content hash', function () {
    $path = tempnam(sys_get_temp_dir(), 'rc').'.css';
    file_put_contents($path, '.a{color:red}');

    $asset = ContentHashCss::make('rc', $path);

    expect($asset->getVersion())->toBe(substr(md5_file($path), 0, 8));

    // Version changes when the file content changes.
    $before = $asset->getVersion();
    file_put_contents($path, '.a{color:blue}');
    expect($asset->getVersion())->not->toBe($before);

    unlink($path);
});

it('versions a js asset by its content hash', function () {
    $path = tempnam(sys_get_temp_dir(), 'rc').'.js';
    file_put_contents($path, 'console.log(1)');

    $asset = ContentHashJs::make('rc', $path);

    expect($asset->getVersion())->toBe(substr(md5_file($path), 0, 8));

    unlink($path);
});
