<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('products', 'width_mm')) {
            DB::update('UPDATE products SET width_mm = ROUND(width_mm / 25.4, 2) WHERE width_mm IS NOT NULL AND width_mm > 20');
            DB::update('UPDATE products SET height_mm = ROUND(height_mm / 25.4, 2) WHERE height_mm IS NOT NULL AND height_mm > 20');
        }

        if (Schema::hasColumn('products', 'stitch_count')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('stitch_count');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('products', 'stitch_count')) {
            Schema::table('products', function (Blueprint $table) {
                $table->unsignedInteger('stitch_count')->nullable();
            });
        }

        if (Schema::hasColumn('products', 'width_mm')) {
            DB::update('UPDATE products SET width_mm = ROUND(width_mm * 25.4, 2) WHERE width_mm IS NOT NULL');
            DB::update('UPDATE products SET height_mm = ROUND(height_mm * 25.4, 2) WHERE height_mm IS NOT NULL');
        }
    }
};
