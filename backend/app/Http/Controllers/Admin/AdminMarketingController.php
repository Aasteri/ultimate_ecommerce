<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketingCampaign;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminMarketingController extends Controller
{
    public function __construct(private MailService $mail) {}

    public function users(Request $request): JsonResponse
    {
        $query = User::query()->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('referral_code', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'users' => $query->paginate($request->integer('per_page', 50)),
            'stats' => [
                'total_users' => User::count(),
                'customers' => User::where('role', 'customer')->count(),
                'opted_in' => User::where('marketing_opt_in', true)->count(),
                'newsletter' => NewsletterSubscriber::where('is_active', true)->count(),
                'campaigns' => MarketingCampaign::count(),
            ],
        ]);
    }

    public function campaigns(): JsonResponse
    {
        return response()->json(
            MarketingCampaign::with('user:id,name,email')
                ->orderByDesc('created_at')
                ->paginate(20)
        );
    }

    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => 'required|string|min:3|max:180',
            'body' => 'required|string|min:10|max:20000',
            'audience' => 'required|in:all_users,opted_in,newsletter',
        ]);

        [$emails, $unsubscribeMap] = $this->resolveAudience($data['audience']);

        if (count($emails) === 0) {
            return response()->json(['message' => 'No recipients in this audience.'], 422);
        }

        @set_time_limit(300);

        $campaign = MarketingCampaign::create([
            'user_id' => $request->user()->id,
            'subject' => $data['subject'],
            'body' => $data['body'],
            'audience' => $data['audience'],
            'recipients_count' => 0,
            'status' => 'sending',
            'sent_at' => now(),
        ]);

        try {
            $sent = $this->mail->sendCampaign($emails, $data['subject'], $data['body'], $unsubscribeMap);
            $campaign->update([
                'recipients_count' => $sent,
                'status' => 'sent',
                'sent_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $campaign->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'SMTP failed: '.$e->getMessage()], 422);
        }

        return response()->json([
            'message' => "Sent to {$sent} recipients",
            'sent' => $sent,
            'campaign' => $campaign->fresh('user:id,name,email'),
        ]);
    }

    /**
     * @return array{0: array<int, string>, 1: array<string, string>}
     */
    private function resolveAudience(string $audience): array
    {
        $generic = rtrim((string) config('app.frontend_url', config('app.url')), '/').'/unsubscribe';

        if ($audience === 'newsletter') {
            $emails = NewsletterSubscriber::where('is_active', true)
                ->pluck('email')
                ->map(fn ($e) => strtolower((string) $e))
                ->unique()
                ->values()
                ->all();

            NewsletterSubscriber::where('is_active', true)
                ->whereNull('unsubscribe_token')
                ->get()
                ->each(fn ($row) => $row->update(['unsubscribe_token' => Str::random(48)]));

            return [$emails, ['_shared' => $generic]];
        }

        $query = User::query();
        if ($audience === 'opted_in') {
            $query->where('marketing_opt_in', true);
        }

        $emails = $query->pluck('email')->map(fn ($e) => strtolower((string) $e))->unique()->values()->all();

        return [$emails, ['_shared' => $generic]];
    }
}
