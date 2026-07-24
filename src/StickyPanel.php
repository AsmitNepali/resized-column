<?php

namespace Asmit\ResizedColumn;

use Filament\Actions\Action;
use Filament\Support\Enums\Size;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Livewire\Component;
use Livewire\Livewire;

class StickyPanel
{
    public static function defaultTriggerAction(): Action
    {
        return Action::make('openStickyPanel')
            ->label(__('asmit-resized-column::sticky-panel.trigger.label'))
            ->tooltip(__('asmit-resized-column::sticky-panel.trigger.tooltip'))
            ->button()
            ->color('gray')
            ->size(Size::Small)
            ->livewireClickHandlerEnabled(false)
            ->alpineClickHandler('toggle()');
    }

    public static function resolveTriggerAction(?Table $table = null): Action
    {
        $action = static::defaultTriggerAction();

        if ($table !== null) {
            $modifier = ResizedColumnTableRegistry::getStickyManagerTriggerActionModifier(
                get_class($table->getLivewire()),
            );

            if ($modifier !== null) {
                $action = $table->evaluate($modifier, [
                    'action' => $action,
                ]) ?? $action;
            }
        }

        $action->extraAttributes(['class' => 'fi-force-enabled'], merge: true);

        return $action;
    }

    public static function resolveTableFromLivewire(?string $componentClass): ?Table
    {
        $livewire = Livewire::current();

        if (! $livewire instanceof Component || ! $livewire instanceof HasTable) {
            return null;
        }

        if ($componentClass !== null && ! $livewire instanceof $componentClass) {
            return null;
        }

        return $livewire->getTable();
    }
}
