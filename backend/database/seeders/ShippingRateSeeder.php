<?php

namespace Database\Seeders;

use App\Models\ShippingRate;
use App\Services\ShippingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ShippingRateSeeder extends Seeder
{
    public function run(): void
    {
        $sort = 1;
        foreach (ShippingService::DEFAULT_LAGOS_AREAS as $code => $area) {
            ShippingRate::updateOrCreate(
                ['type' => ShippingRate::TYPE_LAGOS, 'code' => $code],
                [
                    'name' => $area['label'],
                    'base_rate' => $area['base'],
                    'is_active' => true,
                    'sort_order' => $sort++,
                ]
            );
        }

        $sort = 1;
        foreach (ShippingService::DEFAULT_STATE_RATES as $name => $base) {
            ShippingRate::updateOrCreate(
                ['type' => ShippingRate::TYPE_STATE, 'code' => Str::slug($name)],
                [
                    'name' => $name,
                    'base_rate' => $base,
                    'is_active' => true,
                    'sort_order' => $sort++,
                ]
            );
        }
    }
}
