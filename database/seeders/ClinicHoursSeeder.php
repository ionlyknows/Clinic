<?php

namespace Database\Seeders;

use App\Models\ClinicHour;
use Illuminate\Database\Seeder;

class ClinicHoursSeeder extends Seeder
{
    public function run(): void
    {
        foreach (range(1, 7) as $weekday) {
            ClinicHour::query()->firstOrCreate(
                ['weekday' => $weekday],
                ['is_closed' => true, 'opens_at' => null, 'closes_at' => null],
            );
        }
    }
}
