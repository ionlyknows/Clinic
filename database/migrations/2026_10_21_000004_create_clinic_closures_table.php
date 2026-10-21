<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_closures', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->date('closed_on')->unique();
            $table->string('reason', 160)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_closures');
    }
};
