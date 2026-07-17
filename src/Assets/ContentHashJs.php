<?php

namespace Asmit\ResizedColumn\Assets;

use Filament\Support\Assets\Js;

/**
 * A Js asset whose cache-busting version is a hash of the file's contents,
 * instead of the package's (static) Composer version. This guarantees the
 * `?v=` query changes whenever the built asset changes, so browsers always
 * refetch after a rebuild — no version bump or hard refresh required.
 */
class ContentHashJs extends Js
{
    public function getVersion(): string
    {
        $path = $this->getPath();

        if ($path && is_file($path)) {
            return substr(md5_file($path), 0, 8);
        }

        return parent::getVersion();
    }
}
