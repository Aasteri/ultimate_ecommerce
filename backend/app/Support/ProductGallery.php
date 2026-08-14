<?php

namespace App\Support;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProductGallery
{
    public const MAX_IMAGES = 8;

    public static function upload(Product $product, UploadedFile $file): ProductImage
    {
        $count = $product->images()->count();
        if ($count >= self::MAX_IMAGES) {
            abort(response()->json(['message' => 'Maximum of '.self::MAX_IMAGES.' images allowed.'], 422));
        }

        $path = $file->store('previews', 'public');
        $isPrimary = $count === 0;

        $image = ProductImage::create([
            'product_id' => $product->id,
            'path' => $path,
            'sort_order' => $count,
            'is_primary' => $isPrimary,
        ]);

        if ($isPrimary) {
            $product->update(['preview_image' => $path]);
        }

        return $image;
    }

    public static function setPrimary(Product $product, ProductImage $image): void
    {
        abort_unless($image->product_id === $product->id, 404);

        $product->images()->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);
        $product->update(['preview_image' => $image->path]);
    }

    public static function delete(Product $product, ProductImage $image): void
    {
        abort_unless($image->product_id === $product->id, 404);

        $wasPrimary = $image->is_primary;
        $path = $image->path;
        $image->delete();

        // Keep file if another product still references it (unlikely) — only delete unused path
        $stillUsed = ProductImage::where('path', $path)->exists()
            || Product::where('preview_image', $path)->where('id', '!=', $product->id)->exists();
        if (! $stillUsed && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $remaining = $product->images()->orderBy('sort_order')->orderBy('id')->get();
        foreach ($remaining as $i => $row) {
            $row->update(['sort_order' => $i]);
        }

        if ($wasPrimary) {
            $next = $remaining->first();
            if ($next) {
                $next->update(['is_primary' => true]);
                $product->update(['preview_image' => $next->path]);
            } else {
                $product->update(['preview_image' => null]);
            }
        }
    }

    public static function reorder(Product $product, array $orderedIds): void
    {
        $images = $product->images()->whereIn('id', $orderedIds)->get()->keyBy('id');
        foreach (array_values($orderedIds) as $i => $id) {
            if (isset($images[$id])) {
                $images[$id]->update(['sort_order' => $i]);
            }
        }
    }

    /** @return array{colors: list<string>, features: list<string>} */
    public static function normalizeAttributes(array $data): array
    {
        $colors = collect($data['colors'] ?? [])
            ->map(fn ($c) => trim((string) $c))
            ->filter()
            ->unique()
            ->take(20)
            ->values()
            ->all();

        $features = collect($data['features'] ?? [])
            ->map(fn ($f) => trim((string) $f))
            ->filter()
            ->unique()
            ->take(20)
            ->values()
            ->all();

        return [
            'colors' => $colors ?: null,
            'features' => $features ?: null,
        ];
    }
}
