<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use App\Models\Order;
use App\Models\Payout;
use App\Models\Product;
use App\Models\Shop;
use App\Models\VendorOrder;
use App\Models\WalletPayout;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $paidQuery = Order::where('payment_status', 'paid');

        return response()->json([
            'total_products' => Product::count(),
            'published_products' => Product::where('status', 'published')->count(),
            'draft_products' => Product::where('status', 'draft')->count(),
            'total_orders' => Order::count(),
            'paid_orders' => (clone $paidQuery)->count(),
            'total_revenue' => (clone $paidQuery)->sum('total'),
            'revenue_this_month' => (clone $paidQuery)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total'),
            'pending_physical_orders' => Order::whereHas(
                'items',
                fn ($q) => $q->where('variant_type', 'physical')->where('fulfillment_status', 'pending')
            )->count(),
            'shipping_discussion_needed' => Order::where('shipping_discussion_needed', true)
                ->where('payment_status', 'paid')
                ->count(),
            'newsletter_subscribers' => NewsletterSubscriber::where('is_active', true)->count(),
            'unread_messages' => ContactMessage::where('is_read', false)->count(),
            'pending_shops' => Shop::where('status', 'pending')->count(),
            'approved_shops' => Shop::where('status', 'approved')->count(),
            'pending_payouts' => Payout::where('status', 'pending')->count(),
            'pending_wallet_payouts' => WalletPayout::where('status', 'pending')->count(),
            'platform_commission' => VendorOrder::whereIn('status', ['paid', 'processing', 'completed'])->sum('commission_amount'),
            'recent_orders' => Order::with(['user:id,name,email', 'items:id,order_id,product_title,variant_type,quantity,fulfillment_status'])
                ->orderByDesc('created_at')
                ->limit(8)
                ->get(['id', 'order_number', 'user_id', 'status', 'payment_status', 'total', 'currency', 'shipping_discussion_needed', 'created_at']),
        ]);
    }
}
