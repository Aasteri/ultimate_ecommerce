<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items', 'vendorOrders.shop:id,name,slug'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        return response()->json($query->paginate(20));
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['user', 'items.product', 'shippingZone', 'vendorOrders.shop']));
    }

    public function updateFulfillment(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'item_id' => 'required|exists:order_items,id',
            'fulfillment_status' => 'required|in:pending,processing,shipped,delivered',
        ]);

        $item = $order->items()->findOrFail($data['item_id']);
        $item->update(['fulfillment_status' => $data['fulfillment_status']]);

        $allPhysicalDone = $order->items()
            ->where('variant_type', 'physical')
            ->where('fulfillment_status', '!=', 'delivered')
            ->doesntExist();

        if ($allPhysicalDone) {
            $order->update(['status' => 'completed']);
        }

        return response()->json($order->fresh('items'));
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate(['status' => 'required|string']);
        $order->update(['status' => $data['status']]);

        return response()->json($order);
    }
}
