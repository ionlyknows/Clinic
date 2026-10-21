<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->string('name', 120)->unique();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('duration_minutes');
            $table->decimal('fee', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE services ADD CONSTRAINT services_duration_check CHECK (duration_minutes >= 15 AND MOD(duration_minutes, 15) = 0)');
            DB::statement('ALTER TABLE services ADD CONSTRAINT services_fee_check CHECK (fee IS NULL OR fee >= 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
