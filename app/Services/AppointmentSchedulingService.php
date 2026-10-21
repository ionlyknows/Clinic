<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\ClinicClosure;
use App\Models\ClinicHour;
use App\Models\Service as ClinicService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AppointmentSchedulingService
{
    private const TIMEZONE = 'Asia/Manila';

    /** @return list<string> */
    public function availableSlots(int $serviceId, string $date): array
    {
        $service = ClinicService::query()->whereKey($serviceId)->where('is_active', true)->first();
        if (! $service || $service->duration_minutes % 15 !== 0) {
            return [];
        }

        $day = CarbonImmutable::createFromFormat('!Y-m-d', $date, self::TIMEZONE);
        $hours = ClinicHour::query()->where('weekday', $day->dayOfWeekIso)->first();
        if (! $hours || $hours->is_closed || ! $hours->opens_at || ! $hours->closes_at) {
            return [];
        }
        if (ClinicClosure::query()->whereDate('closed_on', $date)->exists()) {
            return [];
        }

        $open = $day->setTimeFromTimeString($hours->opens_at);
        $close = $day->setTimeFromTimeString($hours->closes_at);
        $duration = $service->duration_minutes;
        if ($duration % 15 !== 0) {
            return [];
        }

        $slots = [];
        $now = CarbonImmutable::now(self::TIMEZONE);
        for ($start = $open; $start->addMinutes($duration)->lessThanOrEqualTo($close); $start = $start->addMinutes(15)) {
            $end = $start->addMinutes($duration);
            if ($start->lessThanOrEqualTo($now)) {
                continue;
            }
            $reservationStrings = $this->reservationTimes($start, $end)
                ->map(fn (CarbonImmutable $slot) => $slot->toDateTimeString())->all();
            if (DB::table('appointment_slot_reservations')->whereIn('slot_starts_at', $reservationStrings)->exists()) {
                continue;
            }
            $slots[] = $start->format('H:i');
        }

        return $slots;
    }

    /**
     * @param  array{service_id: int|string, date: string, time: string, patient_name: string, patient_phone: string, patient_email?: string|null}  $data
     */
    public function book(array $data): Appointment
    {
        $start = CarbonImmutable::createFromFormat('!Y-m-d H:i', $data['date'].' '.$data['time'], self::TIMEZONE);
        if (! $start || $start->format('Y-m-d H:i') !== $data['date'].' '.$data['time']) {
            throw ValidationException::withMessages(['time' => 'Choose a valid appointment time.']);
        }

        try {
            return DB::transaction(function () use ($data, $start) {
                $dayHours = ClinicHour::query()->where('weekday', $start->dayOfWeekIso)->lockForUpdate()->first();
                if (! $dayHours) {
                    throw ValidationException::withMessages(['date' => 'The clinic schedule is not configured yet.']);
                }

                $service = ClinicService::query()->whereKey($data['service_id'])->lockForUpdate()->first();
                if (! $service || ! $service->is_active) {
                    throw ValidationException::withMessages(['service_id' => 'Choose an active service.']);
                }
                if ($service->duration_minutes < 15 || $service->duration_minutes % 15 !== 0) {
                    throw ValidationException::withMessages(['service_id' => 'This service duration is not schedulable.']);
                }

                $end = $start->addMinutes($service->duration_minutes);
                $open = $dayHours->opens_at ? $start->startOfDay()->setTimeFromTimeString($dayHours->opens_at) : null;
                $close = $dayHours->closes_at ? $start->startOfDay()->setTimeFromTimeString($dayHours->closes_at) : null;
                if ($dayHours->is_closed || ! $open || ! $close || $start->lessThan($open) || $end->greaterThan($close)) {
                    throw ValidationException::withMessages(['time' => 'That time is outside the clinic’s opening hours.']);
                }
                if (ClinicClosure::query()->whereDate('closed_on', $start->toDateString())->exists()) {
                    throw ValidationException::withMessages(['date' => 'The clinic is closed on this date.']);
                }
                if ($start->lessThanOrEqualTo(CarbonImmutable::now(self::TIMEZONE))) {
                    throw ValidationException::withMessages(['time' => 'Choose a future appointment time.']);
                }
                if ($start->minute % 15 !== 0 || $start->second !== 0 || $start->hour * 60 + $start->minute >= 24 * 60) {
                    throw ValidationException::withMessages(['time' => 'Choose a time on a 15-minute boundary.']);
                }

                $reservationTimes = $this->reservationTimes($start, $end);
                $reservationStrings = $reservationTimes->map(fn (CarbonImmutable $time) => $time->toDateTimeString())->all();
                if (DB::table('appointment_slot_reservations')->whereIn('slot_starts_at', $reservationStrings)->exists()) {
                    throw ValidationException::withMessages(['time' => 'That time was just booked; choose another time.']);
                }

                $appointment = null;
                for ($attempt = 0; $attempt < 3; $attempt++) {
                    $reference = (string) Str::ulid();
                    if (Appointment::query()->where('public_reference', $reference)->exists()) {
                        continue;
                    }
                    try {
                        $appointment = Appointment::query()->create([
                            'public_reference' => $reference,
                            'service_id' => $service->id,
                            'service_name_snapshot' => $service->name,
                            'duration_minutes_snapshot' => $service->duration_minutes,
                            'fee_snapshot' => $service->fee,
                            'patient_name' => $data['patient_name'],
                            'patient_phone' => $data['patient_phone'],
                            'patient_email' => $data['patient_email'] ?? null,
                            'starts_at' => $start->toDateTimeString(),
                            'ends_at' => $end->toDateTimeString(),
                            'status' => 'pending',
                        ]);
                        break;
                    } catch (QueryException $exception) {
                        if (! $this->isReferenceCollision($exception)) {
                            throw $exception;
                        }
                    }
                }
                if (! $appointment) {
                    throw new \RuntimeException('Could not generate a unique appointment reference.');
                }

                $now = now(self::TIMEZONE)->toDateTimeString();
                DB::table('appointment_slot_reservations')->insert(array_map(
                    fn (string $slot) => ['slot_starts_at' => $slot, 'appointment_id' => $appointment->id, 'created_at' => $now],
                    $reservationStrings,
                ));

                return $appointment;
            }, attempts: 3);
        } catch (QueryException $exception) {
            if ($this->isReservationCollision($exception)) {
                throw ValidationException::withMessages(['time' => 'That time was just booked; choose another time.']);
            }
            throw $exception;
        }
    }

    public function changeStatus(int $appointmentId, string $nextStatus): Appointment
    {
        $startsAt = Appointment::query()->whereKey($appointmentId)->value('starts_at');
        if (! $startsAt) {
            throw (new ModelNotFoundException)->setModel(Appointment::class, [$appointmentId]);
        }
        $weekday = CarbonImmutable::parse($startsAt, self::TIMEZONE)->dayOfWeekIso;

        return DB::transaction(function () use ($appointmentId, $nextStatus, $weekday) {
            ClinicHour::query()->where('weekday', $weekday)->lockForUpdate()->first();
            $appointment = Appointment::query()->whereKey($appointmentId)->lockForUpdate()->firstOrFail();
            if ($appointment->starts_at->dayOfWeekIso !== $weekday) {
                throw ValidationException::withMessages(['status' => 'The appointment schedule changed. Reload and try again.']);
            }

            $allowed = match ($appointment->status) {
                'pending' => ['confirmed', 'cancelled'],
                'confirmed' => ['cancelled', 'completed', 'no_show'],
                default => [],
            };
            if (! in_array($nextStatus, $allowed, true)) {
                throw ValidationException::withMessages(['status' => 'This appointment cannot be moved to that status.']);
            }
            $endsAt = CarbonImmutable::parse($appointment->ends_at->format('Y-m-d H:i:s'), self::TIMEZONE);
            if (in_array($nextStatus, ['completed', 'no_show'], true) && $endsAt->greaterThan(CarbonImmutable::now(self::TIMEZONE))) {
                throw ValidationException::withMessages(['status' => 'An appointment can be completed or marked no-show after its end time.']);
            }

            $appointment->status = $nextStatus;
            $appointment->save();
            if (in_array($nextStatus, ['cancelled', 'completed', 'no_show'], true)) {
                DB::table('appointment_slot_reservations')->where('appointment_id', $appointment->id)->delete();
            }

            return $appointment;
        }, attempts: 3);
    }

    /** @return Collection<int, CarbonImmutable> */
    private function reservationTimes(CarbonImmutable $start, CarbonImmutable $end): Collection
    {
        $times = collect();
        for ($slot = $start; $slot->lessThan($end); $slot = $slot->addMinutes(15)) {
            $times->push($slot);
        }

        return $times;
    }

    private function isReservationCollision(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $isUniqueViolation = $sqlState === '23000' || $sqlState === '19';

        return $isUniqueViolation && str_contains($message, 'appointment_slot_reservations');
    }

    private function isReferenceCollision(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());
        $sqlState = (string) ($exception->errorInfo[0] ?? '');

        return ($sqlState === '23000' || $sqlState === '19')
            && str_contains($message, 'public_reference');
    }
}
