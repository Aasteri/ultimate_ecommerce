<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPayoutController extends Controller
{
    public function __construct(private NotificationService $notifications) {}
    public function index(Request $request): JsonResponse
    {
        $query = Payout::with(['shop.user:id,name,email'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(20));
    }

    public function update(Request $request, Payout $payout): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:pending,processing,paid,rejected',
            'notes' => 'nullable|string|max:1000',
        ]);

        $payout->status = $data['status'];
        $payout->notes = $data['notes'] ?? $payout->notes;

        if ($data['status'] === 'paid') {
            $payout->paid_at = now();
        }

        if ($data['status'] === 'rejected') {
            $payout->vendorOrders()->update(['payout_id' => null]);
            $payout->paid_at = null;
        }

        $payout->save();

        $payout->load('shop.user');
        $vendor = $payout->shop?->user;
        if ($vendor && $data['status'] === 'paid') {
            $amount = number_format((float) $payout->amount, 2);
            $this->notifications->notify(
                $vendor,
                'payout_paid',
                'Your withdrawal has been paid',
                "Admin marked your ₦{$amount} payout as paid. The transfer to your bank account has been made.",
                '/vendor/payouts',
                true,
            );
        }
        if ($vendor && $data['status'] === 'rejected') {
            $this->notifications->notify(
                $vendor,
                'payout_rejected',
                'Withdrawal request was not approved',
                $payout->notes ?: 'Your payout request was rejected. The amount is available again in your vendor balance.',
                '/vendor/payouts',
                true,
            );
        }

        return response()->json($payout->fresh(['shop.user']));
    }
}
