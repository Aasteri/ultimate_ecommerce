<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminNewsletterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NewsletterSubscriber::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('search')) {
            $query->where('email', 'like', '%'.$request->search.'%');
        }

        return response()->json([
            'subscribers' => $query->paginate($request->integer('per_page', 50)),
            'stats' => [
                'active' => NewsletterSubscriber::where('is_active', true)->count(),
                'inactive' => NewsletterSubscriber::where('is_active', false)->count(),
                'total' => NewsletterSubscriber::count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email|max:190',
        ]);

        $subscriber = NewsletterSubscriber::updateOrCreate(
            ['email' => strtolower(trim($data['email']))],
            [
                'is_active' => true,
                'unsubscribe_token' => Str::random(48),
            ]
        );

        return response()->json($subscriber, 201);
    }

    public function update(Request $request, NewsletterSubscriber $newsletter): JsonResponse
    {
        $data = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $newsletter->update($data);

        return response()->json($newsletter);
    }

    public function destroy(NewsletterSubscriber $newsletter): JsonResponse
    {
        $newsletter->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
