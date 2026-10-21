<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->char('public_reference', 26)->unique();
            $table->foreignId('service_id')->constrained()->restrictOnDelete();
            $table->string('service_name_snapshot', 120);
            $table->unsignedSmallInteger('duration_minutes_snapshot');
            $table->decimal('fee_snapshot', 10, 2)->nullable();
            $table->string('patient_name', 150);
            $table->string('patient_phone', 32);
            $table->string('patient_email', 254)->nullable();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])->default('pending');
            $table->timestamps();
            $table->index('starts_at');
            $table->index(['status', 'starts_at']);
        });
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE appointments ADD CONSTRAINT appointments_duration_check CHECK (duration_minutes_snapshot >= 15 AND MOD(duration_minutes_snapshot, 15) = 0)');
            DB::statement('ALTER TABLE appointments ADD CONSTRAINT appointments_interval_check CHECK (ends_at > starts_at)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
