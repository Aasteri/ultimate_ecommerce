<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Services\MarketplaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorShopController extends Controller
{
    public function __construct(private MarketplaceService $marketplace) {}

    public function show(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;
        if (!$shop) {
            return response()->json(['shop' => null]);
        }

        return response()->json(['shop' => $this->serialize($shop)]);
    }

    public function apply(Request $request): JsonResponse
    {
        if ($request->user()->shop) {
            return response()->json(['message' => 'You already have a shop'], 422);
        }

        $data = $request->validate([
            'name' => 'required|string|max:120',
            'bio' => 'nullable|string|max:2000',
            'payout_bank_name' => 'nullable|string|max:120',
            'payout_account_name' => 'nullable|string|max:120',
            'payout_account_number' => 'nullable|digits:10',
        ]);

        $shop = Shop::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'slug' => $this->marketplace->uniqueShopSlug($data['name']),
            'bio' => $data['bio'] ?? null,
            'status' => 'pending',
            'payout_bank_name' => $data['payout_bank_name'] ?? null,
            'payout_account_name' => $data['payout_account_name'] ?? null,
            'payout_account_number' => $data['payout_account_number'] ?? null,
        ]);

        return response()->json(['shop' => $this->serialize($shop)], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;
        if (!$shop) {
            return response()->json(['message' => 'No shop found'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'bio' => 'nullable|string|max:2000',
            'payout_bank_name' => 'nullable|string|max:120',
            'payout_account_name' => 'nullable|string|max:120',
            'payout_account_number' => 'nullable|digits:10',
        ]);

        if (!empty($data['name']) && $data['name'] !== $shop->name && $shop->status !== 'approved') {
            $data['slug'] = $this->marketplace->uniqueShopSlug($data['name']);
        }

        $shop->update($data);

        return response()->json(['shop' => $this->serialize($shop->fresh())]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;
        if (!$shop) {
            return response()->json(['message' => 'No shop found'], 404);
        }

        $request->validate(['logo' => 'required|image|max:4096']);
        $path = $request->file('logo')->store('shops', 'public');
        $shop->update(['logo' => $path]);

        return response()->json(['logo' => $path, 'shop' => $this->serialize($shop->fresh())]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;
        $paid = $shop->vendorOrders()->whereIn('status', ['paid', 'processing', 'completed']);

        return response()->json([
            'shop' => $this->serialize($shop),
            'commission_rate' => $shop->effectiveCommissionRate(),
            'available_balance' => $shop->availableBalance(),
            'lifetime_earnings' => $shop->lifetimeEarnings(),
            'products_count' => $shop->products()->count(),
            'published_products' => $shop->products()->where('status', 'published')->count(),
            'orders_count' => $shop->vendorOrders()->count(),
            'paid_orders' => (clone $paid)->count(),
            'pending_payouts' => $shop->payouts()->where('status', 'pending')->count(),
            'recent_orders' => $shop->vendorOrders()
                ->with(['order:id,order_number,created_at,payment_status'])
                ->orderByDesc('created_at')
                ->limit(8)
                ->get(),
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
