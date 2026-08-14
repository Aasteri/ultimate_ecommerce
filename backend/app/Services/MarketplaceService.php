<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\Shop;
use App\Models\User;
use App\Models\VendorOrder;
use App\Models\WalletTransaction;
use Illuminate\Support\Str;

class MarketplaceService
{
    public function platformCommissionPercent(?Shop $shop = null): float
    {
        if ($shop && $shop->commission_rate !== null) {
            return (float) $shop->commission_rate;
        }

        return (float) (Setting::get('platform_commission_percent', '10') ?? 10);
    }

    public function referralPercent(): float
    {
        return (float) (Setting::get('referral_percent', '10') ?? 10);
    }

    public function uniqueReferralCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }

    public function uniqueShopSlug(string $name): string
    {
        $slug = Str::slug($name) ?: 'shop';
        $base = $slug;
        $i = 1;
        while (Shop::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }

    public function uniqueVendorOrderNumber(): string
    {
        do {
            $number = 'VO-' . strtoupper(Str::random(8));
        } while (VendorOrder::where('vendor_order_number', $number)->exists());

        return $number;
    }

    /**
     * @param  array<int, float>  $shippingByShop
     * @param  array<int, float>  $discountByShop
     */
    public function splitOrder(Order $order, array $shippingByShop = [], array $discountByShop = []): void
    {
        $order->load(['items.product.shop']);
        $groups = $order->items->groupBy(function ($item) {
            return $item->shop_id ?: ($item->product?->shop_id);
        });

        foreach ($groups as $shopId => $items) {
            if (!$shopId) {
                continue;
            }
            $shop = Shop::find($shopId);
            if (!$shop) {
                continue;
            }

            $subtotal = round((float) $items->sum('total_price'), 2);
            $shopDiscount = round((float) ($discountByShop[$shop->id] ?? $discountByShop[(string) $shop->id] ?? 0), 2);
            $netSubtotal = max(0, round($subtotal - $shopDiscount, 2));
            $shippingShare = round((float) ($shippingByShop[$shop->id] ?? $shippingByShop[(string) $shop->id] ?? 0), 2);

            if ($shippingShare <= 0 && (float) $order->shipping_cost > 0) {
                $physicalQty = (int) $items->where('variant_type', 'physical')->sum('quantity');
                $orderPhysicalQty = (int) $order->items->where('variant_type', 'physical')->sum('quantity');
                if ($physicalQty > 0 && $orderPhysicalQty > 0) {
                    $shippingShare = round(((float) $order->shipping_cost) * ($physicalQty / $orderPhysicalQty), 2);
                }
            }

            $rate = $this->platformCommissionPercent($shop);
            $commission = round($netSubtotal * ($rate / 100), 2);
            $vendorAmount = round($netSubtotal - $commission + $shippingShare, 2);

            $existing = VendorOrder::where('order_id', $order->id)->where('shop_id', $shop->id)->first();

            VendorOrder::updateOrCreate(
                ['order_id' => $order->id, 'shop_id' => $shop->id],
                [
                    'vendor_order_number' => $existing?->vendor_order_number ?? $this->uniqueVendorOrderNumber(),
                    'subtotal' => $netSubtotal,
                    'shipping_cost' => $shippingShare,
                    'commission_rate' => $rate,
                    'commission_amount' => $commission,
                    'vendor_amount' => $vendorAmount,
                    'status' => $order->payment_status === 'paid' ? 'paid' : 'pending',
                ]
            );
        }
    }

    public function markVendorOrdersPaid(Order $order): void
    {
        $allDigital = $order->items->every(fn ($item) => $item->variant_type === 'digital');
        $order->vendorOrders()->where('status', 'pending')->update([
            'status' => $allDigital ? 'completed' : 'paid',
        ]);
        $this->creditReferralIfEligible($order);
    }

    public function creditReferralIfEligible(Order $order): void
    {
        $buyer = $order->user;
        if (!$buyer || !$buyer->referred_by_id || $buyer->referral_first_order_id) {
            return;
        }

        $alreadyPaid = Order::where('user_id', $buyer->id)
            ->where('payment_status', 'paid')
            ->where('id', '!=', $order->id)
            ->exists();
        if ($alreadyPaid) {
            $buyer->update(['referral_first_order_id' => $order->id]);
            return;
        }

        $referrer = User::find($buyer->referred_by_id);
        if (!$referrer) {
            return;
        }

        $percent = $this->referralPercent();
        $base = max(0, (float) $order->subtotal - (float) $order->discount_amount);
        $amount = round($base * ($percent / 100), 2);
        if ($amount <= 0) {
            $buyer->update(['referral_first_order_id' => $order->id]);
            return;
        }

        $referrer->increment('wallet_balance', $amount);
        WalletTransaction::create([
            'user_id' => $referrer->id,
            'type' => 'referral_credit',
            'amount' => $amount,
            'description' => "{$percent}% of {$buyer->name}'s first purchase ({$order->order_number})",
            'order_id' => $order->id,
        ]);
        $buyer->update(['referral_first_order_id' => $order->id]);
    }
}
