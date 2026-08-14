<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorPayoutController extends Controller
{
    public function __construct(private NotificationService $notifications) {}
    public function index(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;

        return response()->json([
            'available_balance' => $shop->availableBalance(),
            'lifetime_earnings' => $shop->lifetimeEarnings(),
            'payout_details' => $shop->makeVisible([
                'payout_bank_name', 'payout_account_name', 'payout_account_number',
            ])->only(['payout_bank_name', 'payout_account_name', 'payout_account_number']),
            'payouts' => $shop->payouts()->orderByDesc('created_at')->paginate(20),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;

        if (!$shop->payout_account_number || !$shop->payout_bank_name) {
            return response()->json(['message' => 'Add your payout bank details in shop settings first'], 422);
        }

        $available = $shop->availableBalance();
        if ($available <= 0) {
            return response()->json(['message' => 'No available balance to withdraw'], 422);
        }

        $payout = DB::transaction(function () use ($shop, $available) {
            $orders = $shop->vendorOrders()
                ->whereIn('status', ['paid', 'processing', 'completed'])
                ->whereNull('payout_id')
                ->lockForUpdate()
                ->get();

            $amount = round((float) $orders->sum('vendor_amount'), 2);
            if ($amount <= 0) {
                abort(422, 'No available balance to withdraw');
            }

            $payout = Payout::create([
                'shop_id' => $shop->id,
                'amount' => $amount,
                'status' => 'pending',
                'method' => 'bank_transfer',
            ]);

            $shop->vendorOrders()
                ->whereIn('id', $orders->pluck('id'))
                ->update(['payout_id' => $payout->id]);

            return $payout;
        });

        $shop->load('user');
        $amount = number_format((float) $payout->amount, 2);
        $this->notifications->notifyAdmins(
            'payout_request',
            "Withdrawal request from {$shop->name}",
            "{$shop->user?->name} requested a payout of ₦{$amount}. Pay the vendor, then mark Payment made in Admin → Payouts.",
            '/admin/payouts',
            true,
        );

        return response()->json($payout, 201);
    }
}
