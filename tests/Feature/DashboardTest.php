<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get('/admin');
        $response->assertRedirect(route('login'));
    }

    public function test_staff_can_visit_the_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'staff']);
        $this->actingAs($user);

        $this->get('/admin')->assertOk();
    }

    public function test_staff_cannot_open_admin_configuration_pages(): void
    {
        $user = User::factory()->create(['role' => 'staff']);

        $this->actingAs($user)->get('/admin/services')->assertForbidden();
    }
}
