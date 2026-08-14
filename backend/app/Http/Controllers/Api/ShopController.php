<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $shop = Shop::where('slug', $slug)->where('status', 'approved')->firstOrFail();

        $products = Product::with(['category', 'formats', 'shop:id,name,slug,logo'])
            ->fromApprovedShops()
            ->where('shop_id', $shop->id)
            ->where('status', 'published')
            ->orderByDesc('created_at')
            ->paginate(24);

        return response()->json([
            'shop' => $shop->only(['id', 'name', 'slug', 'bio', 'logo', 'status', 'created_at']),
            'products' => $products,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $shops = Shop::where('status', 'approved')
            ->withCount(['products as published_products_count' => fn ($q) => $q->where('status', 'published')])
            ->orderBy('name')
            ->paginate($request->integer('per_page', 24));

        return response()->json($shops);
    }
}
