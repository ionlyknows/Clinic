<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_hours', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->unsignedTinyInteger('weekday')->unique();
            $table->boolean('is_closed')->default(true);
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->timestamps();
        });
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE clinic_hours ADD CONSTRAINT clinic_hours_integrity_check CHECK ((is_closed = 1 AND opens_at IS NULL AND closes_at IS NULL) OR (is_closed = 0 AND opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at AND MINUTE(opens_at) MOD 15 = 0 AND MINUTE(closes_at) MOD 15 = 0))');
            DB::statement('ALTER TABLE clinic_hours ADD CONSTRAINT clinic_hours_weekday_check CHECK (weekday BETWEEN 1 AND 7)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_hours');
    }
};
