<?php

use Asmit\ResizedColumn\ResizedColumnTableRegistry;

beforeEach(fn () => ResizedColumnTableRegistry::reset());

it('defaults to session-only persistence when unregistered', function () {
    expect(ResizedColumnTableRegistry::has('Some\\Component'))->toBeFalse();
    expect(ResizedColumnTableRegistry::isStickable('Some\\Component'))->toBeFalse();
    expect(ResizedColumnTableRegistry::isReorderable('Some\\Component'))->toBeFalse();
    expect(ResizedColumnTableRegistry::shouldPreserveOnDb('Some\\Component'))->toBeNull();
    expect(ResizedColumnTableRegistry::shouldPreserveOnSession('Some\\Component'))->toBeNull();
});

it('applies documented defaults on first register', function () {
    ResizedColumnTableRegistry::register('App\\Foo', stickable: true);

    expect(ResizedColumnTableRegistry::has('App\\Foo'))->toBeTrue();
    expect(ResizedColumnTableRegistry::isStickable('App\\Foo'))->toBeTrue();
    // null = unset, so panel-level preserveOnDB()/preserveOnSession() still apply
    expect(ResizedColumnTableRegistry::shouldPreserveOnDb('App\\Foo'))->toBeNull();
    expect(ResizedColumnTableRegistry::shouldPreserveOnSession('App\\Foo'))->toBeNull();
    expect(ResizedColumnTableRegistry::isReorderable('App\\Foo'))->toBeFalse();
});

it('merges successive registrations without clobbering prior flags', function () {
    ResizedColumnTableRegistry::register('App\\Bar', reorderable: true);
    ResizedColumnTableRegistry::register('App\\Bar', stickable: true);

    expect(ResizedColumnTableRegistry::isReorderable('App\\Bar'))->toBeTrue();
    expect(ResizedColumnTableRegistry::isStickable('App\\Bar'))->toBeTrue();
});

it('lets a later call override an earlier flag', function () {
    ResizedColumnTableRegistry::register('App\\Baz', preserveOnSession: true);
    ResizedColumnTableRegistry::register('App\\Baz', preserveOnSession: false);

    expect(ResizedColumnTableRegistry::shouldPreserveOnSession('App\\Baz'))->toBeFalse();
});

it('reset clears all configs', function () {
    ResizedColumnTableRegistry::register('App\\Qux', stickable: true);
    ResizedColumnTableRegistry::reset();

    expect(ResizedColumnTableRegistry::has('App\\Qux'))->toBeFalse();
});
