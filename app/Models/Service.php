<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $duration_minutes
 * @property string|null $fee
 * @property bool $is_active
 */
#[Fillable(['name', 'description', 'duration_minutes', 'fee', 'is_active'])]
class Service extends Model
{
    protected function casts(): array
    {
        return ['duration_minutes' => 'integer', 'fee' => 'decimal:2', 'is_active' => 'boolean'];
    }

    /** @return HasMany<Appointment, $this> */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
