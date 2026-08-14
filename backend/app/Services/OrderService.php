<?php

namespace App\Services;

use App\Models\ContactMessage;
use App\Models\CouponRedemption;
use App\Models\Download;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        private ShippingService $shippingService,
        private MarketplaceService $marketplaceService,
        private CouponService $couponService,
    ) {}

    public function createFromCart(User $user, array $cartData, ?array $shippingAddress, ?string $notes, ?string $couponCode = null): Order
    {
        $items = collect($cartData['items']);
        $hasPhysical = $items->contains(fn ($item) => $item['variant_type'] === 'physical');
        $shippingByShop = [];
        $shippingCost = 0.0;
        $needsDiscussion = false;

        if ($hasPhysical) {
            $groups = $items->where('variant_type', 'physical')->groupBy('shop_id');
            foreach ($groups as $shopId => $shopItems) {
                $qty = (int) $shopItems->sum('quantity');
                $quote = $this->shippingService->quote(
                    $shippingAddress['country'] ?? '',
                    $shippingAddress['state'] ?? '',
                    $qty,
                    $shippingAddress['lagos_area'] ?? null,
                );

                if (!empty($quote['error'])) {
                    throw new \InvalidArgumentException($quote['label'] ?? 'Invalid shipping destination');
                }

                $shopShipping = (float) $quote['shipping_cost'];
                $shippingByShop[(int) $shopId] = $shopShipping;
                $shippingCost += $shopShipping;
                $needsDiscussion = $needsDiscussion || (bool) $quote['needs_discussion'];
                $shippingAddress['shipping_label'] = $quote['label'];
            }

            $shippingAddress['physical_quantity'] = (int) $items->where('variant_type', 'physical')->sum('quantity');
            $shippingAddress['shop_shipping'] = $shippingByShop;
        }

        $subtotal = (float) $cartData['subtotal'];
        $coupon = null;
        $discount = 0.0;
        if ($couponCode) {
            $coupon = $this->couponService->findUsable($couponCode, $user, $subtotal);
            $discount = $this->couponService->discountAmount($coupon, $subtotal);
        }

        $order = Order::create([
            'order_number' => 'MM-' . strtoupper(Str::random(8)),
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'subtotal' => $subtotal,
            'shipping_cost' => round($shippingCost, 2),
            'coupon_id' => $coupon?->id,
            'discount_amount' => $discount,
            'total' => round($subtotal - $discount + $shippingCost, 2),
            'currency' => Setting::get('currency', 'NGN') ?? 'NGN',
            'shipping_address' => $shippingAddress,
            'notes' => $notes,
            'shipping_discussion_needed' => $needsDiscussion,
        ]);

        foreach ($cartData['items'] as $item) {
            $product = Product::with('shop')->findOrFail($item['product_id']);
            if (!$product->isPurchasable()) {
                throw new \InvalidArgumentException("{$product->title} is no longer available");
            }

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'shop_id' => $product->shop_id,
                'variant_type' => $item['variant_type'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['line_total'],
                'fulfillment_status' => $item['variant_type'] === 'physical' ? 'pending' : 'completed',
                'product_title' => $product->title,
            ]);

            if ($item['variant_type'] === 'physical') {
                $product->decrement('physical_stock', $item['quantity']);
            }
        }

        $order->load('items');
        $discountByShop = [];
        if ($discount > 0 && $subtotal > 0) {
            foreach ($order->items->groupBy('shop_id') as $shopId => $shopItems) {
                $shopSub = (float) $shopItems->sum('total_price');
                $discountByShop[(int) $shopId] = round($discount * ($shopSub / $subtotal), 2);
            }
        }

        $this->marketplaceService->splitOrder($order->fresh('items'), $shippingByShop, $discountByShop);

        if ($coupon) {
            $coupon->increment('used_count');
            CouponRedemption::create([
                'coupon_id' => $coupon->id,
                'user_id' => $user->id,
                'order_id' => $order->id,
                'amount' => $discount,
            ]);
        }

        return $order->load(['items', 'vendorOrders']);
    }

    public function markPaid(Order $order, string $reference, ?string $txId = null): Order
    {
        $order->update([
            'payment_status' => 'paid',
            'status' => 'processing',
            'payment_reference' => $reference,
            'flutterwave_tx_id' => $txId,
        ]);

        $order->load(['items', 'user', 'vendorOrders']);

        foreach ($order->items as $item) {
            if ($item->variant_type === 'digital') {
                Download::firstOrCreate([
                    'user_id' => $order->user_id,
                    'order_item_id' => $item->id,
                    'product_id' => $item->product_id,
                ]);
            }
        }

        $allDigital = $order->items->every(fn ($item) => $item->variant_type === 'digital');
        if ($allDigital) {
            $order->update(['status' => 'completed']);
        }

        $this->marketplaceService->markVendorOrdersPaid($order);

        if ($order->shipping_discussion_needed) {
            $this->notifyAdminOfInternationalShipping($order->fresh(['user', 'items']));
        }

        return $order->fresh(['items', 'vendorOrders']);
    }

    private function notifyAdminOfInternationalShipping(Order $order): void
    {
        $address = $order->shipping_address ?? [];
        $lines = [
            "International physical order {$order->order_number} has been paid.",
            'Shipping must be discussed with sales before dispatch.',
            '',
            'Customer: ' . ($order->user->name ?? '') . ' (' . ($order->user->email ?? '') . ')',
            'Phone: ' . ($address['phone'] ?? '—'),
            'Country: ' . ($address['country'] ?? '—'),
            'State: ' . ($address['state'] ?? '—'),
            'City: ' . ($address['city'] ?? '—'),
            'Street: ' . ($address['street'] ?? '—'),
            'Physical pieces: ' . ($address['physical_quantity'] ?? '—'),
            'Order total (ex-shipping): ' . $order->currency . ' ' . $order->subtotal,
        ];

        ContactMessage::create([
            'name' => $order->user->name ?? 'Customer',
            'email' => $order->user->email ?? '',
            'subject' => "Shipping discussion needed — {$order->order_number}",
            'message' => implode("\n", $lines),
            'is_read' => false,
        ]);
    }
}
