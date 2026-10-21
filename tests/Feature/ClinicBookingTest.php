<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\ClinicHour;
use App\Models\Service;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\ClinicHoursSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClinicBookingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->travelTo(CarbonImmutable::parse('2026-10-21 08:00:00', 'Asia/Manila'));
        ClinicHour::query()->where('weekday', 3)->update([
            'is_closed' => false,
            'opens_at' => '09:00:00',
            'closes_at' => '10:00:00',
        ]);
    }

    public function test_booking_reserves_each_quarter_hour_and_returns_one_use_reference(): void
    {
        $service = Service::query()->create([
            'name' => 'Consultation', 'duration_minutes' => 30, 'fee' => '500.00', 'is_active' => true,
        ]);

        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->where('bookingConfigured', true)
            ->has('hours', 7));
        $this->get('/book')->assertOk()->assertInertia(fn ($page) => $page->component('booking/create')->has('services', 1));
        $this->getJson('/booking/availability?service_id='.$service->id.'&date=2026-10-21')
            ->assertOk()->assertExactJson(['slots' => ['09:00', '09:15', '09:30']]);

        $this->post('/appointments', [
            'service_id' => $service->id,
            'date' => '2026-10-21',
            'time' => '09:00',
            'patient_name' => '  Alex Patient  ',
            'patient_phone' => '+63 900 000 0000',
            'patient_email' => 'alex@example.test',
        ])->assertRedirect('/booking/received');

        $appointment = Appointment::query()->sole();
        $this->assertSame('pending', $appointment->status);
        $this->assertSame('Alex Patient', $appointment->patient_name);
        $this->assertSame('2026-10-21 09:30:00', $appointment->ends_at->format('Y-m-d H:i:s'));
        $this->assertSame('Consultation', $appointment->service_name_snapshot);
        $this->assertSame(2, $appointment->reservations()->count());
        $this->get('/booking/received')->assertInertia(fn ($page) => $page
            ->component('booking/received')->where('reference', $appointment->public_reference));
        $this->get('/booking/received')->assertInertia(fn ($page) => $page
            ->component('booking/received')->where('reference', null));
    }

    public function test_slot_collision_is_rejected_and_adjacent_booking_is_allowed(): void
    {
        $service = Service::query()->create(['name' => 'Consultation', 'duration_minutes' => 30, 'fee' => '500.00', 'is_active' => true]);
        $payload = [
            'service_id' => $service->id, 'date' => '2026-10-21', 'time' => '09:00',
            'patient_name' => 'Alex Patient', 'patient_phone' => '09000000000',
        ];

        $this->post('/appointments', $payload)->assertRedirect('/booking/received');
        $this->post('/appointments', $payload)->assertSessionHasErrors('time');
        $this->post('/appointments', [...$payload, 'time' => '09:30'])->assertRedirect('/booking/received');

        $this->assertDatabaseCount('appointments', 2);
        $this->assertDatabaseCount('appointment_slot_reservations', 4);
    }

    public function test_public_cannot_submit_server_controlled_fields_or_book_inactive_services(): void
    {
        $service = Service::query()->create(['name' => 'Inactive', 'duration_minutes' => 15, 'is_active' => false]);
        $payload = [
            'service_id' => $service->id, 'date' => '2026-10-21', 'time' => '09:00',
            'patient_name' => 'Alex Patient', 'patient_phone' => '09000000000', 'status' => 'confirmed',
        ];

        $this->post('/appointments', $payload)->assertSessionHasErrors('status');
        unset($payload['status']);
        $this->post('/appointments', $payload)->assertSessionHasErrors('service_id');
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_staff_can_cancel_and_release_slots_while_guests_cannot_access_admin(): void
    {
        $service = Service::query()->create(['name' => 'Consultation', 'duration_minutes' => 30, 'is_active' => true]);
        $this->post('/appointments', [
            'service_id' => $service->id, 'date' => '2026-10-21', 'time' => '09:00',
            'patient_name' => 'Alex Patient', 'patient_phone' => '09000000000',
        ])->assertRedirect('/booking/received');
        $appointment = Appointment::query()->sole();

        $this->get('/admin')->assertRedirect('/login');
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get('/admin')->assertOk()->assertInertia(fn ($page) => $page->component('admin/dashboard'));
        $this->actingAs($staff)->patch('/admin/appointments/'.$appointment->id.'/status', ['status' => 'cancelled'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'status' => 'cancelled']);
        $this->assertDatabaseCount('appointment_slot_reservations', 0);
    }

    public function test_staff_cannot_manage_configuration_and_admin_can(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get('/admin/services')->assertForbidden();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get('/admin/services')->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/services/index'));
        $this->assertDatabaseCount('services', 0);
    }

    public function test_admin_cannot_invalidate_active_bookings_and_can_configure_a_safe_closure(): void
    {
        $service = Service::query()->create(['name' => 'Consultation', 'duration_minutes' => 30, 'fee' => '500.00', 'is_active' => true]);
        $this->post('/appointments', [
            'service_id' => $service->id, 'date' => '2026-10-21', 'time' => '09:00',
            'patient_name' => 'Alex Patient', 'patient_phone' => '09000000000',
        ])->assertRedirect('/booking/received');
        $appointment = Appointment::query()->sole();

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post('/admin/closures', [
            'closed_on' => '2026-10-21', 'reason' => 'Clinic event',
        ])->assertSessionHasErrors('closed_on');

        $hours = ClinicHour::query()->orderBy('weekday')->get()->map(fn (ClinicHour $hour) => [
            'weekday' => $hour->weekday,
            'is_closed' => $hour->is_closed,
            'opens_at' => $hour->opens_at ? substr($hour->opens_at, 0, 5) : null,
            'closes_at' => $hour->closes_at ? substr($hour->closes_at, 0, 5) : null,
        ])->all();
        $hours[2] = ['weekday' => 3, 'is_closed' => true, 'opens_at' => null, 'closes_at' => null];
        $this->actingAs($admin)->patch('/admin/hours', ['hours' => $hours])->assertSessionHasErrors('hours');

        $service->update(['name' => 'Updated name', 'duration_minutes' => 45, 'fee' => '750.00']);
        $this->assertSame('Consultation', $appointment->fresh()->service_name_snapshot);
        $this->assertSame(30, $appointment->fresh()->duration_minutes_snapshot);
        $this->assertSame('500.00', $appointment->fresh()->fee_snapshot);
        $this->assertDatabaseCount('appointment_slot_reservations', 2);

        ClinicHour::query()->where('weekday', 4)->update([
            'is_closed' => false, 'opens_at' => '09:00:00', 'closes_at' => '10:00:00',
        ]);
        $this->actingAs($admin)->post('/admin/closures', [
            'closed_on' => '2026-10-22', 'reason' => 'Clinic event',
        ])->assertSessionHasNoErrors();
        $this->getJson('/booking/availability?service_id='.$service->id.'&date=2026-10-22')
            ->assertOk()->assertExactJson(['slots' => []]);
    }

    public function test_reseeding_clinic_hours_does_not_overwrite_admin_configuration(): void
    {
        $this->seed(ClinicHoursSeeder::class);

        $wednesday = ClinicHour::query()->where('weekday', 3)->firstOrFail();
        $this->assertFalse($wednesday->is_closed);
        $this->assertSame('09:00:00', $wednesday->opens_at);
        $this->assertDatabaseCount('clinic_hours', 7);
    }

    public function test_staff_status_transitions_follow_appointment_time_and_release_terminal_slots(): void
    {
        $service = Service::query()->create(['name' => 'Consultation', 'duration_minutes' => 30, 'is_active' => true]);
        $this->post('/appointments', [
            'service_id' => $service->id, 'date' => '2026-10-21', 'time' => '09:00',
            'patient_name' => 'Alex Patient', 'patient_phone' => '09000000000',
        ])->assertRedirect('/booking/received');
        $appointment = Appointment::query()->sole();
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->patch('/admin/appointments/'.$appointment->id.'/status', ['status' => 'confirmed'])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseCount('appointment_slot_reservations', 2);

        $this->patch('/admin/appointments/'.$appointment->id.'/status', ['status' => 'completed'])
            ->assertSessionHasErrors('status');
        $this->travelTo(CarbonImmutable::parse('2026-10-21 09:31:00', 'Asia/Manila'));
        $this->patch('/admin/appointments/'.$appointment->id.'/status', ['status' => 'completed'])
            ->assertSessionHasNoErrors();
        $this->patch('/admin/appointments/'.$appointment->id.'/status', ['status' => 'confirmed'])
            ->assertSessionHasErrors('status');

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'status' => 'completed']);
        $this->assertDatabaseCount('appointment_slot_reservations', 0);
    }
}
