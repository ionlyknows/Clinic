<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class MakeClinicAdmin extends Command
{
    protected $signature = 'clinic:make-admin';

    protected $description = 'Create or promote a clinic administrator';

    public function handle(): int
    {
        $name = trim($this->ask('Administrator name'));
        $email = mb_strtolower(trim($this->ask('Administrator email')));
        $password = $this->secret('Password (minimum 12 characters)');
        $confirmation = $this->secret('Confirm password');

        if ($name === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12 || $password !== $confirmation) {
            $this->error('Enter a valid name and email, and matching passwords of at least 12 characters.');

            return self::FAILURE;
        }

        $user = User::query()->firstOrNew(['email' => $email]);
        $user->name = $name;
        $user->password = Hash::make($password);
        $user->role = 'admin';
        $user->email_verified_at ??= now();
        $user->save();

        $this->info("Administrator account ready for {$email}.");

        return self::SUCCESS;
    }
}
