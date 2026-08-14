<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\LayoutCatalog;
use App\Support\ThemePalette;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminThemeController extends Controller
{
    public function show(): JsonResponse
    {
        $tokens = $this->storedTokens();
        $resolved = ThemePalette::resolve($tokens);
        $layoutId = LayoutCatalog::normalize(Setting::get('layout_id', LayoutCatalog::DEFAULT));
        $layout = LayoutCatalog::get($layoutId);
        $images = $this->storedImages($layout['max_backgrounds']);
        $demoImages = $layout['demo_images'] ?? [];

        return response()->json([
            'roles' => ThemePalette::roles(),
            'templates' => ThemePalette::templates(),
            'swatches' => ThemePalette::swatches(),
            'tokens' => $resolved['tokens'],
            'options' => $resolved['options'],
            'vars' => $resolved['vars'],
            'layouts' => LayoutCatalog::all(),
            'layout_groups' => LayoutCatalog::grouped(),
            'layout' => $layout,
            'branding' => [
                'site_logo' => Setting::get('site_logo'),
                'hero_badge' => Setting::get('hero_badge', 'Marketplace for tailors'),
                'hero_title' => Setting::get('hero_title', 'Everything a tailor needs, in one market'),
                'hero_subtitle' => Setting::get('hero_subtitle', 'Shop fabrics, tools, threads, machines, and digital patterns from trusted vendors. Download files instantly or get physical supplies delivered.'),
                'hero_card_label' => Setting::get('hero_card_label', 'Curated supplies'),
                'layout_id' => $layoutId,
                'layout_bg_image' => $images[0] ?? null,
                'layout_bg_images' => $images,
                'layout_bg_demo_images' => $demoImages,
                'layout_bg_overlay' => (int) Setting::get('layout_bg_overlay', (string) $layout['overlay_default']),
            ],
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $tokens = $request->input('tokens', []);
        if (! is_array($tokens)) {
            $tokens = [];
        }

        $resolved = ThemePalette::resolve($tokens);

        return response()->json([
            'tokens' => $resolved['tokens'],
            'options' => $resolved['options'],
            'vars' => $resolved['vars'],
            'preview' => $resolved,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $roleKeys = array_keys(ThemePalette::roles());
        $rules = [
            'template' => 'nullable|string|max:40',
            'tokens' => 'nullable|array',
            'hero_badge' => 'nullable|string|max:80',
            'hero_title' => 'nullable|string|max:120',
            'hero_subtitle' => 'nullable|string|max:500',
            'hero_card_label' => 'nullable|string|max:80',
            'layout_id' => 'nullable|string|max:40',
            'layout_bg_image' => 'nullable|string|max:2048',
            'layout_bg_images' => 'nullable|array|max:12',
            'layout_bg_images.*' => 'nullable|string|max:2048',
            'layout_bg_overlay' => 'nullable|integer|min:0|max:90',
        ];
        foreach ($roleKeys as $role) {
            $rules["tokens.$role"] = 'nullable|string|max:40';
        }

        $data = $request->validate($rules);
        $tokens = is_array($data['tokens'] ?? null) ? $data['tokens'] : [];

        if (! empty($data['template']) && isset(ThemePalette::templates()[$data['template']])) {
            $tokens = ThemePalette::templates()[$data['template']]['tokens'];
        }

        $resolved = ThemePalette::resolve($tokens);
        Setting::set('theme_tokens', json_encode($resolved['tokens']));
        Setting::set('theme_vars', json_encode($resolved['vars']));
        Setting::set('theme_primary', $resolved['tokens']['primary'] ?? 'forest');
        Setting::set('theme_secondary', $resolved['tokens']['accent'] ?? 'sand');
        Setting::set('theme_accent', $resolved['tokens']['highlight'] ?? 'camel');

        foreach (['hero_badge', 'hero_title', 'hero_subtitle', 'hero_card_label'] as $key) {
            if (array_key_exists($key, $data)) {
                Setting::set($key, trim((string) ($data[$key] ?? '')) ?: null);
            }
        }

        if (array_key_exists('layout_id', $data)) {
            $layoutId = LayoutCatalog::normalize($data['layout_id'] ?? null);
            Setting::set('layout_id', $layoutId);
        } else {
            $layoutId = LayoutCatalog::normalize(Setting::get('layout_id', LayoutCatalog::DEFAULT));
        }

        $layout = LayoutCatalog::get($layoutId);
        $max = max(1, (int) $layout['max_backgrounds']);

        if (array_key_exists('layout_bg_images', $data) || array_key_exists('layout_bg_image', $data)) {
            $images = [];
            if (array_key_exists('layout_bg_images', $data) && is_array($data['layout_bg_images'])) {
                foreach ($data['layout_bg_images'] as $item) {
                    $item = trim((string) $item);
                    if ($item !== '') {
                        $images[] = $item;
                    }
                }
            }
            if (array_key_exists('layout_bg_image', $data)) {
                $single = trim((string) ($data['layout_bg_image'] ?? ''));
                if ($single !== '' && ! in_array($single, $images, true)) {
                    array_unshift($images, $single);
                }
            }
            $images = array_values(array_unique($images));
            $images = array_slice($images, 0, $max > 0 ? $max : 12);
            $this->persistImages($images);
        }

        if (array_key_exists('layout_bg_overlay', $data)) {
            Setting::set('layout_bg_overlay', (string) (int) $data['layout_bg_overlay']);
        } elseif (array_key_exists('layout_id', $data)) {
            Setting::set('layout_bg_overlay', (string) $layout['overlay_default']);
        }

        $images = $this->storedImages($layout['max_backgrounds']);

        return response()->json([
            'message' => 'Theme & layout saved.',
            'tokens' => $resolved['tokens'],
            'vars' => $resolved['vars'],
            'options' => $resolved['options'],
            'layout' => $layout,
            'branding' => [
                'layout_id' => $layoutId,
                'layout_bg_image' => $images[0] ?? null,
                'layout_bg_images' => $images,
                'layout_bg_overlay' => (int) Setting::get('layout_bg_overlay', '0'),
            ],
        ]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['logo' => 'required|image|max:4096']);
        $path = $request->file('logo')->store('branding', 'public');
        $old = Setting::get('site_logo');
        Setting::set('site_logo', $path);
        if ($old && $old !== $path && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }

        return response()->json([
            'message' => 'Logo updated.',
            'site_logo' => $path,
        ]);
    }

    public function uploadBackground(Request $request): JsonResponse
    {
        $request->validate([
            'background' => 'required|image|max:8192',
            'append' => 'nullable|boolean',
        ]);

        $path = $request->file('background')->store('branding/backgrounds', 'public');
        $layoutId = LayoutCatalog::normalize(Setting::get('layout_id', LayoutCatalog::DEFAULT));
        $layout = LayoutCatalog::get($layoutId);
        $max = max(1, (int) $layout['max_backgrounds']);
        $append = filter_var($request->input('append', true), FILTER_VALIDATE_BOOLEAN);

        $images = $append ? $this->storedImages($max) : [];
        $images[] = $path;
        $images = array_values(array_unique($images));
        $images = array_slice($images, 0, $max);
        $this->persistImages($images);

        return response()->json([
            'message' => 'Background image added.',
            'layout_bg_image' => $images[0] ?? null,
            'layout_bg_images' => $images,
        ]);
    }

    /** @return list<string> */
    private function storedImages(int $max = 12): array
    {
        return LayoutCatalog::normalizeImages(
            Setting::get('layout_bg_images'),
            Setting::get('layout_bg_image'),
            max(1, $max)
        );
    }

    /** @param  list<string>  $images */
    private function persistImages(array $images): void
    {
        Setting::set('layout_bg_images', json_encode(array_values($images)));
        Setting::set('layout_bg_image', $images[0] ?? null);
    }

    /** @return array<string, string> */
    private function storedTokens(): array
    {
        $raw = Setting::get('theme_tokens');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        $primary = Setting::get('theme_primary', 'forest');
        $secondary = Setting::get('theme_secondary', 'sand');
        $accent = Setting::get('theme_accent', 'camel');
        $base = ThemePalette::defaultTokens();
        $base['primary'] = $primary ?: $base['primary'];
        $base['accent'] = $secondary ?: $base['accent'];
        $base['highlight'] = $accent ?: $base['highlight'];

        return $base;
    }
}
