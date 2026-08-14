<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\CartService;
use App\Services\FlutterwaveService;
use App\Services\OrderService;
use App\Services\ShippingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(
        private CartService $cartService,
        private OrderService $orderService,
        private FlutterwaveService $flutterwaveService,
        private ShippingService $shippingService,
    ) {}

    public function shippingConfig(): JsonResponse
    {
        $table = $this->shippingService->ratesTable();
        return response()->json([
            'store_location' => $table['store_location'],
            'extra_block_size' => $table['extra_block_size'],
            'extra_block_fee' => $table['extra_block_fee'],
            'lagos_areas' => $this->shippingService->activeLagosAreas(),
            'states' => collect($table['states'])->where('is_active', true)->values()->all(),
        ]);
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'country' => 'required|string',
            'state' => 'required|string',
            'lagos_area' => 'nullable|string',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $cart = $this->cartService->getOrCreateCart(
            $this->cartService->resolveUser($request),
            $request->header('X-Session-Id')
        );
        $cartData = $this->cartService->formatCart($cart);
        $physical = collect($cartData['items'])->where('variant_type', 'physical');

        if ($physical->isNotEmpty()) {
            $shops = [];
            $total = 0.0;
            $needsDiscussion = false;
            $label = '';
            $baseRate = 0.0;
            $extraBlocks = 0;

            foreach ($physical->groupBy('shop_id') as $shopItems) {
                $qty = (int) $shopItems->sum('quantity');
                $quote = $this->shippingService->quote(
                    $data['country'],
                    $data['state'],
                    $qty,
                    $data['lagos_area'] ?? null,
                );
                if (!empty($quote['error'])) {
                    return response()->json($quote, 422);
                }
                $total += (float) $quote['shipping_cost'];
                $needsDiscussion = $needsDiscussion || (bool) $quote['needs_discussion'];
                $label = $quote['label'];
                $baseRate += (float) ($quote['base_rate'] ?? 0);
                $extraBlocks += (int) ($quote['extra_blocks'] ?? 0);
                $shops[] = [
                    'shop_id' => $shopItems->first()['shop_id'] ?? null,
                    'shop_name' => $shopItems->first()['shop']['name'] ?? 'Shop',
                    'quantity' => $qty,
                    'shipping_cost' => $quote['shipping_cost'],
                    'needs_discussion' => $quote['needs_discussion'],
                ];
            }

            return response()->json([
                'shipping_cost' => round($total, 2),
                'base_rate' => round($baseRate, 2),
                'extra_blocks' => $extraBlocks,
                'needs_discussion' => $needsDiscussion,
                'is_nigeria' => (bool) ($quote['is_nigeria'] ?? !$needsDiscussion),
                'label' => $label,
                'shops' => $shops,
            ]);
        }

        $quote = $this->shippingService->quote(
            $data['country'],
            $data['state'],
            (int) ($data['quantity'] ?? 1),
            $data['lagos_area'] ?? null,
        );

        if (!empty($quote['error'])) {
            return response()->json($quote, 422);
        }

        return response()->json($quote);
    }

    public function initiate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'shipping_address' => 'nullable|array',
            'shipping_address.name' => 'required_with:shipping_address|string|max:255',
            'shipping_address.phone' => 'required_with:shipping_address|string|min:10|max:20',
            'shipping_address.street' => 'required_with:shipping_address|string|min:5|max:500',
            'shipping_address.city' => 'required_with:shipping_address|string|max:255',
            'shipping_address.state' => 'required_with:shipping_address|string|max:255',
            'shipping_address.country' => 'required_with:shipping_address|string|max:255',
            'shipping_address.lagos_area' => 'nullable|string|max:64',
            'notes' => 'nullable|string|max:1000',
            'coupon_code' => 'nullable|string|max:32',
        ]);

        $cart = $this->cartService->getOrCreateCart($request->user(), $request->header('X-Session-Id'));
        $cartData = $this->cartService->formatCart($cart);

        if (empty($cartData['items'])) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        $hasPhysical = collect($cartData['items'])->contains(fn ($i) => $i['variant_type'] === 'physical');

        if ($hasPhysical && empty($data['shipping_address'])) {
            return response()->json(['message' => 'Shipping address required for physical items'], 422);
        }

        if ($hasPhysical) {
            $address = $data['shipping_address'];
            if ($this->shippingService->isNigeria($address['country'] ?? '') && $this->shippingService->isLagos($address['state'] ?? '') && empty($address['lagos_area'])) {
                return response()->json(['message' => 'Select a Lagos delivery area'], 422);
            }
        }

        try {
            $order = $this->orderService->createFromCart(
                $request->user(),
                $cartData,
                $data['shipping_address'] ?? null,
                $data['notes'] ?? null,
                $data['coupon_code'] ?? null,
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $phone = $data['shipping_address']['phone'] ?? $request->user()->phone;

        try {
            $payment = $this->flutterwaveService->buildPaymentConfig(
                $order,
                $request->user()->email,
                $phone,
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $cart->items()->delete();

        return response()->json([
            'order' => $order,
            'payment' => $payment,
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'transaction_id' => 'nullable|string|required_without_all:reference,tx_ref',
            'reference' => 'nullable|string|required_without_all:transaction_id,tx_ref',
            'tx_ref' => 'nullable|string|required_without_all:transaction_id,reference',
        ]);

        $locator = $data['transaction_id']
            ?? $data['reference']
            ?? $data['tx_ref']
            ?? null;

        if (! $locator) {
            return response()->json(['message' => 'Payment reference is required'], 422);
        }

        try {
            $txData = $this->flutterwaveService->verifyPayment($locator);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        if ($txData['status'] !== 'successful') {
            return response()->json(['message' => 'Payment not successful'], 422);
        }

        $order = Order::where('order_number', $txData['reference'])->firstOrFail();

        if ($order->payment_status !== 'paid') {
            $this->orderService->markPaid($order, $txData['reference'], $txData['id']);
        }

        return response()->json([
            'order' => $order->fresh('items'),
            'message' => 'Payment verified',
        ]);
    }

    public function webhook(Request $request): JsonResponse
    {
        $secretHash = config('services.flutterwave.secret_hash');
        if ($secretHash) {
            $v3Hash = $request->header('verif-hash');
            $v4Sig = $request->header('flutterwave-signature');
            if ($v3Hash !== $secretHash && $v4Sig !== $secretHash) {
                return response()->json(['message' => 'Invalid hash'], 401);
            }
        }

        $payload = $request->all();

        // v3 webhook shape
        if (($payload['status'] ?? '') === 'successful') {
            $order = Order::where('order_number', $payload['tx_ref'] ?? '')->first();
            if ($order && $order->payment_status !== 'paid') {
                $this->orderService->markPaid(
                    $order,
                    $payload['tx_ref'] ?? '',
                    isset($payload['id']) ? (string) $payload['id'] : ($payload['transaction_id'] ?? null)
                );
            }
        }

        // v4 webhook shape: { type: charge.completed, data: { status, reference, id } }
        $type = $payload['type'] ?? '';
        $data = $payload['data'] ?? [];
        if (is_array($data) && in_array($type, ['charge.completed', 'charge.succeeded', 'checkout.session.completed'], true)) {
            $status = strtolower((string) ($data['status'] ?? ''));
            if (in_array($status, ['succeeded', 'successful', 'completed'], true)) {
                $reference = (string) ($data['reference'] ?? '');
                $order = Order::where('order_number', $reference)->first();
                if ($order && $order->payment_status !== 'paid') {
                    $this->orderService->markPaid(
                        $order,
                        $reference,
                        isset($data['id']) ? (string) $data['id'] : null
                    );
                }
            }
        }

        return response()->json(['message' => 'OK']);
    }

    public function config(): JsonResponse
    {
        $isTest = $this->flutterwaveService->isTestMode();
        $useSimulate = $this->flutterwaveService->canSimulatePayments();
        $apiVersion = $this->flutterwaveService->apiVersion();

        $payload = [
            'mode' => $this->flutterwaveService->mode(),
            'api_version' => $apiVersion,
            'is_test' => $isTest,
            'use_simulate' => $useSimulate,
            'method' => $isTest ? 'v3_inline' : 'v4_redirect',
            'testing' => $isTest ? [
                'docs_url' => 'https://developer.flutterwave.com/docs/testing',
                'api_version' => 'v3_inline',
                'note' => $useSimulate
                    ? 'Public demo keys cannot open the Flutterwave modal. Use Simulate test payment, or add your own FLWPUBK_TEST / FLWSECK_TEST keys in Admin → Settings.'
                    : 'Use your Flutterwave test keys and the test cards below. No real money is charged.',
                'test_cards' => [
                    ['label' => 'Successful payment', 'number' => '4242 4242 4242 4242', 'cvv' => '123', 'expiry' => 'Any future date', 'pin' => '3310', 'otp' => '12345'],
                    ['label' => 'PIN required (Verve)', 'number' => '5060 6666 6666 6666 666', 'cvv' => '123', 'expiry' => '12/28', 'pin' => '3310', 'otp' => '12345'],
                ],
            ] : null,
        ];

        if ($isTest) {
            try {
                $payload['public_key'] = $this->flutterwaveService->publicKey();
            } catch (\RuntimeException) {
                $payload['public_key'] = null;
            }
            $payload['script_url'] = 'https://checkout-v2.dev-flutterwave.com/v3.js';
        }

        return response()->json($payload);
    }

    public function simulate(Request $request): JsonResponse
    {
        if (!$this->flutterwaveService->canSimulatePayments()) {
            return response()->json(['message' => 'Simulation not available'], 403);
        }

        $data = $request->validate(['order_number' => 'required|string']);

        $order = Order::where('order_number', $data['order_number'])
            ->where('user_id', $request->user()->id)
            ->where('payment_status', 'pending')
            ->firstOrFail();

        $txId = 'SIM-' . time();
        $this->orderService->markPaid($order, $order->order_number, $txId);

        return response()->json([
            'order' => $order->fresh('items'),
            'message' => 'Test payment simulated successfully',
        ]);
    }
}
