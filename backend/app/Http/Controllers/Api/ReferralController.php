<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WalletPayout;
use App\Models\WalletTransaction;
use App\Services\MarketplaceService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReferralController extends Controller
{
    public function __construct(
        private MarketplaceService $marketplace,
        private NotificationService $notifications,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'referral_code' => $user->referral_code,
            'referral_percent' => $this->marketplace->referralPercent(),
            'wallet_balance' => (float) $user->wallet_balance,
            'referrals_count' => $user->referrals()->count(),
            'converted_count' => $user->referrals()->whereNotNull('referral_first_order_id')->count(),
            'lifetime_credits' => (float) $user->walletTransactions()->where('type', 'referral_credit')->sum('amount'),
            'shop_available' => $user->shop ? $user->shop->availableBalance() : 0,
            'shop_lifetime' => $user->shop ? $user->shop->lifetimeEarnings() : 0,
            'transactions' => $user->walletTransactions()->orderByDesc('created_at')->limit(20)->get(),
            'payouts' => WalletPayout::where('user_id', $user->id)->orderByDesc('created_at')->limit(20)->get(),
        ]);
    }

    public function requestPayout(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'amount' => 'nullable|numeric|min:1',
            'method' => 'nullable|string|max:80',
        ]);

        $amount = round((float) ($data['amount'] ?? $user->wallet_balance), 2);
        if ($amount <= 0 || $amount > (float) $user->wallet_balance) {
            return response()->json(['message' => 'Invalid payout amount'], 422);
        }

        $payout = DB::transaction(function () use ($user, $amount, $data) {
            $fresh = User::where('id', $user->id)->lockForUpdate()->first();
            if ($amount > (float) $fresh->wallet_balance) {
                abort(422, 'Insufficient wallet balance');
            }

            $fresh->decrement('wallet_balance', $amount);

            WalletTransaction::create([
                'user_id' => $fresh->id,
                'type' => 'payout_hold',
                'amount' => -$amount,
                'description' => 'Referral payout requested',
            ]);

            return WalletPayout::create([
                'user_id' => $fresh->id,
                'amount' => $amount,
                'status' => 'pending',
                'method' => $data['method'] ?? 'bank_transfer',
            ]);
        });

        $amountFmt = number_format((float) $payout->amount, 2);
        $this->notifications->notifyAdmins(
            'payout_request',
            "Referral withdrawal from {$user->name}",
            "{$user->name} requested a referral payout of ₦{$amountFmt}. Pay them, then mark Payment made in Admin → Payouts.",
            '/admin/payouts',
            true,
        );

        return response()->json($payout, 201);
    }
}
