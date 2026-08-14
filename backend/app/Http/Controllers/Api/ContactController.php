<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:80',
            'email' => 'required|email',
            'subject' => 'nullable|string|max:120',
            'message' => 'required|string|min:10|max:5000',
        ]);

        ContactMessage::create($data);

        try {
            app(\App\Services\NotificationService::class)->notifyAdmins(
                'contact',
                'New contact form message',
                ($data['name'] ?? 'Someone') . ': ' . ($data['subject'] ?: mb_strimwidth($data['message'], 0, 80, '…')),
                '/admin/messages',
                false,
            );
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Message sent successfully']);
    }
}
