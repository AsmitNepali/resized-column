# Resizable Columns

The **Resizable Columns** plugin allows you to resize table columns in Filament with persistent width settings. This package provides a seamless way to customize table layouts by letting users adjust column widths according to their preferences.

![Resized Column](https://raw.githubusercontent.com/AsmitNepali/resized-column/refs/heads/main/images/cover.jpg)

## Features
- Drag-to-resize column functionality
- Persistent column width settings
- Per-user width preferences
- Session and database storage options
- Works inside **Filament panels** and in **standalone Livewire components**
- Easy integration with existing Filament tables
- Customizable storage mechanisms

## Installation
You can install the package via composer:

```bash
composer require asmit/resized-column
```

## Registering the Plugin

Add the plugin to your Filament panel configuration in `app/Providers/Filament/AdminPanelProvider.php`:

```php
use Asmit\ResizedColumn\ResizedColumnPlugin;

public function panel(Panel $panel): Panel
{
    return $panel
        // ... other configuration
        ->plugins([
            // ... other plugins
            ResizedColumnPlugin::make()
                ->preserveOnDB() // Enable database storage (optional)
        ]);
}
```
## Publishing filament assets
```bash
php artisan filament:assets
```

## Publishing Migrations
```bash
# Publish migrations
php artisan vendor:publish --provider="Asmit\ResizedColumn\ResizedColumnServiceProvider" --tag=resized-column-migrations

# Run migrations
php artisan migrate
```

## Usage
To use the Resized Column functionality, simply include the `HasResizableColumn` trait in your Filament List Page or your custom page class. This will automatically enable the resizable column feature for all tables in that resource.
```php
use Asmit\ResizedColumn\HasResizableColumn;

class ListUsers extends ListRecords
{
    use HasResizableColumn;

    protected static string $resource = UserResource::class;
    
    // Your existing table definition...
}
```

## Storage Configuration

The package provides two storage mechanisms:

1. **Session Storage** (Enabled by default)
   - Stores column widths in the user's session
   - No database required
   - Storage is browser/device specific

2. **Database Storage** (Optional)
   - Stores column widths in the database
   - Requires migration to create the `table_settings` table
   - Works across browsers/devices for the same user

You can enable or disable database storage in your panel configuration:

```php
ResizedColumnPlugin::make()
    ->preserveOnDB(true) // Enable database storage
```

## Configuration Options

You can override any of the following methods in your class to customize behavior:

| Method | Description |
|--------|-------------|
| `persistColumnWidthsToDatabase()` | Customize how column widths are saved to database |
| `persistColumnWidthsToSession()` | Customize how column widths are saved to session |
| `loadColumnWidthsFromDatabase()` | Customize how column widths are loaded from database |
| `loadColumnWidthsFromSession()` | Customize how column widths are loaded from session |
| `getUserId()` | Customize how user identification is handled |

## Example: Custom Database Storage

```php
use Asmit\ResizedColumn\HasResizableColumn;

class ListUsers extends ListRecords
{
    use HasResizableColumn;
    
    protected function persistColumnWidthsToDatabase(): void
    {
        // Your custom database save logic here
        YourCustomModel::updateOrCreate(
            [
                'user_id' => $this->getUserId(),
                'resource' => $this->getResourceModelFullPath(), // e.g., 'App\Models\User'
            ],
            ['settings' => $this->columnWidths]
        );
    }
}
```

## Using Outside the Filament Panel

Filament tables can be used in any Livewire component without a panel. This package fully supports that use case. Add the `HasResizableColumn` trait to your Livewire component just as you would inside a panel.

```php
use Asmit\ResizedColumn\HasResizableColumn;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Livewire\Component;

class UsersTable extends Component implements HasForms, HasTable
{
    use InteractsWithForms;
    use InteractsWithTable;
    use HasResizableColumn;

    public function table(Table $table): Table
    {
        return $table
            ->query(User::query())
            ->columns([
                TextColumn::make('name'),
                TextColumn::make('email'),
            ]);
    }

    public function render(): View
    {
        return view('livewire.users-table');
    }
}
```

### Enabling Database Storage Outside the Panel

Since there is no `AdminPanelProvider` to register the plugin, the package provides two alternative ways to enable database storage.

---

#### Option A — App-wide via `AppServiceProvider` (recommended for global config)

Call `ResizedColumnPlugin::standalone()` once in `AppServiceProvider::boot()`. This stores a shared config instance for the entire request that all `HasResizableColumn` components will pick up automatically.

```php
// app/Providers/AppServiceProvider.php
use Asmit\ResizedColumn\ResizedColumnPlugin;

public function boot(): void
{
    ResizedColumnPlugin::standalone()
        ->preserveOnDB();

    // Optionally disable session storage app-wide:
    // ResizedColumnPlugin::standalone()->preserveOnDB()->preserveOnSession(false);
}
```

---

#### Option B — Per table via Table macro (recommended for granular control)

Chain `->preserveColumnWidthsInDatabase()` at the end of your `table()` method. This only affects that specific table and overrides any global config.

> ⚠️ **Always call this as the last method in the chain**, after `->columns()`, `->filters()`, `->actions()`, and all other table configuration. This ensures the Livewire component reference is fully resolved when the macro runs.

```php
public function table(Table $table): Table
{
    return $table
        ->query(User::query())
        ->columns([
            TextColumn::make('name'),
            TextColumn::make('email'),
        ])
        ->filters([...])
        ->actions([...])
        ->preserveColumnWidthsInDatabase();   // ← always last
}
```

You can combine both macros to fully control storage per table:

```php
->preserveColumnWidthsInDatabase()      // save to DB
->preserveColumnWidthsInSession(false)  // disable session for this table
```

---

### Configuration Priority

When the package decides whether to save column widths to the database, it checks configuration in the following order. **The first match wins.**

| Priority | Method | Scope |
|----------|--------|-------|
| **1 — Highest** | `->preserveColumnWidthsInDatabase()` table macro | Single table only |
| **2** | `ResizedColumnPlugin::standalone()` in `AppServiceProvider` | All components, no panel required |
| **3 — Lowest** | `ResizedColumnPlugin::make()` in panel provider | Inside a Filament panel |

This means a table macro will always win over the global standalone config, which will always win over the panel plugin config.

---

## Troubleshooting

### CSS Styles Not Loading

If the resize handles are not displaying correctly:

1. Make sure you have published the Filament assets:
   ```bash
   php artisan filament:assets
   ```

2. Clear your browser cache or try a hard refresh (Ctrl+F5)

## Credits
- [Asmit Nepal][link-asmit]
- [Kishan Sunar][link-kishan]

### Security

If you discover a security vulnerability within this package, please send an e-mail to asmitnepali99@gmail.com. All security vulnerabilities will be promptly addressed.

## Contributing
Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

### 📄 License
The MIT License (MIT). Please see [License File](LICENSE.txt) for more information.

[link-asmit]: https://github.com/AsmitNepali
[link-kishan]: https://github.com/Kishan-Sunar
