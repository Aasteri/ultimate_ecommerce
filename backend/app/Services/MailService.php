<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;

class MailService
{
    public function send(string $to, string $subject, string $body, ?string $replyTo = null): void
    {
        $html = $this->wrap($subject, $body);

        Mail::html($html, function ($message) use ($to, $subject, $replyTo) {
            $message->to($to)->subject($subject);
            if ($replyTo) {
                $message->replyTo($replyTo);
            }
        });
    }

    /**
     * @param  array<int, string>  $emails
     * @param  array<string, string>  $unsubscribeByEmail  email => unsubscribe URL
     */
    public function sendCampaign(array $emails, string $subject, string $body, array $unsubscribeByEmail = []): int
    {
        $emails = array_values(array_unique(array_filter(array_map('strtolower', $emails))));
        $sent = 0;

        $uniqueUnsubs = array_values(array_unique(array_filter($unsubscribeByEmail)));
        $sharedUnsub = $unsubscribeByEmail['_shared']
            ?? (count($uniqueUnsubs) === 1 ? $uniqueUnsubs[0] : null);
        $needsPerRecipient = ! isset($unsubscribeByEmail['_shared']) && count($uniqueUnsubs) > 1;

        foreach (array_chunk($emails, 40) as $chunk) {
            if ($needsPerRecipient) {
                foreach ($chunk as $email) {
                    $html = $this->wrap($subject, $body, $unsubscribeByEmail[$email] ?? $sharedUnsub);
                    Mail::html($html, function ($message) use ($email, $subject) {
                        $message->to($email)->subject($subject);
                    });
                    $sent++;
                }
                continue;
            }

            $html = $this->wrap($subject, $body, $sharedUnsub);
            Mail::html($html, function ($message) use ($chunk, $subject) {
                $message->to(config('mail.from.address'))
                    ->bcc($chunk)
                    ->subject($subject);
            });
            $sent += count($chunk);
        }

        return $sent;
    }

    public function wrap(string $title, string $body, ?string $unsubscribeUrl = null): string
    {
        $safeTitle = e($title);
        $paragraphs = collect(preg_split("/\n{2,}/", trim($body)) ?: [])
            ->filter(fn ($p) => trim($p) !== '')
            ->map(fn ($p) => '<p style="margin:0 0 16px;line-height:1.6;color:#333;">'.nl2br(e($p)).'</p>')
            ->implode('');

        $brand = e(\App\Models\Setting::get('site_name', 'The Tailors Market'));
        $footer = '<p style="margin:32px 0 0;font-size:12px;color:#888;">This email was sent by '.$brand.'.</p>';
        if ($unsubscribeUrl) {
            $safeUnsub = e($unsubscribeUrl);
            $footer .= '<p style="margin:8px 0 0;font-size:12px;color:#888;">'
                .'<a href="'.$safeUnsub.'" style="color:#8a6a3a;">Unsubscribe</a> from these emails.'
                .'</p>';
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:24px auto;background:#fff;padding:32px;border-radius:12px;">
    <p style="margin:0 0 8px;color:#8a6a3a;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">{$brand}</p>
    <h1 style="margin:0 0 20px;font-size:22px;color:#2b2118;">{$safeTitle}</h1>
    {$paragraphs}
    {$footer}
  </div>
</body>
</html>
HTML;
    }
}
