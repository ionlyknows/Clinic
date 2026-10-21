<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property int $duration_minutes_snapshot
 * @property string|null $fee_snapshot
 */
#[Fillable([
    'public_reference', 'service_id', 'service_name_snapshot', 'duration_minutes_snapshot', 'fee_snapshot',
    'patient_name', 'patient_phone', 'patient_email', 'starts_at', 'ends_at', 'status',
])]
class Appointment extends Model
{
    public const ACTIVE_STATUSES = ['pending', 'confirmed'];

    public const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime', 'ends_at' => 'datetime',
            'duration_minutes_snapshot' => 'integer', 'fee_snapshot' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Service, $this> */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /** @return HasMany<AppointmentSlotReservation, $this> */
    public function reservations(): HasMany
    {
        return $this->hasMany(AppointmentSlotReservation::class);
    }
}
