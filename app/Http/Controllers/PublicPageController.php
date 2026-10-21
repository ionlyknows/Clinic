<?php

namespace App\Http\Controllers;

use App\Models\ClinicHour;
use App\Models\Service;
use Inertia\Inertia;
use Inertia\Response;

class PublicPageController extends Controller
{
    public function home(): Response
    {
        $services = Service::query()->where('is_active', true)->orderBy('name')->get([
            'id', 'name', 'description', 'duration_minutes', 'fee',
        ]);
        $hours = ClinicHour::query()->orderBy('weekday')->get(['weekday', 'is_closed', 'opens_at', 'closes_at'])
            ->map(fn (ClinicHour $row) => [
                'weekday' => $row->weekday,
                'is_closed' => $row->is_closed,
                'opens_at' => $row->opens_at ? substr($row->opens_at, 0, 5) : null,
                'closes_at' => $row->closes_at ? substr($row->closes_at, 0, 5) : null,
            ]);

        return Inertia::render('welcome', [
            'clinicName' => config('clinic.name'),
            'clinicContact' => config('clinic.contact'),
            'services' => $services,
            'hours' => $hours,
            'bookingConfigured' => $services->isNotEmpty() && $hours->contains(fn (array $hour) => ! $hour['is_closed']),
        ]);
    }
}
