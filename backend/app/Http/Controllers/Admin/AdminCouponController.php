<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminCouponController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Coupon::orderByDesc('created_at')->paginate(30));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['code'] = strtoupper($data['code']);
        $coupon = Coupon::create($data);

        return response()->json($coupon, 201);
    }

    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $data = $request->validate([
            'code' => 'sometimes|string|max:32|regex:/^[A-Z0-9]+$/|unique:coupons,code,' . $coupon->id,
            'type' => 'sometimes|in:percent,fixed',
            'value' => ['sometimes', 'numeric', 'min:0.01', 'max:99999999.99', Rule::when($request->input('type', $coupon->type) === 'percent', 'max:100')],
            'min_subtotal' => 'nullable|numeric|min:0|max:99999999.99',
            'max_uses' => 'nullable|integer|min:1|max:100000',
            'max_uses_per_user' => 'nullable|integer|min:1|max:100',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
            'description' => 'nullable|string|max:255',
        ]);
        if (!empty($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }
        $coupon->update($data);

        return response()->json($coupon->fresh());
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function validated(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'code' => 'required|string|max:32|regex:/^[A-Z0-9]+$/|unique:coupons,code',
            'type' => ($creating ? 'required' : 'sometimes') . '|in:percent,fixed',
            'value' => [
                $creating ? 'required' : 'sometimes',
                'numeric',
                'min:0.01',
                'max:99999999.99',
                Rule::when($request->input('type') === 'percent', 'max:100'),
            ],
            'min_subtotal' => 'nullable|numeric|min:0|max:99999999.99',
            'max_uses' => 'nullable|integer|min:1|max:100000',
            'max_uses_per_user' => 'nullable|integer|min:1|max:100',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
            'description' => 'nullable|string|max:255',
        ]);
    }
}
