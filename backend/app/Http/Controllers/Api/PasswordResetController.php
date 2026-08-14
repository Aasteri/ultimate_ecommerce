<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends Controller
{
    public function __construct(private MailService $mail) {}

    public function requestOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();

        // Always return success-shaped response to avoid account enumeration.
        if (! $user) {
            return response()->json([
                'message' => 'If that email is registered, a 6-digit code has been sent. Please also check your spam or junk folder.',
            ]);
        }

        $existing = DB::table('password_reset_tokens')->where('email', $email)->first();
        if ($existing && $existing->created_at && Carbon::parse($existing->created_at)->gt(now()->subMinute())) {
            return response()->json([
                'message' => 'Please wait a minute before requesting another code. Also check your spam or junk folder.',
            ], 429);
        }

        $otp = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($otp),
                'created_at' => now(),
            ]
        );

        $brand = \App\Models\Setting::get('site_name', 'The Tailors Market');
        $body = "Hello {$user->name},\n\n"
            ."Your {$brand} password reset code is:\n\n"
            ."{$otp}\n\n"
            ."This code expires in 15 minutes.\n\n"
            ."If you did not request this, you can ignore this email.\n\n"
            ."Tip: if you do not see the email soon, please check your spam or junk folder.\n\n"
            .$brand;

        try {
            $this->mail->send($email, 'Your password reset code', $body);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Could not send the email right now. Please try again shortly, and check spam if a previous code already arrived.',
            ], 422);
        }

        return response()->json([
            'message' => 'If that email is registered, a 6-digit code has been sent. Please also check your spam or junk folder.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
            'password' => 'required|string|min:8|max:100',
        ]);

        $email = strtolower(trim($data['email']));
        $row = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $row || ! $row->created_at || Carbon::parse($row->created_at)->lt(now()->subMinutes(15))) {
            return response()->json(['message' => 'This code has expired. Please request a new one.'], 422);
        }

        if (! Hash::check($data['otp'], $row->token)) {
            return response()->json(['message' => 'Invalid code. Check the email again (including spam) or request a new code.'], 422);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        $user->password = $data['password'];
        $user->save();
        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json(['message' => 'Password updated. You can sign in with your new password.']);
    }
}
