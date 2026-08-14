<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function __construct(private CouponService $coupons) {}

    public function apply(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:32',
            'subtotal' => 'required|numeric|min:0',
        ]);

        try {
            $coupon = $this->coupons->findUsable($data['code'], $request->user(), (float) $data['subtotal']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $discount = $this->coupons->discountAmount($coupon, (float) $data['subtotal']);

        return response()->json([
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount' => $discount,
            'description' => $coupon->description,
        ]);
    }
}
