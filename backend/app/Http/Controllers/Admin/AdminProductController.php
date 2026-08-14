<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductFile;
use App\Models\ProductFormat;
use App\Models\ProductImage;
use App\Support\ProductGallery;
use App\Support\ProductOffer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'formats', 'shop:id,name,slug', 'images'])
            ->withCount(['files as digital_files_count' => fn ($q) => $q->where('is_current', true)])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->paginate(20);
        $products->getCollection()->transform(function (Product $product) {
            $product->setAttribute('has_digital_file', $product->digital_files_count > 0);
            return $product;
        });

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $attrs = ProductGallery::normalizeAttributes($data);
        unset($data['colors'], $data['features']);

        $slug = Str::slug($data['title']);
        $baseSlug = $slug;
        $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $data = ProductOffer::normalize($data);
        $formats = $data['formats'] ?? [];
        unset($data['formats']);

        if (empty($data['shop_id'])) {
            $data['shop_id'] = $request->user()->shop?->id;
        }

        $product = Product::create([
            ...$data,
            ...$attrs,
            'slug' => $slug,
            'status' => $data['status'] ?? 'draft',
        ]);

        foreach ($formats as $format) {
            ProductFormat::create(['product_id' => $product->id, 'format' => $format]);
        }

        return response()->json($product->load(['category', 'formats', 'files', 'images']), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load(['category', 'formats', 'files', 'images']));
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $this->validated($request, false);
        $attrs = [];
        if (array_key_exists('colors', $data) || array_key_exists('features', $data)) {
            $attrs = ProductGallery::normalizeAttributes($data);
        }
        unset($data['colors'], $data['features']);

        $data = ProductOffer::normalize($data);
        $formats = $data['formats'] ?? null;
        unset($data['formats']);

        $product->update([...$data, ...$attrs]);

        if (is_array($formats)) {
            $product->formats()->delete();
            foreach ($formats as $format) {
                ProductFormat::create(['product_id' => $product->id, 'format' => $format]);
            }
        }

        return response()->json($product->fresh(['category', 'formats', 'files', 'images']));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function uploadPreview(Request $request, Product $product): JsonResponse
    {
        $request->validate(['image' => 'required|image|max:5120']);
        $image = ProductGallery::upload($product, $request->file('image'));

        return response()->json([
            'preview_image' => $product->fresh()->preview_image,
            'image' => $image,
            'images' => $product->fresh()->images,
        ]);
    }

    public function deleteImage(Product $product, ProductImage $image): JsonResponse
    {
        ProductGallery::delete($product, $image);

        return response()->json([
            'preview_image' => $product->fresh()->preview_image,
            'images' => $product->fresh()->images,
        ]);
    }

    public function setPrimaryImage(Product $product, ProductImage $image): JsonResponse
    {
        ProductGallery::setPrimary($product, $image);

        return response()->json([
            'preview_image' => $product->fresh()->preview_image,
            'images' => $product->fresh()->images,
        ]);
    }

    public function reorderImages(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'order' => 'required|array|min:1',
            'order.*' => 'integer|exists:product_images,id',
        ]);
        ProductGallery::reorder($product, $data['order']);

        return response()->json(['images' => $product->fresh()->images]);
    }

    public function uploadFile(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:102400',
            'formats_included' => 'array',
        ]);

        $path = $request->file('file')->store('products', 'local');

        $product->files()->where('is_current', true)->update(['is_current' => false]);

        $version = ($product->files()->max('version') ?? 0) + 1;

        $file = ProductFile::create([
            'product_id' => $product->id,
            'file_path' => $path,
            'version' => $version,
            'formats_included' => $request->formats_included ?? [],
            'is_current' => true,
        ]);

        return response()->json($file, 201);
    }

    private function validated(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'title' => ($creating ? 'required' : 'sometimes') . '|string|min:2|max:120',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'digital_price' => 'nullable|numeric|min:1|max:99999999.99',
            'physical_price' => 'nullable|numeric|min:1|max:99999999.99',
            'is_digital_available' => 'boolean',
            'is_physical_available' => 'boolean',
            'physical_stock' => 'integer|min:0|max:100000',
            'width_mm' => 'nullable|numeric|min:0|max:500',
            'height_mm' => 'nullable|numeric|min:0|max:500',
            'status' => 'in:draft,published',
            'is_featured' => 'boolean',
            'is_new_arrival' => 'boolean',
            'shop_id' => 'nullable|exists:shops,id',
            'formats' => 'array',
            'formats.*' => 'string',
            'colors' => 'nullable|array|max:20',
            'colors.*' => 'string|max:40',
            'features' => 'nullable|array|max:20',
            'features.*' => 'string|max:80',
        ]);
    }
}
