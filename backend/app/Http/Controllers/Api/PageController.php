<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Setting;
use App\Support\LayoutCatalog;
use App\Support\ThemePalette;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->where('is_published', true)->firstOrFail();
        return response()->json($page);
    }

    public function settings(): JsonResponse
    {
        $tokens = [];
        $raw = Setting::get('theme_tokens');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $tokens = $decoded;
            }
        } else {
            $tokens = [
                'primary' => Setting::get('theme_primary', 'forest'),
                'accent' => Setting::get('theme_secondary', 'sand'),
                'highlight' => Setting::get('theme_accent', 'camel'),
            ];
        }
        $theme = ThemePalette::resolve($tokens);
        $layoutId = LayoutCatalog::normalize(Setting::get('layout_id', LayoutCatalog::DEFAULT));
        $layout = LayoutCatalog::get($layoutId);
        $images = LayoutCatalog::normalizeImages(
            Setting::get('layout_bg_images'),
            Setting::get('layout_bg_image'),
            max(1, (int) $layout['max_backgrounds'])
        );
        $usingDemo = false;
        if ($layout['needs_background'] && count($images) === 0) {
            $images = $layout['demo_images'] ?? LayoutCatalog::demoImagesFor($layoutId);
            $usingDemo = count($images) > 0;
        }

        return response()->json([
            'site_name' => Setting::get('site_name', 'The Tailors Market'),
            'site_description' => Setting::get('site_description'),
            'site_logo' => Setting::get('site_logo'),
            'currency' => Setting::get('currency', 'NGN'),
            'contact_email' => Setting::get('contact_email', 'info@thetailorsmarket.com'),
            'social_tiktok' => Setting::get('social_tiktok'),
            'social_youtube' => Setting::get('social_youtube'),
            'platform_commission_percent' => Setting::get('platform_commission_percent', '10'),
            'referral_percent' => Setting::get('referral_percent', '10'),
            'hero_badge' => Setting::get('hero_badge', 'Marketplace for tailors'),
            'hero_title' => Setting::get('hero_title', 'Everything a tailor needs, in one market'),
            'hero_subtitle' => Setting::get('hero_subtitle', 'Shop fabrics, tools, threads, machines, and digital patterns from trusted vendors. Download files instantly or get physical supplies delivered.'),
            'hero_card_label' => Setting::get('hero_card_label', 'Curated supplies'),
            'theme' => $theme['vars'],
            'theme_tokens' => $theme['tokens'],
            'layout_id' => $layoutId,
            'layout' => $layout,
            'layout_bg_image' => $images[0] ?? null,
            'layout_bg_images' => $images,
            'layout_bg_using_demo' => $usingDemo,
            'layout_bg_overlay' => (int) Setting::get('layout_bg_overlay', (string) $layout['overlay_default']),
        ]);
    }
}
