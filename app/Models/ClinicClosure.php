<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/** @property Carbon $closed_on */
#[Fillable(['closed_on', 'reason'])]
class ClinicClosure extends Model
{
    protected function casts(): array
    {
        return ['closed_on' => 'date:Y-m-d'];
    }
}
