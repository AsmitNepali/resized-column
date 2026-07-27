<?php

uses(Asmit\ResizedColumn\Tests\TestCase::class)->in(__DIR__);

/**
 * @return array<string, \Filament\Tables\Columns\Column>
 */
function columnsOf(object $component): array
{
    return $component->getTable()->getColumns();
}
