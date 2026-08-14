<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shop extends Model
{
    protected $fillable = [
        'user_id', 'name', 'slug', 'bio', 'logo', 'status', 'rejection_reason',
        'commission_rate', 'payout_bank_name', 'payout_account_name',
        'payout_account_number', 'approved_at',
    ];

    protected $hidden = [
        'payout_bank_name', 'payout_account_name', 'payout_account_number',
        'rejection_reason', 'commission_rate',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function vendorOrders(): HasMany
    {
        return $this->hasMany(VendorOrder::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function effectiveCommissionRate(): float
    {
        if ($this->commission_rate !== null) {
            return (float) $this->commission_rate;
        }
        return (float) (Setting::get('platform_commission_percent', '10') ?? 10);
    }

    public function availableBalance(): float
    {
        $earned = (float) $this->vendorOrders()
            ->whereIn('status', ['paid', 'processing', 'completed'])
            ->whereNull('payout_id')
            ->sum('vendor_amount');

        return round($earned, 2);
    }

    public function lifetimeEarnings(): float
    {
        return round((float) $this->vendorOrders()
            ->whereIn('status', ['paid', 'processing', 'completed'])
            ->sum('vendor_amount'), 2);
    }
}
