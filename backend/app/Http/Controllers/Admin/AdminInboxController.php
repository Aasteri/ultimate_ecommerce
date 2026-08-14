<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InternalMessage;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminInboxController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $messages = InternalMessage::with(['sender:id,name,email', 'recipient:id,name,email'])
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)
                    ->orWhere('recipient_id', $userId)
                    ->orWhereNull('recipient_id');
            })
            ->orderByDesc('created_at')
            ->paginate(40);

        $admins = User::where('role', 'admin')->where('id', '!=', $userId)->get(['id', 'name', 'email']);

        return response()->json([
            'messages' => $messages,
            'admins' => $admins,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'body' => 'required|string|min:2|max:5000',
            'recipient_id' => 'nullable|exists:users,id',
        ]);

        $recipient = null;
        if (!empty($data['recipient_id'])) {
            $recipient = User::where('role', 'admin')->findOrFail($data['recipient_id']);
        }

        $message = InternalMessage::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $recipient?->id,
            'body' => $data['body'],
        ]);

        $title = 'Admin message from ' . $request->user()->name;
        if ($recipient) {
            $this->notifications->notify($recipient, 'admin_message', $title, $data['body'], '/admin/inbox', true);
        } else {
            User::where('role', 'admin')->where('id', '!=', $request->user()->id)->get()
                ->each(fn (User $admin) => $this->notifications->notify($admin, 'admin_message', $title, $data['body'], '/admin/inbox', true));
        }

        return response()->json($message->load(['sender:id,name,email', 'recipient:id,name,email']), 201);
    }

    public function markRead(Request $request, InternalMessage $internalMessage): JsonResponse
    {
        $userId = $request->user()->id;
        if ($internalMessage->recipient_id === $userId || $internalMessage->recipient_id === null) {
            $internalMessage->update(['read_at' => now()]);
        }

        return response()->json($internalMessage);
    }
}
