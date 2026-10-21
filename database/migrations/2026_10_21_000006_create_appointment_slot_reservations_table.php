<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_slot_reservations', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->dateTime('slot_starts_at')->primary();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->index('appointment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_slot_reservations');
    }
};
