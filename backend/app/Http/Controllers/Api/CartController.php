<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartService $cartService) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->cartService->getOrCreateCart(
            $this->cartService->resolveUser($request),
            $request->header('X-Session-Id')
        );

        return response()->json($this->cartService->formatCart($cart));
    }

    public function add(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_type' => 'required|in:digital,physical',
            'quantity' => 'integer|min:1|max:500',
        ]);

        $product = Product::with('shop')->findOrFail($data['product_id']);
        if (!$product->isPurchasable()) {
            return response()->json(['message' => 'This product is not available'], 422);
        }

        $cart = $this->cartService->getOrCreateCart(
            $this->cartService->resolveUser($request),
            $request->header('X-Session-Id')
        );

        $this->cartService->addItem(
            $cart,
            $data['product_id'],
            $data['variant_type'],
            $data['quantity'] ?? 1
        );

        return response()->json($this->cartService->formatCart($cart->fresh()));
    }

    public function update(Request $request, CartItem $cartItem): JsonResponse
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1|max:500',
        ]);

        if (!$this->ownsCartItem($request, $cartItem)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $cartItem->update(['quantity' => $data['quantity']]);

        return response()->json($this->cartService->formatCart($cartItem->cart->fresh()));
    }

    public function remove(Request $request, CartItem $cartItem): JsonResponse
    {
        if (!$this->ownsCartItem($request, $cartItem)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $cart = $cartItem->cart;
        $cartItem->delete();

        return response()->json($this->cartService->formatCart($cart->fresh()));
    }

    private function ownsCartItem(Request $request, CartItem $cartItem): bool
    {
        $user = $this->cartService->resolveUser($request);
        $sessionId = $request->header('X-Session-Id');
        $cart = $cartItem->cart;

        if ($user && $cart->user_id === $user->id) {
            return true;
        }

        return $sessionId && $cart->session_id === $sessionId;
    }
}
