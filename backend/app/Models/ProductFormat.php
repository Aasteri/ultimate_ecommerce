<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductFormat extends Model
{
    protected $fillable = ['product_id', 'format'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
