<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class ClinicDemoUsersSeeder extends Seeder
{
    /**
     * Seed demo dashboard accounts for local development and tests only.
     */
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        foreach ([
            [
                'name' => 'Clinic Admin',
                'email' => 'admin@example.test',
                'role' => 'admin',
            ],
            [
                'name' => 'Clinic Staff',
                'email' => 'staff@example.test',
                'role' => 'staff',
            ],
        ] as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'role' => $account['role'],
                    'password' => 'ClinicDemo!2026',
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
