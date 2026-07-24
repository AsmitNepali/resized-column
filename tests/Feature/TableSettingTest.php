<?php

use Asmit\ResizedColumn\Models\TableSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('persists a setting and casts styles to an array', function () {
    $setting = TableSetting::create([
        'user_id' => 1,
        'resource' => 'App\\Filament\\Resources\\UserResource',
        'styles' => ['name' => '200px', 'email' => '150px'],
    ]);

    $fresh = TableSetting::find($setting->id);

    expect($fresh->styles)->toBe(['name' => '200px', 'email' => '150px']);
    expect($fresh->resource)->toBe('App\\Filament\\Resources\\UserResource');
});

it('allows null styles', function () {
    $setting = TableSetting::create([
        'user_id' => 1,
        'resource' => 'X',
        'styles' => null,
    ]);

    expect(TableSetting::find($setting->id)->styles)->toBeNull();
});
