<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\ClinicClosure;
use App\Models\ClinicHour;
use App\Models\Service;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClinicConfigurationController extends Controller
{
    public function services(): Response
    {
        return Inertia::render('admin/services/index', [
            'services' => Service::query()->orderBy('name')->get(['id', 'name', 'description', 'duration_minutes', 'fee', 'is_active']),
        ]);
    }

    public function createService(): Response
    {
        return Inertia::render('admin/services/create', ['service' => null]);
    }

    public function editService(Service $service): Response
    {
        return Inertia::render('admin/services/edit', ['service' => $service]);
    }

    public function storeService(Request $request): RedirectResponse
    {
        $data = $this->validateService($request);
        Service::query()->create($data);

        return redirect()->route('admin.services.index')->with('success', 'Service created.');
    }

    public function updateService(Request $request, Service $service): RedirectResponse
    {
        $data = $this->validateService($request, $service);
        $service->update($data);

        return redirect()->route('admin.services.index')->with('success', 'Service updated. Existing appointments keep their saved details.');
    }

    public function setServiceActive(Request $request, Service $service): RedirectResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $service->is_active = (bool) $data['is_active'];
        $service->save();

        return back()->with('success', 'Service availability updated.');
    }

    public function hours(): Response
    {
        $hours = ClinicHour::query()->orderBy('weekday')->get()->map(fn (ClinicHour $row) => [
            'weekday' => $row->weekday,
            'is_closed' => $row->is_closed,
            'opens_at' => $row->opens_at ? substr($row->opens_at, 0, 5) : null,
            'closes_at' => $row->closes_at ? substr($row->closes_at, 0, 5) : null,
        ]);

        return Inertia::render('admin/hours', ['hours' => $hours]);
    }

    public function updateHours(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'hours' => ['required', 'array', 'size:7'],
            'hours.*.weekday' => ['required', 'integer', 'between:1,7', 'distinct'],
            'hours.*.is_closed' => ['required', 'boolean'],
            'hours.*.opens_at' => ['nullable', 'date_format:H:i'],
            'hours.*.closes_at' => ['nullable', 'date_format:H:i'],
        ]);

        foreach ($data['hours'] as $index => $row) {
            $closed = (bool) $row['is_closed'];
            if ($closed) {
                $data['hours'][$index]['opens_at'] = null;
                $data['hours'][$index]['closes_at'] = null;

                continue;
            }
            if (empty($row['opens_at']) || empty($row['closes_at']) || $row['opens_at'] >= $row['closes_at']) {
                throw ValidationException::withMessages(["hours.$index.opens_at" => 'Open days need an opening time before closing time.']);
            }
            foreach ([$row['opens_at'], $row['closes_at']] as $time) {
                [$hour, $minute] = array_map('intval', explode(':', $time));
                if ($minute % 15 !== 0) {
                    throw ValidationException::withMessages(["hours.$index.opens_at" => 'Opening and closing times must align to a 15-minute boundary.']);
                }
            }
        }

        DB::transaction(function () use ($data) {
            $locked = ClinicHour::query()->orderBy('weekday')->lockForUpdate()->get()->keyBy('weekday');
            if ($locked->keys()->sort()->values()->all() !== range(1, 7)) {
                throw ValidationException::withMessages(['hours' => 'The weekly schedule is incomplete. Run the clinic hours seeder before editing it.']);
            }
            $now = CarbonImmutable::now('Asia/Manila');
            $activeAppointments = Appointment::query()->whereIn('status', Appointment::ACTIVE_STATUSES)
                ->where('ends_at', '>', $now->toDateTimeString())->get();
            foreach ($data['hours'] as $row) {
                $existing = $locked->get((int) $row['weekday']);
                $closed = (bool) $row['is_closed'];
                foreach ($activeAppointments as $appointment) {
                    if ($appointment->starts_at->dayOfWeekIso !== (int) $row['weekday']) {
                        continue;
                    }
                    $start = $appointment->starts_at->format('H:i');
                    $end = $appointment->ends_at->format('H:i');
                    if ($closed || $start < $row['opens_at'] || $end > $row['closes_at']) {
                        throw ValidationException::withMessages(['hours' => 'Resolve future pending or confirmed appointments affected by these hours before saving.']);
                    }
                }
                $existing->update([
                    'is_closed' => $closed,
                    'opens_at' => $closed ? null : $row['opens_at'],
                    'closes_at' => $closed ? null : $row['closes_at'],
                ]);
            }
        }, attempts: 3);

        return back()->with('success', 'Clinic hours updated.');
    }

    public function closures(): Response
    {
        return Inertia::render('admin/closures/index', [
            'closures' => ClinicClosure::query()->orderBy('closed_on')->get(['id', 'closed_on', 'reason'])
                ->map(fn (ClinicClosure $closure) => ['id' => $closure->id, 'closed_on' => $closure->closed_on->format('Y-m-d'), 'reason' => $closure->reason]),
        ]);
    }

    public function storeClosure(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'closed_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'reason' => ['nullable', 'string', 'max:160'],
        ]);

        try {
            DB::transaction(function () use ($data) {
                $day = CarbonImmutable::createFromFormat('!Y-m-d', $data['closed_on'], 'Asia/Manila');
                $hours = ClinicHour::query()->where('weekday', $day->dayOfWeekIso)->lockForUpdate()->first();
                if (! $hours) {
                    throw ValidationException::withMessages(['closed_on' => 'The clinic schedule is not configured yet.']);
                }
                if (Appointment::query()->whereDate('starts_at', $day->toDateString())->whereIn('status', Appointment::ACTIVE_STATUSES)->exists()) {
                    throw ValidationException::withMessages(['closed_on' => 'Resolve pending or confirmed appointments on this date before closing the clinic.']);
                }
                ClinicClosure::query()->create($data);
            }, attempts: 3);
        } catch (QueryException $exception) {
            if (in_array(($exception->errorInfo[0] ?? null), ['23000', '19'], true)
                && str_contains(strtolower($exception->getMessage()), 'clinic_closures')) {
                throw ValidationException::withMessages(['closed_on' => 'A closure is already configured for this date.']);
            }
            throw $exception;
        }

        return back()->with('success', 'Closure date added.');
    }

    public function deleteClosure(ClinicClosure $closure): RedirectResponse
    {
        DB::transaction(function () use ($closure) {
            $day = CarbonImmutable::parse($closure->closed_on, 'Asia/Manila');
            ClinicHour::query()->where('weekday', $day->dayOfWeekIso)->lockForUpdate()->first();
            ClinicClosure::query()->whereKey($closure->id)->delete();
        }, attempts: 3);

        return back()->with('success', 'Closure date removed.');
    }

    /** @return array{name: string, description: string|null, duration_minutes: int, fee: int|float|string|null, is_active: bool} */
    private function validateService(Request $request, ?Service $service = null): array
    {
        if (is_string($request->input('name'))) {
            $request->merge(['name' => trim($request->input('name'))]);
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('services', 'name')->ignore($service?->id)],
            'description' => ['nullable', 'string', 'max:5000'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:1440'],
            'fee' => ['nullable', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $data['name'] = trim($data['name']);
        $data['description'] = isset($data['description']) ? trim($data['description']) : null;
        $data['duration_minutes'] = (int) $data['duration_minutes'];
        if ($data['duration_minutes'] % 15 !== 0) {
            throw ValidationException::withMessages(['duration_minutes' => 'Duration must be a multiple of 15 minutes.']);
        }
        $data['is_active'] = (bool) ($data['is_active'] ?? ($service ? $service->is_active : true));

        return $data;
    }
}
