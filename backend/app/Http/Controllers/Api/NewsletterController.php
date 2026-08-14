<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email|max:190']);

        $subscriber = NewsletterSubscriber::updateOrCreate(
            ['email' => strtolower(trim($data['email']))],
            ['is_active' => true]
        );

        if (! $subscriber->unsubscribe_token) {
            $subscriber->update(['unsubscribe_token' => Str::random(48)]);
        }

        return response()->json(['message' => 'Subscribed successfully']);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => 'nullable|string|max:64',
            'email' => 'nullable|email|max:190',
        ]);

        $subscriber = null;
        if (! empty($data['token'])) {
            $subscriber = NewsletterSubscriber::where('unsubscribe_token', $data['token'])->first();
        } elseif (! empty($data['email'])) {
            $subscriber = NewsletterSubscriber::where('email', strtolower(trim($data['email'])))->first();
        }

        if (! $subscriber && ! empty($data['email'])) {
            User::where('email', strtolower(trim($data['email'])))
                ->update(['marketing_opt_in' => false]);

            return response()->json(['message' => 'You have been unsubscribed from marketing emails.']);
        }

        if (! $subscriber) {
            return response()->json(['message' => 'Subscription not found.'], 404);
        }

        $subscriber->update(['is_active' => false]);

        User::where('email', $subscriber->email)->update(['marketing_opt_in' => false]);

        return response()->json(['message' => 'You have been unsubscribed.']);
    }

    public function showByToken(string $token): JsonResponse
    {
        $subscriber = NewsletterSubscriber::where('unsubscribe_token', $token)->first();
        if (! $subscriber) {
            return response()->json(['message' => 'Link is invalid or expired.'], 404);
        }

        return response()->json([
            'email' => $subscriber->email,
            'is_active' => $subscriber->is_active,
        ]);
    }
}
