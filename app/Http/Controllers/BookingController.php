<?php

namespace App\Http\Controllers;

use App\Models\ClinicHour;
use App\Models\Service;
use App\Services\AppointmentSchedulingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct(private readonly AppointmentSchedulingService $scheduling) {}

    public function create(): Response
    {
        $services = Service::query()->where('is_active', true)->orderBy('name')->get([
            'id', 'name', 'description', 'duration_minutes', 'fee',
        ]);

        return Inertia::render('booking/create', [
            'services' => $services,
            'bookingConfigured' => $services->isNotEmpty() && ClinicHour::query()->where('is_closed', false)->exists(),
        ]);
    }

    public function availability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => ['required', 'integer', 'min:1'],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        return response()->json([
            'slots' => $this->scheduling->availableSlots((int) $validated['service_id'], $validated['date']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'service_id' => ['required', 'integer', 'min:1'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'patient_name' => ['required', 'string', 'max:150'],
            'patient_phone' => ['required', 'string', 'max:32', 'regex:/^(?=.*\d)[0-9+().\-\s]+$/'],
            'patient_email' => ['nullable', 'email', 'max:254'],
            'ends_at' => ['prohibited'],
            'duration_minutes' => ['prohibited'],
            'fee' => ['prohibited'],
            'status' => ['prohibited'],
            'role' => ['prohibited'],
            'public_reference' => ['prohibited'],
            'reservations' => ['prohibited'],
        ]);
        $validated['patient_name'] = trim($validated['patient_name']);
        $validated['patient_phone'] = trim($validated['patient_phone']);
        $validated['patient_email'] = isset($validated['patient_email']) ? trim($validated['patient_email']) : null;

        $appointment = $this->scheduling->book($validated);
        $request->session()->flash('booking_reference', $appointment->public_reference);

        return redirect()->route('booking.received');
    }

    public function received(Request $request): Response
    {
        $reference = $request->session()->pull('booking_reference');

        return Inertia::render('booking/received', ['reference' => is_string($reference) ? $reference : null]);
    }
}
