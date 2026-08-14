<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ProductOffer
{
    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function normalize(array $data): array
    {
        $digital = filter_var($data['is_digital_available'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $physical = filter_var($data['is_physical_available'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (! $digital && ! $physical) {
            throw ValidationException::withMessages([
                'is_digital_available' => 'Select whether this product is digital, physical, or both.',
            ]);
        }

        if ($digital && ($data['digital_price'] === null || $data['digital_price'] === '')) {
            throw ValidationException::withMessages([
                'digital_price' => 'Digital price is required for digital products.',
            ]);
        }

        if ($digital && (! is_numeric($data['digital_price']) || (float) $data['digital_price'] < 1)) {
            throw ValidationException::withMessages([
                'digital_price' => 'Digital price must be at least ₦1.',
            ]);
        }

        if ($physical && ($data['physical_price'] === null || $data['physical_price'] === '')) {
            throw ValidationException::withMessages([
                'physical_price' => 'Physical price is required for physical products.',
            ]);
        }

        if ($physical && (! is_numeric($data['physical_price']) || (float) $data['physical_price'] < 1)) {
            throw ValidationException::withMessages([
                'physical_price' => 'Physical price must be at least ₦1.',
            ]);
        }

        $data['is_digital_available'] = $digital;
        $data['is_physical_available'] = $physical;

        if ($digital && isset($data['digital_price']) && is_numeric($data['digital_price'])) {
            $data['digital_price'] = round((float) $data['digital_price'], 2);
        }

        if ($physical && isset($data['physical_price']) && is_numeric($data['physical_price'])) {
            $data['physical_price'] = round((float) $data['physical_price'], 2);
        }

        if (! $digital) {
            $data['digital_price'] = null;
            $data['formats'] = [];
        }

        if (! $physical) {
            $data['physical_price'] = null;
            $data['physical_stock'] = 0;
            $data['width_mm'] = null;
            $data['height_mm'] = null;
        } else {
            if (isset($data['width_mm']) && $data['width_mm'] !== null && $data['width_mm'] !== '' && is_numeric($data['width_mm'])) {
                $data['width_mm'] = round((float) $data['width_mm'], 2);
            }
            if (isset($data['height_mm']) && $data['height_mm'] !== null && $data['height_mm'] !== '' && is_numeric($data['height_mm'])) {
                $data['height_mm'] = round((float) $data['height_mm'], 2);
            }
        }

        return $data;
    }
}
