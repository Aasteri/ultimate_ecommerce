<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FlutterwaveService
{
    private function v3BaseUrl(): string
    {
        return rtrim(config('services.flutterwave.base_url', 'https://api.flutterwave.com/v3'), '/');
    }

    private function v4BaseUrl(): string
    {
        return rtrim(config('services.flutterwave.v4_base_url', 'https://f4bexperience.flutterwave.com'), '/');
    }

    private function tokenUrl(): string
    {
        return config(
            'services.flutterwave.v4_token_url',
            'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token'
        );
    }

    public function mode(): string
    {
        $mode = strtolower((string) (Setting::get('flutterwave_mode') ?: config('services.flutterwave.mode', 'test')));

        return $mode === 'live' ? 'live' : 'test';
    }

    public function isTestMode(): bool
    {
        return $this->mode() === 'test';
    }

    public function apiVersion(): string
    {
        return $this->isTestMode() ? 'v3' : 'v4';
    }

    /** Test mode: Flutterwave Inline public key (FLWPUBK_TEST-…). */
    public function publicKey(): string
    {
        $key = Setting::get('flutterwave_public_key') ?: config('services.flutterwave.public_key');

        if (! $key) {
            throw new \RuntimeException('Flutterwave test public key is not configured');
        }

        return $key;
    }

    private function secretKey(): string
    {
        $key = Setting::get('flutterwave_secret_key') ?: config('services.flutterwave.secret_key');

        if (! $key) {
            throw new \RuntimeException('Flutterwave test secret key is not configured');
        }

        return $key;
    }

    /** Live mode: Flutterwave v4 Client ID. */
    public function liveClientId(): string
    {
        $key = Setting::get('flutterwave_live_public_key')
            ?: config('services.flutterwave.live_client_id');

        if (! $key) {
            throw new \RuntimeException('Flutterwave live Client ID is not configured');
        }

        return trim($key);
    }

    private function liveClientSecret(): string
    {
        $key = Setting::get('flutterwave_live_secret_key')
            ?: config('services.flutterwave.live_client_secret');

        if (! $key) {
            throw new \RuntimeException('Flutterwave live Client Secret is not configured');
        }

        return trim($key);
    }

    public function liveEncryptionKey(): ?string
    {
        $key = Setting::get('flutterwave_live_encryption_key')
            ?: config('services.flutterwave.live_encryption_key');

        return $key ? trim($key) : null;
    }

    public function isSandboxDemoKey(): bool
    {
        if (! $this->isTestMode()) {
            return false;
        }

        return str_contains($this->publicKey(), 'SANDBOXDEMOKEY')
            || str_contains($this->secretKey(), 'SANDBOXDEMOKEY');
    }

    public function canSimulatePayments(): bool
    {
        return $this->isTestMode() && $this->isSandboxDemoKey();
    }

    /**
     * Build payment payload for checkout initiate.
     * Test → v3 Inline modal. Live → v4 hosted checkout redirect.
     */
    public function buildPaymentConfig(Order $order, string $email, ?string $phone = null): array
    {
        if ($this->isTestMode()) {
            return $this->buildInlinePaymentConfig($order, $email, $phone);
        }

        return $this->buildV4CheckoutPaymentConfig($order, $email, $phone);
    }

    public function buildInlinePaymentConfig(Order $order, string $email, ?string $phone = null): array
    {
        $order->loadMissing('user');

        return [
            'method' => 'v3_inline',
            'public_key' => $this->publicKey(),
            'tx_ref' => $order->order_number,
            'amount' => (float) $order->total,
            'currency' => $order->currency,
            'redirect_url' => config('app.frontend_url').'/checkout/callback',
            'payment_options' => 'card,ussd,banktransfer,mobilemoneyng,mobilemoneygh',
            'customer' => [
                'email' => $email,
                'name' => $order->user->name,
                'phone_number' => $phone ?? $order->user->phone ?? '08000000000',
            ],
            'customizations' => [
                'title' => \App\Models\Setting::get('site_name', 'The Tailors Market'),
                'description' => 'Order '.$order->order_number,
            ],
            'is_test' => true,
            'use_simulate' => $this->canSimulatePayments(),
        ];
    }

    public function buildV4CheckoutPaymentConfig(Order $order, string $email, ?string $phone = null): array
    {
        $order->loadMissing('user');
        $redirectUrl = rtrim((string) config('app.frontend_url'), '/').'/checkout/callback';

        $customerId = $this->ensureV4Customer(
            $email,
            (string) $order->user->name,
            $phone ?? $order->user->phone
        );

        $session = $this->createV4CheckoutSession($order, $customerId, $redirectUrl);
        $checkoutUrl = $session['checkout_url'] ?? null;

        if (! $checkoutUrl && ! empty($session['id'])) {
            // Flutterwave docs include checkout_url; some live accounts omit it.
            // Prefer an explicit URL from the API when present.
            $template = config('services.flutterwave.v4_checkout_url_template');
            if (is_string($template) && $template !== '') {
                $checkoutUrl = str_replace(
                    ['{id}', '{reference}'],
                    [$session['id'], $order->order_number],
                    $template
                );
            }
        }

        if (! $checkoutUrl) {
            Log::error('Flutterwave v4 checkout session missing checkout_url', ['session' => $session]);
            throw new \RuntimeException(
                'Flutterwave did not return a checkout URL for this live session. '
                .'Confirm Checkout Sessions are enabled on your Flutterwave live account, then try again.'
            );
        }

        return [
            'method' => 'v4_redirect',
            'tx_ref' => $order->order_number,
            'amount' => (float) $order->total,
            'currency' => $order->currency,
            'redirect_url' => $redirectUrl,
            'checkout_url' => $checkoutUrl,
            'session_id' => $session['id'] ?? null,
            'customer' => [
                'email' => $email,
                'name' => $order->user->name,
                'phone_number' => $phone ?? $order->user->phone ?? '08000000000',
            ],
            'is_test' => false,
            'use_simulate' => false,
        ];
    }

    private function ensureV4Customer(string $email, string $name, ?string $phone): string
    {
        $existing = $this->v4Request('post', '/customers/search', [
            'email' => $email,
        ]);

        $found = $existing['data'][0]['id'] ?? null;
        if (is_string($found) && $found !== '') {
            return $found;
        }

        [$first, $last] = $this->splitName($name);
        $payload = [
            'email' => $email,
            'name' => [
                'first' => $first,
                'last' => $last,
            ],
        ];

        $phoneDigits = preg_replace('/\D+/', '', (string) $phone);
        if ($phoneDigits) {
            if (str_starts_with($phoneDigits, '234') && strlen($phoneDigits) > 10) {
                $payload['phone'] = [
                    'country_code' => '234',
                    'number' => substr($phoneDigits, 3),
                ];
            } elseif (str_starts_with($phoneDigits, '0') && strlen($phoneDigits) >= 10) {
                $payload['phone'] = [
                    'country_code' => '234',
                    'number' => substr($phoneDigits, 1),
                ];
            } else {
                $payload['phone'] = [
                    'country_code' => '234',
                    'number' => $phoneDigits,
                ];
            }
        }

        $created = $this->v4Request('post', '/customers', $payload);
        $id = $created['data']['id'] ?? null;
        if (! is_string($id) || $id === '') {
            Log::error('Flutterwave v4 customer create failed', ['response' => $created]);
            throw new \RuntimeException('Unable to create Flutterwave customer for checkout');
        }

        return $id;
    }

    private function createV4CheckoutSession(Order $order, string $customerId, string $redirectUrl): array
    {
        $payload = [
            'amount' => (float) $order->total,
            'currency' => $order->currency ?: 'NGN',
            'customer_id' => $customerId,
            'redirect_url' => $redirectUrl,
            'reference' => $order->order_number,
            'max_retry_attempts' => 3,
            'session_duration' => 60,
        ];

        $response = $this->v4Request('post', '/checkout/sessions', $payload);
        $data = $response['data'] ?? null;

        if (($response['status'] ?? '') !== 'success' || ! is_array($data)) {
            Log::error('Flutterwave v4 checkout session failed', ['response' => $response]);
            $message = $response['error']['message'] ?? $response['message'] ?? 'Unable to start Flutterwave checkout';
            throw new \RuntimeException($message);
        }

        // Normalize possible URL field names across Flutterwave responses.
        if (empty($data['checkout_url'])) {
            foreach (['url', 'link', 'payment_link', 'hosted_link', 'checkout_link'] as $key) {
                if (! empty($data[$key]) && is_string($data[$key])) {
                    $data['checkout_url'] = $data[$key];
                    break;
                }
            }
        }

        // Some accounts return the session first and attach checkout_url shortly after.
        if (empty($data['checkout_url']) && ! empty($data['id'])) {
            for ($i = 0; $i < 3; $i++) {
                usleep(400000);
                $fetched = $this->v4Request('get', '/checkout/sessions/'.$data['id']);
                $again = $fetched['data'] ?? null;
                if (! is_array($again)) {
                    continue;
                }
                foreach (['checkout_url', 'url', 'link', 'payment_link', 'hosted_link', 'checkout_link'] as $key) {
                    if (! empty($again[$key]) && is_string($again[$key])) {
                        $data['checkout_url'] = $again[$key];
                        break 2;
                    }
                }
            }
        }

        return $data;
    }

    /**
     * @return array{status: string, reference: string, id: string|null, amount: float|null, currency: string|null, raw: array}
     */
    public function verifyPayment(string $locator): array
    {
        if ($this->isTestMode()) {
            $data = $this->verifyV3Transaction($locator);

            return [
                'status' => ($data['status'] ?? '') === 'successful' ? 'successful' : (string) ($data['status'] ?? 'failed'),
                'reference' => (string) ($data['tx_ref'] ?? ''),
                'id' => isset($data['id']) ? (string) $data['id'] : null,
                'amount' => isset($data['amount']) ? (float) $data['amount'] : null,
                'currency' => $data['currency'] ?? null,
                'raw' => $data,
            ];
        }

        return $this->verifyV4Payment($locator);
    }

    private function verifyV3Transaction(string $transactionId): array
    {
        $response = Http::withToken($this->secretKey())
            ->get("{$this->v3BaseUrl()}/transactions/{$transactionId}/verify");

        if (! $response->successful() || $response->json('status') !== 'success') {
            Log::error('Flutterwave v3 verify failed', ['response' => $response->json(), 'tx' => $transactionId]);
            throw new \RuntimeException('Payment verification failed');
        }

        return $response->json('data');
    }

    /**
     * Verify live (v4) payment by charge id (chg_…) or merchant reference (order number).
     */
    private function verifyV4Payment(string $locator): array
    {
        $locator = trim($locator);
        $charge = null;

        if (str_starts_with($locator, 'chg_') || str_starts_with($locator, 'che_')) {
            if (str_starts_with($locator, 'che_')) {
                $session = $this->v4Request('get', '/checkout/sessions/'.$locator);
                $reference = $session['data']['reference'] ?? null;
                if (is_string($reference) && $reference !== '') {
                    $charge = $this->findV4ChargeByReference($reference);
                }
            } else {
                $response = $this->v4Request('get', '/charges/'.$locator);
                $charge = $response['data'] ?? null;
            }
        } else {
            $charge = $this->findV4ChargeByReference($locator);
        }

        if (! is_array($charge)) {
            throw new \RuntimeException('Payment verification failed');
        }

        $status = strtolower((string) ($charge['status'] ?? ''));
        $ok = in_array($status, ['succeeded', 'successful', 'completed'], true);

        return [
            'status' => $ok ? 'successful' : $status,
            'reference' => (string) ($charge['reference'] ?? ''),
            'id' => isset($charge['id']) ? (string) $charge['id'] : null,
            'amount' => isset($charge['amount']) ? (float) $charge['amount'] : null,
            'currency' => $charge['currency'] ?? null,
            'raw' => $charge,
        ];
    }

    private function findV4ChargeByReference(string $reference): ?array
    {
        $response = $this->v4Request('get', '/charges', ['reference' => $reference]);
        $rows = $response['data'] ?? [];
        if (! is_array($rows) || $rows === []) {
            return null;
        }

        // Prefer a succeeded charge if multiple exist.
        foreach ($rows as $row) {
            $status = strtolower((string) ($row['status'] ?? ''));
            if (in_array($status, ['succeeded', 'successful', 'completed'], true)) {
                return $row;
            }
        }

        return $rows[0];
    }

    private function accessToken(): string
    {
        $clientId = $this->liveClientId();
        $cacheKey = 'flutterwave_v4_token_'.hash('sha256', $clientId);

        $cached = Cache::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $response = Http::asForm()
            ->timeout(30)
            ->post($this->tokenUrl(), [
                'client_id' => $clientId,
                'client_secret' => $this->liveClientSecret(),
                'grant_type' => 'client_credentials',
            ]);

        if (! $response->successful() || ! $response->json('access_token')) {
            Log::error('Flutterwave OAuth token failed', ['response' => $response->json()]);
            throw new \RuntimeException('Unable to authenticate with Flutterwave (check live Client ID / Secret)');
        }

        $token = (string) $response->json('access_token');
        $expiresIn = (int) ($response->json('expires_in') ?? 600);
        // Refresh a minute early; tokens last ~10 minutes.
        Cache::put($cacheKey, $token, max(60, $expiresIn - 60));

        return $token;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function v4Request(string $method, string $path, array $payload = []): array
    {
        $url = $this->v4BaseUrl().'/'.ltrim($path, '/');
        $traceId = (string) Str::uuid();
        $idempotencyKey = 'idem-'.Str::lower(Str::random(24));

        $request = Http::withToken($this->accessToken())
            ->timeout(45)
            ->acceptJson()
            ->withHeaders([
                'X-Trace-Id' => $traceId,
                'X-Idempotency-Key' => $idempotencyKey,
            ]);

        $response = match (strtolower($method)) {
            'get' => $request->get($url, $payload),
            'put' => $request->put($url, $payload),
            default => $request->post($url, $payload),
        };

        $json = $response->json();
        if (! is_array($json)) {
            Log::error('Flutterwave v4 non-JSON response', [
                'path' => $path,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Unexpected response from Flutterwave');
        }

        if ($response->status() === 401) {
            Cache::forget('flutterwave_v4_token_'.hash('sha256', $this->liveClientId()));
        }

        if ($response->failed() && ($json['status'] ?? '') !== 'success') {
            Log::warning('Flutterwave v4 request failed', [
                'path' => $path,
                'status' => $response->status(),
                'response' => $json,
            ]);
        }

        return $json;
    }

    /** @return array{0: string, 1: string} */
    private function splitName(string $name): array
    {
        $name = trim(preg_replace('/\s+/', ' ', $name) ?? '');
        if ($name === '') {
            return ['Customer', 'Guest'];
        }

        $parts = explode(' ', $name, 2);
        $first = $parts[0];
        $last = $parts[1] ?? $parts[0];

        $sanitize = function (string $value): string {
            $value = preg_replace("/[^a-zA-Z\\s,.'\\-]/", '', $value) ?? '';
            $value = trim($value);
            if (strlen($value) < 2) {
                $value = 'Customer';
            }

            return substr($value, 0, 50);
        };

        return [$sanitize($first), $sanitize($last)];
    }
}
