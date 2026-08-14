<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\User;

class CouponService
{
    public function findUsable(string $code, User $user, float $subtotal): Coupon
    {
        $coupon = Coupon::where('code', strtoupper(trim($code)))->first();
        if (!$coupon) {
            throw new \InvalidArgumentException('Invalid coupon code');
        }

        $this->assertUsable($coupon, $user, $subtotal);

        return $coupon;
    }

    public function assertUsable(Coupon $coupon, User $user, float $subtotal): void
    {
        if (!$coupon->is_active) {
            throw new \InvalidArgumentException('This coupon is no longer active');
        }
        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            throw new \InvalidArgumentException('This coupon has expired');
        }
        if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
            throw new \InvalidArgumentException('This coupon has reached its usage limit');
        }
        if ((float) $subtotal < (float) $coupon->min_subtotal) {
            throw new \InvalidArgumentException('Order subtotal is below this coupon’s minimum');
        }

        $userUses = $coupon->redemptions()->where('user_id', $user->id)->count();
        if ($userUses >= (int) $coupon->max_uses_per_user) {
            throw new \InvalidArgumentException('You have already used this coupon');
        }
    }

    public function discountAmount(Coupon $coupon, float $subtotal): float
    {
        if ($coupon->type === 'fixed') {
            return round(min((float) $coupon->value, $subtotal), 2);
        }

        return round($subtotal * ((float) $coupon->value / 100), 2);
    }
}
