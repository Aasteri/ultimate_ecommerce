<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class NewsletterSubscriber extends Model
{
    protected $fillable = ['email', 'is_active', 'unsubscribe_token'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $subscriber) {
            if (! $subscriber->unsubscribe_token) {
                $subscriber->unsubscribe_token = Str::random(48);
            }
        });
    }

    public function ensureToken(): string
    {
        if (! $this->unsubscribe_token) {
            $this->update(['unsubscribe_token' => Str::random(48)]);
        }

        return (string) $this->unsubscribe_token;
    }

    public function unsubscribeUrl(): string
    {
        $base = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        return $base.'/unsubscribe?token='.$this->ensureToken();
    }
}
