<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ClinicConfigurationController;
use App\Http\Controllers\PublicPageController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicPageController::class, 'home'])->name('home');
Route::get('/book', [BookingController::class, 'create'])->name('booking.create');
Route::get('/booking/availability', [BookingController::class, 'availability'])->middleware('throttle:60,1')->name('booking.availability');
Route::post('/appointments', [BookingController::class, 'store'])->middleware('throttle:5,1')->name('appointments.store');
Route::get('/booking/received', [BookingController::class, 'received'])->name('booking.received');
Route::redirect('/dashboard', '/admin')->middleware('auth')->name('dashboard');

Route::middleware(['auth', 'can:access-admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/appointments', [AdminController::class, 'appointments'])->name('appointments.index');
    Route::patch('/appointments/{appointment}/status', [AdminController::class, 'updateStatus'])->name('appointments.status');

    Route::middleware('can:manage-clinic')->group(function () {
        Route::get('/services', [ClinicConfigurationController::class, 'services'])->name('services.index');
        Route::get('/services/create', [ClinicConfigurationController::class, 'createService'])->name('services.create');
        Route::post('/services', [ClinicConfigurationController::class, 'storeService'])->name('services.store');
        Route::get('/services/{service}/edit', [ClinicConfigurationController::class, 'editService'])->name('services.edit');
        Route::patch('/services/{service}', [ClinicConfigurationController::class, 'updateService'])->name('services.update');
        Route::patch('/services/{service}/active', [ClinicConfigurationController::class, 'setServiceActive'])->name('services.active');
        Route::get('/hours', [ClinicConfigurationController::class, 'hours'])->name('hours.index');
        Route::patch('/hours', [ClinicConfigurationController::class, 'updateHours'])->name('hours.update');
        Route::get('/closures', [ClinicConfigurationController::class, 'closures'])->name('closures.index');
        Route::post('/closures', [ClinicConfigurationController::class, 'storeClosure'])->name('closures.store');
        Route::delete('/closures/{closure}', [ClinicConfigurationController::class, 'deleteClosure'])->name('closures.destroy');
    });
});

require __DIR__.'/settings.php';
