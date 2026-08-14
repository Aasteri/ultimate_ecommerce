<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Services\VendorActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminShopController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Shop::with(['user:id,name,email'])
            ->withCount('products')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $shops = $query->paginate($request->integer('per_page', 20));
        $shops->getCollection()->transform(fn (Shop $shop) => $this->serialize($shop));

        return response()->json($shops);
    }

    public function show(Shop $shop): JsonResponse
    {
        $shop->load(['user:id,name,email', 'products']);

        return response()->json([
            'shop' => $this->serialize($shop),
            'available_balance' => $shop->availableBalance(),
            'lifetime_earnings' => $shop->lifetimeEarnings(),
            'commission_rate' => $shop->effectiveCommissionRate(),
        ]);
    }

    public function update(Request $request, Shop $shop): JsonResponse
    {
        $data = $request->validate([
            'status' => 'sometimes|in:pending,approved,rejected,suspended',
            'rejection_reason' => 'nullable|string|max:1000',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'name' => 'sometimes|string|max:120',
            'bio' => 'nullable|string|max:2000',
        ]);

        if (($data['status'] ?? null) === 'approved') {
            $data['approved_at'] = $shop->approved_at ?? now();
            $data['rejection_reason'] = null;
        }

        $shop->update($data);

        return response()->json($this->serialize($shop->fresh('user')));
    }

    public function seedActivity(Request $request, Shop $shop, VendorActivityService $seeder): JsonResponse
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:1000|max:50000000',
            'days' => 'nullable|integer|min:14|max:365',
        ]);

        try {
            $result = $seeder->seed($shop, (float) $data['amount'], (int) ($data['days'] ?? 90));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Activity generated for '.$shop->name,
            ...$result,
            'shop' => $this->serialize($shop->fresh('user')),
        ]);
    }

    private function serialize(Shop $shop): Shop
    {
        return $shop->makeVisible([
            'payout_bank_name', 'payout_account_name', 'payout_account_number',
            'rejection_reason', 'commission_rate',
        ]);
    }
}
