<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function __construct(private MailService $mail) {}

    public function notify(User $user, string $type, string $title, string $body, ?string $link = null, bool $email = false): Notification
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ]);

        if ($email && $user->email) {
            try {
                $this->mail->send($user->email, $title, $body);
            } catch (\Throwable) {
                // In-app notice still stands if SMTP fails.
            }
        }

        return $notification;
    }

    public function notifyAdmins(string $type, string $title, string $body, ?string $link = null, bool $email = true): void
    {
        User::where('role', 'admin')->get()->each(function (User $admin) use ($type, $title, $body, $link, $email) {
            $this->notify($admin, $type, $title, $body, $link, $email);
        });
    }
}
