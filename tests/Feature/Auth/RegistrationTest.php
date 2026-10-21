<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_screen_is_disabled(): void
    {
        $this->get('/register')->assertNotFound();
    }

    public function test_public_registration_cannot_create_an_account_or_choose_a_role(): void
    {
        $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ])->assertNotFound();

        $this->assertDatabaseCount('users', 0);
    }
}
