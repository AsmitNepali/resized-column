<?php

namespace Asmit\ResizedColumn\Assets;

use Filament\Support\Assets\Css;

/**
 * A Css asset whose cache-busting version is a hash of the file's contents,
 * instead of the package's (static) Composer version. Ensures the `?v=`
 * query changes whenever the stylesheet changes so browsers refetch it.
 */
class ContentHashCss extends Css
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
