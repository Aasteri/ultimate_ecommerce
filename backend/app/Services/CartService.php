<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartService
{
    public function getOrCreateCart(?User $user, ?string $sessionId): Cart
    {
        if ($user) {
            $this->mergeSessionCart($user, $sessionId);
            return Cart::firstOrCreate(['user_id' => $user->id]);
        }

        $sessionId = $sessionId ?: Str::uuid()->toString();

        return Cart::firstOrCreate(
            ['session_id' => $sessionId, 'user_id' => null]
        );
    }

    public function resolveUser(Request $request): ?User
    {
        $user = $request->user() ?? $request->user('sanctum');
        if ($user instanceof User) {
            return $user;
        }

        $bearer = $request->bearerToken();
        if (!$bearer) {
            return null;
        }

        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($bearer);
        $tokenable = $accessToken?->tokenable;

        return $tokenable instanceof User ? $tokenable : null;
    }

    public function mergeSessionCart(User $user, ?string $sessionId): void
    {
        if (!$sessionId) {
            return;
        }

        $sessionCart = Cart::where('session_id', $sessionId)->whereNull('user_id')->first();
        if (!$sessionCart) {
            return;
        }

        $userCart = Cart::firstOrCreate(['user_id' => $user->id]);

        foreach ($sessionCart->items as $item) {
            $this->addItem($userCart, $item->product_id, $item->variant_type, $item->quantity);
        }

        $sessionCart->items()->delete();
        $sessionCart->delete();
    }

    public function addItem(Cart $cart, int $productId, string $variantType, int $quantity = 1): CartItem
    {
        $item = $cart->items()
            ->where('product_id', $productId)
            ->where('variant_type', $variantType)
            ->first();

        if ($item) {
            $item->update(['quantity' => $item->quantity + $quantity]);
            return $item->fresh('product.formats');
        }

        return $cart->items()->create([
            'product_id' => $productId,
            'variant_type' => $variantType,
            'quantity' => $quantity,
        ])->load('product.formats');
    }

    public function formatCart(Cart $cart): array
    {
        $cart->load(['items.product.formats', 'items.product.category', 'items.product.shop']);

        $items = [];
        $subtotal = 0.0;

        foreach ($cart->items as $item) {
            $product = $item->product;
            if (!$product) {
                continue;
            }

            $unitPrice = (float) ($product->getPriceForVariant($item->variant_type) ?? 0);
            $lineTotal = $unitPrice * (int) $item->quantity;
            $subtotal += $lineTotal;

            $items[] = [
                'id' => $item->id,
                'product_id' => $product->id,
                'title' => $product->title,
                'slug' => $product->slug,
                'preview_image' => $product->preview_image,
                'variant_type' => $item->variant_type,
                'quantity' => (int) $item->quantity,
                'unit_price' => $unitPrice,
                'line_total' => $lineTotal,
                'formats' => $product->formats->pluck('format'),
                'width_mm' => $product->width_mm,
                'height_mm' => $product->height_mm,
                'shop_id' => $product->shop_id,
                'shop' => $product->shop ? [
                    'id' => $product->shop->id,
                    'name' => $product->shop->name,
                    'slug' => $product->shop->slug,
                ] : null,
            ];
        }

        return [
            'id' => $cart->id,
            'session_id' => $cart->session_id,
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'item_count' => (int) $cart->items->sum('quantity'),
        ];
    }
}
