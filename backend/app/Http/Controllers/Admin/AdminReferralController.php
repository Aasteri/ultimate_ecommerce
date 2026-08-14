<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WalletPayout;
use App\Models\WalletTransaction;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReferralController extends Controller
{
    public function __construct(private NotificationService $notifications) {}
    public function index(): JsonResponse
    {
        $referrals = User::whereNotNull('referred_by_id')
            ->with(['referredBy:id,name,email,referral_code'])
            ->orderByDesc('created_at')
            ->paginate(30);

        return response()->json([
            'total_referrals' => User::whereNotNull('referred_by_id')->count(),
            'converted' => User::whereNotNull('referral_first_order_id')->count(),
            'credits_paid' => (float) WalletTransaction::where('type', 'referral_credit')->sum('amount'),
            'pending_wallet_payouts' => WalletPayout::where('status', 'pending')->count(),
            'referrals' => $referrals,
        ]);
    }

    public function walletPayouts(Request $request): JsonResponse
    {
        $query = WalletPayout::with('user:id,name,email,wallet_balance')->orderByDesc('created_at');
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(20));
    }

    public function updateWalletPayout(Request $request, WalletPayout $walletPayout): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:pending,paid,rejected',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($walletPayout, $data) {
            $payout = WalletPayout::where('id', $walletPayout->id)->lockForUpdate()->first();
            $payout->notes = $data['notes'] ?? $payout->notes;

            if ($data['status'] === 'paid' && $payout->status !== 'paid') {
                $payout->status = 'paid';
                $payout->paid_at = now();
                WalletTransaction::create([
                    'user_id' => $payout->user_id,
                    'type' => 'payout_paid',
                    'amount' => 0,
                    'description' => 'Referral payout marked paid',
                ]);
            }

            if ($data['status'] === 'rejected' && $payout->status === 'pending') {
                $payout->status = 'rejected';
                $payout->paid_at = null;
                User::where('id', $payout->user_id)->increment('wallet_balance', (float) $payout->amount);
                WalletTransaction::create([
                    'user_id' => $payout->user_id,
                    'type' => 'payout_refund',
                    'amount' => $payout->amount,
                    'description' => 'Referral payout rejected — balance restored',
                ]);
            }

            $payout->save();
        });

        $fresh = $walletPayout->fresh('user');
        if ($fresh?->user && $data['status'] === 'paid') {
            $amount = number_format((float) $fresh->amount, 2);
            $this->notifications->notify(
                $fresh->user,
                'payout_paid',
                'Your referral payout has been paid',
                "Admin marked your ₦{$amount} referral withdrawal as paid.",
                '/account',
                true,
            );
        }

        return response()->json($fresh);
    }
}
