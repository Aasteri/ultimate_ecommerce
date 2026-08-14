<?php

namespace App\Services;

use App\Models\Download;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payout;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Models\VendorOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;

class VendorActivityService
{
    private const CUSTOMERS = [
        ['Chioma Okafor', '0803'],
        ['Tunde Adebayo', '0805'],
        ['Ngozi Eze', '0806'],
        ['Ibrahim Musa', '0807'],
        ['Funke Adeyemi', '0809'],
        ['Emeka Nwosu', '0810'],
        ['Aisha Bello', '0811'],
        ['Kunle Balogun', '0812'],
        ['Blessing Okoro', '0813'],
        ['Yusuf Abdullahi', '0814'],
        ['Amaka Chukwu', '0815'],
        ['Seyi Ogundipe', '0816'],
        ['Fatima Suleiman', '0817'],
        ['Chinedu Obi', '0818'],
        ['Halima Mohammed', '0903'],
        ['Ifeanyi Okeke', '0909'],
        ['Zainab Lawal', '0703'],
        ['Bode Fashola', '0706'],
        ['Nneka Umeh', '0802'],
        ['Ahmed Garba', '0808'],
        ['Tope Alabi', '0812'],
        ['Hadiza Usman', '0901'],
        ['Obinna Ike', '0708'],
        ['Maryam Tanko', '0809'],
        ['Femi Oladipo', '0810'],
        ['Adaeze Nnamdi', '0803'],
        ['Sani Bello', '0806'],
        ['Yetunde Bakare', '0811'],
        ['Chukwudi Eke', '0704'],
        ['Rukayat Salami', '0902'],
        ['Gbenga Ajayi', '0805'],
        ['Kemi Osagie', '0813'],
        ['Uche Nwafor', '0807'],
        ['Amina Yusuf', '0814'],
        ['Segun Adeleke', '0908'],
    ];

    private const LOCATIONS = [
        ['Lagos', 'Lekki Phase 1', '12 Admiralty Way', 'lekki'],
        ['Lagos', 'Ikeja GRA', '8 Isaac John Street', 'ikeja'],
        ['Lagos', 'Yaba', '15 Herbert Macaulay Way', 'ikeja'],
        ['Lagos', 'Surulere', '22 Adeniran Ogunsanya', 'surulere'],
        ['Lagos', 'Ajah', '4 Abraham Adesanya Estate', 'ajah'],
        ['Lagos', 'Victoria Island', '18 Kofo Abayomi Street', 'vi'],
        ['Lagos', 'Ikoyi', '9 Glover Road', 'vi'],
        ['Lagos', 'Maryland', '11 Mobolaji Bank Anthony', 'ikeja'],
        ['Ogun', 'Abeokuta', '6 Ibara Housing Estate', null],
        ['Oyo', 'Ibadan', '14 Ring Road, Challenge', null],
        ['Osun', 'Osogbo', '3 Gbongan Road', null],
        ['FCT / Abuja', 'Wuse 2', '21 Aminu Kano Crescent', null],
        ['FCT / Abuja', 'Gwarinpa', 'Life Camp Extension, 3rd Avenue', null],
        ['FCT / Abuja', 'Maitama', '7 Panama Street', null],
        ['Rivers', 'Port Harcourt', '16 Aba Road, GRA', null],
        ['Rivers', 'Port Harcourt', '4 Trans Amadi Layout', null],
        ['Enugu', 'Enugu', '10 Independence Layout', null],
        ['Anambra', 'Awka', '8 Zik Avenue', null],
        ['Edo', 'Benin City', '12 Sapele Road', null],
        ['Delta', 'Asaba', '5 Nnebisi Road', null],
        ['Kaduna', 'Kaduna', '19 Ahmadu Bello Way', null],
        ['Kano', 'Kano', '7 Zoo Road', null],
        ['Kwara', 'Ilorin', '11 Unity Road', null],
        ['Plateau', 'Jos', '4 Yakubu Gowon Way', null],
        ['Imo', 'Owerri', '9 Wetheral Road', null],
        ['Abia', 'Aba', '6 Azikiwe Road', null],
        ['Akwa Ibom', 'Uyo', '15 Abak Road', null],
        ['Cross River', 'Calabar', '8 Marian Road', null],
        ['Ondo', 'Akure', '3 Oba Adesida Road', null],
        ['Ekiti', 'Ado-Ekiti', '5 Iworoko Road', null],
    ];

    public function __construct(
        private MarketplaceService $marketplace,
        private OrderService $orderService,
        private ShippingService $shippingService,
    ) {}

    /**
     * @return array{orders:int,customers:int,sales_total:float,vendor_earnings:float,available_balance:float,payouts:int}
     */
    public function seed(Shop $shop, float $targetSales, int $days = 90): array
    {
        if ($targetSales < 1000) {
            throw new InvalidArgumentException('Enter at least ₦1,000 in sales.');
        }
        if ($targetSales > 50000000) {
            throw new InvalidArgumentException('Maximum per run is ₦50,000,000. Run again if you need more.');
        }

        $products = $shop->products()
            ->where('status', 'published')
            ->get();

        if ($products->isEmpty()) {
            throw new InvalidArgumentException('This shop has no published products. Publish at least one product first.');
        }

        $days = max(14, min(365, $days));
        $customers = $this->customerPool();

        return DB::transaction(function () use ($shop, $products, $targetSales, $days, $customers) {
            $sales = 0.0;
            $orderCount = 0;
            $usedCustomers = [];
            $safety = 0;

            while ($sales < $targetSales && $safety < 600) {
                $safety++;
                $remaining = $targetSales - $sales;
                $created = $this->createOrder($shop, $products, $customers, $days, $remaining, $usedCustomers);
                if (!$created) {
                    break;
                }
                $sales += $created;
                $orderCount++;
            }

            $payouts = $this->seedPayoutHistory($shop);

            $shop->refresh();

            return [
                'orders' => $orderCount,
                'customers' => count($usedCustomers),
                'sales_total' => round($sales, 2),
                'vendor_earnings' => $shop->lifetimeEarnings(),
                'available_balance' => $shop->availableBalance(),
                'payouts' => $payouts,
            ];
        });
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Product>  $products
     * @param  array<int, User>  $customers
     * @param  array<int, true>  $usedCustomers
     */
    private function createOrder($shop, $products, array $customers, int $days, float $remaining, array &$usedCustomers): ?float
    {
        $buyer = $customers[array_rand($customers)];
        $usedCustomers[$buyer->id] = true;
        $location = self::LOCATIONS[array_rand(self::LOCATIONS)];
        [$state, $city, $street, $lagosArea] = $location;

        $lineCount = $remaining < 4000 ? 1 : random_int(1, min(3, $products->count()));
        $picked = $products->random($lineCount);
        if ($picked instanceof Product) {
            $picked = collect([$picked]);
        }

        $items = [];
        $subtotal = 0.0;
        $hasPhysical = false;

        foreach ($picked as $product) {
            $variant = $this->pickVariant($product);
            if (!$variant) {
                continue;
            }
            $qty = $variant === 'digital' ? 1 : random_int(1, 3);
            $unit = (float) $product->getPriceForVariant($variant);
            if ($unit <= 0) {
                continue;
            }
            $line = round($unit * $qty, 2);
            $items[] = [
                'product' => $product,
                'variant' => $variant,
                'quantity' => $qty,
                'unit_price' => $unit,
                'line_total' => $line,
            ];
            $subtotal += $line;
            $hasPhysical = $hasPhysical || $variant === 'physical';
        }

        if (!$items || $subtotal <= 0) {
            return null;
        }

        $shippingCost = 0.0;
        $shippingByShop = [];
        $address = [
            'name' => $buyer->name,
            'phone' => $buyer->phone,
            'country' => 'NG',
            'state' => $state,
            'city' => $city,
            'street' => $street,
        ];

        if ($hasPhysical) {
            $qty = (int) collect($items)->where('variant', 'physical')->sum('quantity');
            $quote = $this->shippingService->quote('NG', $state, $qty, $lagosArea);
            $shippingCost = (float) ($quote['shipping_cost'] ?? 0);
            $shippingByShop[$shop->id] = $shippingCost;
            $address['lagos_area'] = $lagosArea;
            $address['shipping_label'] = $quote['label'] ?? null;
            $address['physical_quantity'] = $qty;
            $address['shop_shipping'] = $shippingByShop;
        }

        $createdAt = now()
            ->subDays(random_int(0, $days))
            ->subMinutes(random_int(0, 1400))
            ->subSeconds(random_int(0, 50));

        $order = Order::create([
            'order_number' => 'MM-' . strtoupper(Str::random(8)),
            'user_id' => $buyer->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'subtotal' => round($subtotal, 2),
            'shipping_cost' => round($shippingCost, 2),
            'discount_amount' => 0,
            'total' => round($subtotal + $shippingCost, 2),
            'currency' => 'NGN',
            'shipping_address' => $address,
        ]);

        foreach ($items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product']->id,
                'shop_id' => $shop->id,
                'variant_type' => $item['variant'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['line_total'],
                'fulfillment_status' => $item['variant'] === 'physical' ? 'pending' : 'completed',
                'product_title' => $item['product']->title,
            ]);
        }

        $this->marketplace->splitOrder($order->fresh('items'), $shippingByShop);
        $this->orderService->markPaid($order->fresh(['items', 'vendorOrders']), 'SEED-' . strtoupper(Str::random(12)));

        $order = $order->fresh(['items', 'vendorOrders']);
        $this->backdate($order, $createdAt);
        $this->maybeFulfillPhysical($order, $createdAt);

        $order->items->pluck('product_id')->unique()->each(function ($productId) {
            Product::where('id', $productId)->increment('view_count', random_int(2, 18));
        });

        return (float) $order->subtotal;
    }

    private function pickVariant(Product $product): ?string
    {
        $digital = $product->is_digital_available && (float) $product->digital_price > 0;
        $physical = $product->is_physical_available && (float) $product->physical_price > 0;
        if ($digital && $physical) {
            return random_int(1, 100) <= 72 ? 'digital' : 'physical';
        }
        if ($digital) {
            return 'digital';
        }
        if ($physical) {
            return 'physical';
        }

        return null;
    }

    private function backdate(Order $order, $createdAt): void
    {
        $paidAt = $createdAt->copy()->addMinutes(random_int(4, 90));
        Order::where('id', $order->id)->update([
            'created_at' => $createdAt,
            'updated_at' => $paidAt,
        ]);
        OrderItem::where('order_id', $order->id)->update([
            'created_at' => $createdAt,
            'updated_at' => $paidAt,
        ]);
        VendorOrder::where('order_id', $order->id)->update([
            'created_at' => $createdAt,
            'updated_at' => $paidAt,
        ]);
        Download::whereIn('order_item_id', $order->items->pluck('id'))->update([
            'created_at' => $createdAt,
            'updated_at' => $paidAt,
            'download_count' => random_int(0, 4),
            'last_downloaded_at' => random_int(0, 1) ? $paidAt->copy()->addHours(random_int(1, 48)) : null,
        ]);
    }

    private function maybeFulfillPhysical(Order $order, $createdAt): void
    {
        $physical = $order->items->where('variant_type', 'physical');
        if ($physical->isEmpty()) {
            return;
        }

        $ageDays = $createdAt->diffInDays(now());
        if ($ageDays < 3) {
            return;
        }

        $status = $ageDays > 21 ? 'delivered' : (random_int(0, 1) ? 'shipped' : 'processing');
        foreach ($physical as $item) {
            $item->update(['fulfillment_status' => $status]);
        }

        $vendorStatus = $status === 'delivered' ? 'completed' : 'processing';
        $order->vendorOrders()->update(['status' => $vendorStatus]);
        if ($status === 'delivered') {
            $order->update(['status' => 'completed']);
        }
    }

    private function seedPayoutHistory(Shop $shop): int
    {
        $eligible = $shop->vendorOrders()
            ->whereIn('status', ['paid', 'processing', 'completed'])
            ->whereNull('payout_id')
            ->where('created_at', '<', now()->subDays(18))
            ->orderBy('created_at')
            ->get();

        if ($eligible->count() < 3) {
            return 0;
        }

        $take = (int) max(1, floor($eligible->count() * 0.28));
        $batch = $eligible->take($take);
        $amount = round((float) $batch->sum('vendor_amount'), 2);
        if ($amount < 1000) {
            return 0;
        }

        $paidAt = $batch->last()->created_at?->copy()->addDays(random_int(5, 12)) ?? now()->subDays(10);
        $payout = Payout::create([
            'shop_id' => $shop->id,
            'amount' => $amount,
            'status' => 'paid',
            'method' => 'bank_transfer',
            'notes' => 'Paid to ' . ($shop->payout_bank_name ?: 'GTBank') . ' — ' . ($shop->payout_account_name ?: $shop->name),
            'paid_at' => $paidAt,
        ]);
        $payout->created_at = $paidAt->copy()->subDays(2);
        $payout->updated_at = $paidAt;
        $payout->save();

        VendorOrder::whereIn('id', $batch->pluck('id'))->update(['payout_id' => $payout->id]);

        return 1;
    }

    /** @return array<int, User> */
    private function customerPool(): array
    {
        $users = [];
        foreach (self::CUSTOMERS as $row) {
            [$name, $prefix] = $row;
            $slug = Str::slug($name);
            $email = "{$slug}." . substr(md5($name), 0, 6) . '@customers.invalid';
            $phone = $prefix . str_pad((string) (crc32($name) % 10000000), 7, '0', STR_PAD_LEFT);

            $users[] = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make(Str::random(32)),
                    'role' => 'customer',
                    'phone' => $phone,
                    'referral_code' => $this->marketplace->uniqueReferralCode(),
                    'marketing_opt_in' => false,
                ]
            );
        }

        return $users;
    }
}
