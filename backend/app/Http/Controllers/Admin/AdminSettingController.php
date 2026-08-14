<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key')->all();

        if (! isset($settings['flutterwave_mode'])) {
            $settings['flutterwave_mode'] = config('services.flutterwave.mode', 'test');
        }

        foreach ([
            'flutterwave_public_key' => config('services.flutterwave.public_key'),
            'flutterwave_secret_key' => config('services.flutterwave.secret_key'),
            'flutterwave_encryption_key' => config('services.flutterwave.encryption_key'),
        ] as $key => $fallback) {
            if (empty($settings[$key]) && $fallback) {
                $settings[$key] = $fallback;
            }
        }

        foreach ([
            'flutterwave_live_public_key',
            'flutterwave_live_secret_key',
            'flutterwave_live_encryption_key',
        ] as $key) {
            if (! array_key_exists($key, $settings)) {
                $settings[$key] = '';
            }
        }

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.site_name' => 'nullable|string|min:2|max:120',
            'settings.contact_email' => 'nullable|email',
            'settings.currency' => 'nullable|string|size:3|regex:/^[A-Z]{3}$/',
            'settings.platform_commission_percent' => 'nullable|numeric|min:0|max:100',
            'settings.referral_percent' => 'nullable|numeric|min:0|max:100',
            'settings.flutterwave_mode' => 'nullable|in:test,live',
            'settings.flutterwave_live_public_key' => 'nullable|string|max:500',
            'settings.flutterwave_live_secret_key' => 'nullable|string|max:500',
            'settings.flutterwave_live_encryption_key' => 'nullable|string|max:500',
            'settings.flutterwave_public_key' => 'nullable|string|max:500',
            'settings.flutterwave_secret_key' => 'nullable|string|max:500',
            'settings.flutterwave_encryption_key' => 'nullable|string|max:500',
        ]);

        $settings = $data['settings'];

        // Always persist live/test keys first (even when staying on test),
        // so switching to live never fails because the fields were locked.
        foreach ([
            'flutterwave_live_public_key',
            'flutterwave_live_secret_key',
            'flutterwave_live_encryption_key',
            'flutterwave_public_key',
            'flutterwave_secret_key',
            'flutterwave_encryption_key',
        ] as $key) {
            if (array_key_exists($key, $settings)) {
                Setting::set($key, trim((string) $settings[$key]));
            }
        }

        $mode = ($settings['flutterwave_mode'] ?? Setting::get('flutterwave_mode', 'test')) === 'live'
            ? 'live'
            : 'test';

        $livePublic = trim((string) (Setting::get('flutterwave_live_public_key') ?: ''));
        $liveSecret = trim((string) (Setting::get('flutterwave_live_secret_key') ?: ''));

        if ($mode === 'live') {
            if ($livePublic === '' || $liveSecret === '') {
                return response()->json([
                    'message' => 'Save your live Client ID and Client Secret first, then switch to live mode.',
                ], 422);
            }
            if (str_contains(strtoupper($livePublic), '_TEST') || str_contains(strtoupper($liveSecret), '_TEST')) {
                return response()->json([
                    'message' => 'Live mode requires live credentials (not keys that contain _TEST).',
                ], 422);
            }
            // Live uses Flutterwave v4 (Client ID / Client Secret). Reject leftover v3 FLWPUBK/FLWSECK live keys.
            if (str_starts_with(strtoupper($livePublic), 'FLWPUBK') || str_starts_with(strtoupper($liveSecret), 'FLWSECK')) {
                return response()->json([
                    'message' => 'Live mode uses Flutterwave v4. Paste Client ID and Client Secret (not FLWPUBK / FLWSECK).',
                ], 422);
            }
        }

        foreach ($settings as $key => $value) {
            if (in_array($key, [
                'flutterwave_live_public_key',
                'flutterwave_live_secret_key',
                'flutterwave_live_encryption_key',
                'flutterwave_public_key',
                'flutterwave_secret_key',
                'flutterwave_encryption_key',
            ], true)) {
                continue;
            }
            Setting::set((string) $key, is_null($value) ? null : (string) $value);
        }

        Setting::set('flutterwave_mode', $mode);

        return response()->json([
            'message' => $mode === 'live' ? 'Live mode saved.' : 'Settings saved.',
            'settings' => Setting::all()->pluck('value', 'key'),
        ]);
    }
}
