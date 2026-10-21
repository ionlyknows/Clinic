<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $weekday
 * @property bool $is_closed
 * @property string|null $opens_at
 * @property string|null $closes_at
 */
#[Fillable(['weekday', 'is_closed', 'opens_at', 'closes_at'])]
class ClinicHour extends Model
{
    protected function casts(): array
    {
        return ['weekday' => 'integer', 'is_closed' => 'boolean'];
    }
}
