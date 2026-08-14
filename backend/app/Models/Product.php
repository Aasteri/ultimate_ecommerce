<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'shop_id', 'category_id', 'title', 'slug', 'description', 'preview_image',
        'colors', 'features',
        'digital_price', 'physical_price', 'is_digital_available', 'is_physical_available',
        'physical_stock', 'width_mm', 'height_mm', 'status',
        'view_count', 'is_featured', 'is_new_arrival',
    ];

    protected $casts = [
        'digital_price' => 'decimal:2',
        'physical_price' => 'decimal:2',
        'width_mm' => 'decimal:2',
        'height_mm' => 'decimal:2',
        'is_digital_available' => 'boolean',
        'is_physical_available' => 'boolean',
        'is_featured' => 'boolean',
        'is_new_arrival' => 'boolean',
        'colors' => 'array',
        'features' => 'array',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function scopeFromApprovedShops($query)
    {
        return $query->whereHas('shop', fn ($q) => $q->where('status', 'approved'));
    }

    public function isPurchasable(): bool
    {
        return $this->status === 'published' && $this->shop?->isApproved();
    }

    public function formats(): HasMany
    {
        return $this->hasMany(ProductFormat::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProductFile::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order')->orderBy('id');
    }

    public function currentFile(): ?ProductFile
    {
        return $this->files()->where('is_current', true)->first();
    }

    public function getPriceForVariant(string $variant): ?float
    {
        return $variant === 'digital' ? $this->digital_price : $this->physical_price;
    }
}
