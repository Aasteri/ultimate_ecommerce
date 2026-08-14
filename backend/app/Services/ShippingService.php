<?php

namespace App\Services;

use App\Models\ShippingRate;
use Illuminate\Support\Str;

class ShippingService
{
    public const EXTRA_BLOCK_SIZE = 15;
    public const EXTRA_BLOCK_FEE = 1000;

    public const DEFAULT_LAGOS_AREAS = [
        'ajah' => ['label' => 'Ajah / Sangotedo / Awoyaya', 'base' => 1500],
        'epe' => ['label' => 'Epe', 'base' => 2000],
        'lekki' => ['label' => 'Lekki / Ikota / Chevron', 'base' => 2000],
        'vi' => ['label' => 'Victoria Island / Ikoyi', 'base' => 2500],
        'island' => ['label' => 'Lagos Island', 'base' => 2500],
        'ikeja' => ['label' => 'Ikeja / Maryland / Yaba', 'base' => 3000],
        'surulere' => ['label' => 'Surulere / Gbagada / Anthony', 'base' => 3000],
        'mainland' => ['label' => 'Other farther Mainland areas', 'base' => 3500],
        'apapa' => ['label' => 'Apapa / far-west Lagos', 'base' => 4000],
    ];

    public const DEFAULT_STATE_RATES = [
        'Ogun' => 4000,
        'Oyo' => 4000,
        'Osun' => 4000,
        'Ondo' => 5000,
        'Ekiti' => 5000,
        'Anambra' => 7000,
        'Enugu' => 7000,
        'Ebonyi' => 7000,
        'Imo' => 7000,
        'Abia' => 7000,
        'Edo' => 7000,
        'Delta' => 7000,
        'Rivers' => 9000,
        'Bayelsa' => 9000,
        'Akwa Ibom' => 9000,
        'Cross River' => 9000,
        'Kwara' => 9000,
        'Kogi' => 9000,
        'Nasarawa' => 9000,
        'Niger' => 9000,
        'Benue' => 9000,
        'Plateau' => 10000,
        'FCT / Abuja' => 10000,
        'Kaduna' => 12000,
        'Kano' => 13000,
        'Katsina' => 13000,
        'Jigawa' => 13000,
        'Kebbi' => 14000,
        'Sokoto' => 14000,
        'Zamfara' => 14000,
        'Bauchi' => 14000,
        'Gombe' => 15000,
        'Adamawa' => 15000,
        'Yobe' => 15000,
        'Borno' => 16000,
        'Taraba' => 16000,
    ];

    public function quote(string $country, string $state, int $quantity, ?string $lagosArea = null): array
    {
        $quantity = max(1, $quantity);
        $isNigeria = $this->isNigeria($country);

        if (!$isNigeria) {
            return [
                'shipping_cost' => 0,
                'base_rate' => 0,
                'extra_blocks' => 0,
                'needs_discussion' => true,
                'is_nigeria' => false,
                'label' => 'International shipping — to be discussed with sales after payment',
            ];
        }

        $matched = $this->findRate($state, $lagosArea);
        if (!$matched) {
            return [
                'shipping_cost' => 0,
                'base_rate' => 0,
                'extra_blocks' => 0,
                'needs_discussion' => true,
                'is_nigeria' => true,
                'label' => 'Select a valid Nigerian state' . ($this->isLagos($state) ? ' and Lagos delivery area' : ''),
                'error' => true,
            ];
        }

        $base = (int) round((float) $matched->base_rate);
        $extraBlocks = $quantity <= self::EXTRA_BLOCK_SIZE
            ? 0
            : (int) ceil(($quantity - self::EXTRA_BLOCK_SIZE) / self::EXTRA_BLOCK_SIZE);

        $cost = $base + ($extraBlocks * self::EXTRA_BLOCK_FEE);

        return [
            'shipping_cost' => $cost,
            'base_rate' => $base,
            'extra_blocks' => $extraBlocks,
            'needs_discussion' => false,
            'is_nigeria' => true,
            'label' => $matched->type === ShippingRate::TYPE_LAGOS
                ? 'Lagos — ' . $matched->name
                : $matched->name,
        ];
    }

    public function ratesTable(): array
    {
        $lagos = ShippingRate::ofType(ShippingRate::TYPE_LAGOS)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (ShippingRate $r) => [
                'id' => $r->id,
                'key' => $r->code,
                'code' => $r->code,
                'label' => $r->name,
                'name' => $r->name,
                'base' => (float) $r->base_rate,
                'base_rate' => (float) $r->base_rate,
                'is_active' => $r->is_active,
                'sort_order' => $r->sort_order,
                'type' => $r->type,
            ])
            ->values()
            ->all();

        $states = ShippingRate::ofType(ShippingRate::TYPE_STATE)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (ShippingRate $r) => [
                'id' => $r->id,
                'key' => $r->code,
                'code' => $r->code,
                'name' => $r->name,
                'label' => $r->name,
                'base' => (float) $r->base_rate,
                'base_rate' => (float) $r->base_rate,
                'is_active' => $r->is_active,
                'sort_order' => $r->sort_order,
                'type' => $r->type,
            ])
            ->values()
            ->all();

        return [
            'store_location' => 'Tonia Emmanuel Ave, 106104, Aja, Lagos, Nigeria',
            'extra_block_size' => self::EXTRA_BLOCK_SIZE,
            'extra_block_fee' => self::EXTRA_BLOCK_FEE,
            'lagos_areas' => $lagos,
            'states' => $states,
            'rates' => ShippingRate::orderBy('type')->orderBy('sort_order')->orderBy('name')->get(),
        ];
    }

    public function activeLagosAreas(): array
    {
        return ShippingRate::ofType(ShippingRate::TYPE_LAGOS)
            ->active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (ShippingRate $r) => [
                'key' => $r->code,
                'label' => $r->name,
                'base' => (float) $r->base_rate,
            ])
            ->values()
            ->all();
    }

    public function isNigeria(string $country): bool
    {
        $normalized = strtolower(trim($country));
        return in_array($normalized, ['nigeria', 'ng', 'federal republic of nigeria'], true);
    }

    public function isLagos(string $state): bool
    {
        return strtolower(trim($state)) === 'lagos';
    }

    private function findRate(string $state, ?string $lagosArea): ?ShippingRate
    {
        if ($this->isLagos($state)) {
            if (!$lagosArea) {
                return null;
            }
            return ShippingRate::ofType(ShippingRate::TYPE_LAGOS)
                ->active()
                ->where('code', $lagosArea)
                ->first();
        }

        $normalized = $this->normalizeStateName($state);

        return ShippingRate::ofType(ShippingRate::TYPE_STATE)
            ->active()
            ->get()
            ->first(function (ShippingRate $rate) use ($normalized, $state) {
                return strtolower($rate->name) === strtolower($normalized)
                    || strtolower($rate->name) === strtolower(trim($state))
                    || $rate->code === Str::slug($normalized)
                    || $rate->code === Str::slug($state);
            });
    }

    private function normalizeStateName(string $state): string
    {
        $normalized = strtolower(trim($state));
        $aliases = [
            'federal capital territory' => 'FCT / Abuja',
            'fct' => 'FCT / Abuja',
            'abuja' => 'FCT / Abuja',
            'abuja federal capital territory' => 'FCT / Abuja',
            'nassarawa' => 'Nasarawa',
            'nasarawa' => 'Nasarawa',
            'akwa-ibom' => 'Akwa Ibom',
            'akwaibom' => 'Akwa Ibom',
            'cross-river' => 'Cross River',
            'crossriver' => 'Cross River',
        ];

        return $aliases[$normalized] ?? $state;
    }
}
