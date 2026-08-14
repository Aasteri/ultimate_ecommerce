<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingZone extends Model
{
    protected $fillable = [
        'name', 'regions', 'rate', 'currency', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'regions' => 'array',
        'rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}
