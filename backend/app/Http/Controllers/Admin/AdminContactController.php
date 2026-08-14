<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminContactController extends Controller
{
    public function __construct(private MailService $mail) {}

    public function index(): JsonResponse
    {
        return response()->json(ContactMessage::orderByDesc('created_at')->paginate(20));
    }

    public function markRead(ContactMessage $message): JsonResponse
    {
        $message->update(['is_read' => true]);
        return response()->json($message);
    }

    public function reply(Request $request, ContactMessage $message): JsonResponse
    {
        $data = $request->validate([
            'body' => 'required|string|max:10000',
        ]);

        $subject = 'Re: ' . ($message->subject ?: 'Your message to The Tailors Market');

        try {
            $this->mail->send(
                $message->email,
                $subject,
                $data['body'],
                config('mail.from.address')
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Could not send email: ' . $e->getMessage()], 422);
        }

        $message->update([
            'is_read' => true,
            'reply_body' => $data['body'],
            'replied_at' => now(),
            'replied_by_id' => $request->user()->id,
        ]);

        return response()->json($message->fresh());
    }
}
