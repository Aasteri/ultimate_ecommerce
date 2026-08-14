<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Support\ThemePalette;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'formats', 'shop:id,name,slug,logo', 'images'])
            ->fromApprovedShops()
            ->where('status', 'published');

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        if ($request->filled('format')) {
            $query->whereHas('formats', fn ($q) => $q->where('format', $request->format));
        }

        if ($request->filled('color')) {
            $color = $request->string('color')->toString();
            $query->where(function ($q) use ($color) {
                $q->whereJsonContains('colors', $color)
                    ->orWhere('colors', 'like', '%"'.$color.'"%');
            });
        }

        if ($request->filled('offer')) {
            match ($request->string('offer')->toString()) {
                'digital' => $query->where('is_digital_available', true),
                'physical' => $query->where('is_physical_available', true),
                'both' => $query->where('is_digital_available', true)->where('is_physical_available', true),
                default => null,
            };
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('features', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->boolean('new_arrivals')) {
            $query->where('is_new_arrival', true);
        }

        $sort = $request->get('sort', 'newest');
        match ($sort) {
            'price_low' => $query->orderByRaw('COALESCE(digital_price, physical_price) asc'),
            'price_high' => $query->orderByRaw('COALESCE(digital_price, physical_price) desc'),
            'popular' => $query->orderByDesc('view_count'),
            default => $query->orderByDesc('created_at'),
        };

        return response()->json($query->paginate($request->integer('per_page', 24)));
    }

    public function filters(): JsonResponse
    {
        $rows = Product::query()
            ->fromApprovedShops()
            ->where('status', 'published')
            ->whereNotNull('colors')
            ->pluck('colors');

        $colors = $rows
            ->flatten()
            ->filter(fn ($c) => is_string($c) && trim($c) !== '')
            ->map(fn ($c) => trim($c))
            ->unique(fn ($c) => mb_strtolower($c))
            ->sort()
            ->values();

        return response()->json([
            'colors' => $colors,
            'offers' => [
                ['value' => 'digital', 'label' => 'Digital'],
                ['value' => 'physical', 'label' => 'Physical'],
                ['value' => 'both', 'label' => 'Digital + Physical'],
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::with(['category', 'formats', 'shop:id,name,slug,logo,bio', 'images'])
            ->fromApprovedShops()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $product->increment('view_count');

        return response()->json($product);
    }

    public function home(): JsonResponse
    {
        $tokens = [];
        $raw = Setting::get('theme_tokens');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $tokens = $decoded;
            }
        }
        $theme = ThemePalette::resolve($tokens);

        return response()->json([
            'new_arrivals' => Product::with(['formats', 'shop:id,name,slug,logo', 'images'])
                ->fromApprovedShops()
                ->where('status', 'published')
                ->where('is_new_arrival', true)
                ->orderByDesc('created_at')
                ->limit(8)
                ->get(),
            'popular' => Product::with(['formats', 'shop:id,name,slug,logo', 'images'])
                ->fromApprovedShops()
                ->where('status', 'published')
                ->orderByDesc('view_count')
                ->limit(8)
                ->get(),
            'featured' => Product::with(['formats', 'shop:id,name,slug,logo', 'images'])
                ->fromApprovedShops()
                ->where('status', 'published')
                ->where('is_featured', true)
                ->limit(8)
                ->get(),
            'published_count' => Product::fromApprovedShops()->where('status', 'published')->count(),
            'categories' => Category::withCount(['publishedProducts'])
                ->with(['children' => fn ($q) => $q->withCount('publishedProducts')])
                ->whereNull('parent_id')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(),
            'branding' => [
                'site_name' => Setting::get('site_name', 'The Tailors Market'),
                'site_logo' => Setting::get('site_logo'),
                'hero_badge' => Setting::get('hero_badge', 'Marketplace for tailors'),
                'hero_title' => Setting::get('hero_title', 'Everything a tailor needs, in one market'),
                'hero_subtitle' => Setting::get('hero_subtitle', 'Shop fabrics, tools, threads, machines, and digital patterns from trusted vendors. Download files instantly or get physical supplies delivered.'),
                'hero_card_label' => Setting::get('hero_card_label', 'Curated supplies'),
            ],
            'theme' => $theme['vars'],
        ]);
    }
}
