<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\VendorOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->shop->vendorOrders()
            ->with(['order:id,order_number,created_at,payment_status,shipping_address,shipping_discussion_needed'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(20));
    }

    public function show(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->assertOwned($request, $vendorOrder);

        $items = $vendorOrder->order->items()
            ->where('shop_id', $vendorOrder->shop_id)
            ->with('product:id,title,slug,preview_image')
            ->get();

        return response()->json([
            'vendor_order' => $vendorOrder->load('order'),
            'items' => $items,
        ]);
    }

    public function updateFulfillment(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->assertOwned($request, $vendorOrder);

        $data = $request->validate([
            'item_id' => 'required|exists:order_items,id',
            'fulfillment_status' => 'required|in:pending,processing,shipped,delivered',
        ]);

        $item = $vendorOrder->order->items()
            ->where('shop_id', $vendorOrder->shop_id)
            ->findOrFail($data['item_id']);

        $item->update(['fulfillment_status' => $data['fulfillment_status']]);

        $remaining = $vendorOrder->order->items()
            ->where('shop_id', $vendorOrder->shop_id)
            ->where('variant_type', 'physical')
            ->where('fulfillment_status', '!=', 'delivered')
            ->exists();

        if (!$remaining) {
            $vendorOrder->update(['status' => 'completed']);
        }

        $order = $vendorOrder->order;
        $allDone = $order->items()
            ->where('variant_type', 'physical')
            ->where('fulfillment_status', '!=', 'delivered')
            ->doesntExist();
        if ($allDone) {
            $order->update(['status' => 'completed']);
        }

        return $this->show($request, $vendorOrder->fresh());
    }

    private function assertOwned(Request $request, VendorOrder $vendorOrder): void
    {
        abort_unless($vendorOrder->shop_id === $request->user()->shop->id, 404);
    }
}
