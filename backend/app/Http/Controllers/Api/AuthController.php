<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use App\Services\MarketplaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private MarketplaceService $marketplace) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:80',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|max:100',
            'referral_code' => 'nullable|string|max:16',
            'marketing_opt_in' => 'boolean',
        ]);

        $referredById = null;
        if (!empty($data['referral_code'])) {
            $referrer = User::where('referral_code', strtoupper(trim($data['referral_code'])))->first();
            if ($referrer && strcasecmp($referrer->email, $data['email']) !== 0) {
                $referredById = $referrer->id;
            }
        }

        $optIn = array_key_exists('marketing_opt_in', $data) ? (bool) $data['marketing_opt_in'] : true;

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'customer',
            'referral_code' => $this->marketplace->uniqueReferralCode(),
            'referred_by_id' => $referredById,
            'marketing_opt_in' => $optIn,
        ]);

        if ($optIn) {
            NewsletterSubscriber::updateOrCreate(
                ['email' => strtolower($user->email)],
                ['is_active' => true, 'unsubscribe_token' => Str::random(48)]
            );
        }

        $token = $user->createToken('auth')->plainTextToken;
        $this->mergeCart($request, $user);

        return response()->json([
            'user' => $user->toAuthArray(),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->referral_code) {
            $user->update(['referral_code' => $this->marketplace->uniqueReferralCode()]);
        }

        $token = $user->createToken('auth')->plainTextToken;
        $this->mergeCart($request, $user);

        return response()->json([
            'user' => $user->toAuthArray(),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->referral_code) {
            $user->update(['referral_code' => $this->marketplace->uniqueReferralCode()]);
        }

        return response()->json($user->toAuthArray());
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'sometimes|string|min:2|max:80',
            'phone' => 'nullable|string|max:20|regex:/^$|^\+?[\d\s-]{10,20}$/',
            'marketing_opt_in' => 'boolean',
            'current_password' => 'required_with:password|string',
            'password' => 'nullable|string|min:8',
        ]);

        if (!empty($data['password'])) {
            if (!Hash::check($data['current_password'] ?? '', $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Current password is incorrect.'],
                ]);
            }
            $user->password = $data['password'];
        }

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'];
        }
        if (array_key_exists('marketing_opt_in', $data)) {
            $user->marketing_opt_in = $data['marketing_opt_in'];
            if ($data['marketing_opt_in']) {
                NewsletterSubscriber::updateOrCreate(
                    ['email' => strtolower($user->email)],
                    ['is_active' => true, 'unsubscribe_token' => Str::random(48)]
                );
            } else {
                NewsletterSubscriber::where('email', strtolower($user->email))
                    ->update(['is_active' => false]);
            }
        }
        $user->save();

        return response()->json($user->toAuthArray());
    }

    private function mergeCart(Request $request, User $user): void
    {
        app(\App\Services\CartService::class)->mergeSessionCart(
            $user,
            $request->header('X-Session-Id')
        );
    }
}
