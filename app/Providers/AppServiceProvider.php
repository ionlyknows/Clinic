<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::define('access-admin', fn ($user) => in_array($user->role, ['admin', 'staff'], true));
        Gate::define('manage-clinic', fn ($user) => $user->role === 'admin');
    }
}
