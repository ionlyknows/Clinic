<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\AppointmentSchedulingService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(private readonly AppointmentSchedulingService $scheduling) {}

    public function dashboard(): Response
    {
        $today = CarbonImmutable::now('Asia/Manila')->toDateString();
        $appointments = Appointment::query()->whereIn('status', Appointment::ACTIVE_STATUSES)
            ->where('starts_at', '>=', CarbonImmutable::now('Asia/Manila')->toDateTimeString())
            ->orderBy('starts_at')->limit(8)->get();

        return Inertia::render('admin/dashboard', [
            'counts' => [
                'today' => Appointment::query()->whereDate('starts_at', $today)->count(),
                'pending' => Appointment::query()->where('status', 'pending')->count(),
                'confirmed' => Appointment::query()->where('status', 'confirmed')->count(),
            ],
            'upcoming' => $appointments->map(fn (Appointment $appointment) => $this->row($appointment)),
        ]);
    }

    public function appointments(Request $request): Response
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'status' => ['nullable', 'in:pending,confirmed,cancelled,completed,no_show'],
        ]);
        $query = Appointment::query()->orderByDesc('starts_at');
        if (! empty($filters['date'])) {
            $query->whereDate('starts_at', $filters['date']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        $paginator = $query->paginate(15)->withQueryString();
        $paginator->getCollection()->transform(fn (Appointment $appointment) => $this->row($appointment));

        return Inertia::render('admin/appointments', [
            'appointments' => $paginator,
            'filters' => ['date' => $filters['date'] ?? '', 'status' => $filters['status'] ?? ''],
            'statuses' => Appointment::STATUSES,
        ]);
    }

    public function updateStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', 'in:confirmed,cancelled,completed,no_show']]);
        $this->scheduling->changeStatus($appointment->id, $data['status']);

        return back()->with('success', 'Appointment status updated.');
    }

    /** @return array<string, int|string|null> */
    private function row(Appointment $appointment): array
    {
        return [
            'id' => $appointment->id,
            'public_reference' => $appointment->public_reference,
            'patient_name' => $appointment->patient_name,
            'patient_phone' => $appointment->patient_phone,
            'patient_email' => $appointment->patient_email,
            'service_name_snapshot' => $appointment->service_name_snapshot,
            'duration_minutes_snapshot' => $appointment->duration_minutes_snapshot,
            'fee_snapshot' => $appointment->fee_snapshot,
            'starts_at' => $appointment->starts_at->format('Y-m-d H:i:s'),
            'ends_at' => $appointment->ends_at->format('Y-m-d H:i:s'),
            'status' => $appointment->status,
        ];
    }
}
