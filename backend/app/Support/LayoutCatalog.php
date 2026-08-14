<?php

namespace App\Support;

/**
 * Website UI layout templates — independent from color ThemePalette.
 */
class LayoutCatalog
{
    public const DEFAULT = 'classic';

    /** Temporary demo stock photos (Unsplash) so image layouts preview without uploads. */
    public static function demoPool(): array
    {
        return [
            'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1523381213236-4d7a6c4a7a0d?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?auto=format&fit=crop&w=1600&q=80',
        ];
    }

    /**
     * @return list<string>
     */
    public static function demoImagesFor(string $id): array
    {
        $meta = self::all()[$id] ?? null;
        if (! $meta || empty($meta['needs_background'])) {
            return [];
        }
        $pool = self::demoPool();
        $max = max(2, min((int) $meta['max_backgrounds'], count($pool)));
        // Rotate starting offset per layout so galleries feel different
        $offsets = [
            'cinema' => 0, 'runway' => 2, 'boutique' => 4, 'gallery_wall' => 1,
            'split_stage' => 3, 'parallax_loom' => 5,
        ];
        $start = $offsets[$id] ?? 0;
        $out = [];
        for ($i = 0; $i < $max; $i++) {
            $out[] = $pool[($start + $i) % count($pool)];
        }

        return $out;
    }

    /**
     * @return array<string, array{
     *   label: string,
     *   group: string,
     *   description: string,
     *   needs_background: bool,
     *   overlay_default: int,
     *   max_backgrounds: int,
     *   bg_mode: string
     * }>
     */
    public static function all(): array
    {
        $items = [
            // Distinct UI systems
            'classic' => [
                'label' => 'Classic marketplace',
                'group' => 'Core UI',
                'description' => 'The default storefront — balanced hero, standard cards, familiar marketplace rhythm.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'glass' => [
                'label' => 'Glassmorphic',
                'group' => 'Core UI',
                'description' => 'Heavy frosted glass everywhere — floating panels, luminous edges, blurred depth on every surface.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'editorial' => [
                'label' => 'Editorial lookbook',
                'group' => 'Core UI',
                'description' => 'Magazine composition — huge type, single-column hero, borderless lookbook grids, stark footer rule.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'atelier' => [
                'label' => 'Atelier workshop',
                'group' => 'Core UI',
                'description' => 'Craft studio — double-line stamps, offset hard shadows, workbench header, pattern-ruled sections.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'brutalist' => [
                'label' => 'Brutalist market',
                'group' => 'Core UI',
                'description' => 'Raw, blocky, high-contrast UI — thick borders, mono headlines, stark slabs, zero softness.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'neon' => [
                'label' => 'Neon night market',
                'group' => 'Core UI',
                'description' => 'Night bazaar energy — glowing outlines, electric accents, dark panels, neon button halos.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'silk' => [
                'label' => 'Silk luxury',
                'group' => 'Core UI',
                'description' => 'Couture boutique — sweeping curves, soft drapes, oversized radii, elegant spacing.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],

            // Image layouts (multi-image)
            'cinema' => [
                'label' => 'Cinema full-bleed',
                'group' => 'Image layouts',
                'description' => 'Hero Ken Burns slideshow, soft photo wash on Popular & newsletter — not a full-page overlay.',
                'needs_background' => true,
                'overlay_default' => 52,
                'max_backgrounds' => 8,
                'bg_mode' => 'slideshow',
            ],
            'runway' => [
                'label' => 'Runway showcase',
                'group' => 'Image layouts',
                'description' => 'Vertical image strips in the hero, with sectional photo bands later on the homepage.',
                'needs_background' => true,
                'overlay_default' => 48,
                'max_backgrounds' => 8,
                'bg_mode' => 'strips',
            ],
            'boutique' => [
                'label' => 'Boutique gallery',
                'group' => 'Image layouts',
                'description' => 'Soft hero gallery plus photo-backed Popular, CTA, and newsletter sections.',
                'needs_background' => true,
                'overlay_default' => 40,
                'max_backgrounds' => 6,
                'bg_mode' => 'crossfade',
            ],
            'gallery_wall' => [
                'label' => 'Gallery wall',
                'group' => 'Image layouts',
                'description' => 'Hero mosaic plus a dedicated mid-page lookbook wall — images stay in sections.',
                'needs_background' => true,
                'overlay_default' => 48,
                'max_backgrounds' => 12,
                'bg_mode' => 'mosaic',
            ],
            'split_stage' => [
                'label' => 'Split stage',
                'group' => 'Image layouts',
                'description' => 'Editorial split panes in the hero; later sections use different gallery frames.',
                'needs_background' => true,
                'overlay_default' => 42,
                'max_backgrounds' => 4,
                'bg_mode' => 'split',
            ],
            'parallax_loom' => [
                'label' => 'Parallax loom',
                'group' => 'Image layouts',
                'description' => 'Layered fabric depth in the hero, with woven photo washes on key homepage bands.',
                'needs_background' => true,
                'overlay_default' => 44,
                'max_backgrounds' => 5,
                'bg_mode' => 'layers',
            ],

            // Seasons
            'spring' => [
                'label' => 'Spring bloom',
                'group' => 'Seasons',
                'description' => 'Botanical burst — petal cards, garden washes, blooming section dividers.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'summer' => [
                'label' => 'Summer market',
                'group' => 'Seasons',
                'description' => 'Sun-washed open air market — bright bands, pill CTAs, breezy oversized tiles.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'autumn' => [
                'label' => 'Autumn harvest',
                'group' => 'Seasons',
                'description' => 'Harvest market — leaf-cut cards, ribbon headings, warm double frames.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'winter' => [
                'label' => 'Winter frost',
                'group' => 'Seasons',
                'description' => 'Ice crystal storefront — frosted glass, snow-light flares, crystalline borders.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'monsoon' => [
                'label' => 'Monsoon atelier',
                'group' => 'Seasons',
                'description' => 'Rain-washed depth — rippled overlays, cool mist panels, rainy window mood.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],

            // Holidays
            'christmas' => [
                'label' => 'Christmas market',
                'group' => 'Holidays',
                'description' => 'Festive fairground — ornate frames, garland header bar, gift-box cards.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'valentine' => [
                'label' => 'Valentine atelier',
                'group' => 'Holidays',
                'description' => 'Romantic couture — heart-soft curves, blush washes, intimate spacing.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'halloween' => [
                'label' => 'Halloween night',
                'group' => 'Holidays',
                'description' => 'Spooky night market — jagged header, skewed cards, dramatic depth shadows.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'easter' => [
                'label' => 'Easter garden',
                'group' => 'Holidays',
                'description' => 'Garden holiday — oval frames, soft meadow washes, egg-curve buttons.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'new_year' => [
                'label' => 'New Year sparkle',
                'group' => 'Holidays',
                'description' => 'Midnight celebration — luminous halos, sparkle flares, countdown hero energy.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'thanksgiving' => [
                'label' => 'Thanksgiving table',
                'group' => 'Holidays',
                'description' => 'Harvest table — double-rule frames, ribbon titles, warm feast presentation.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'diwali' => [
                'label' => 'Diwali lights',
                'group' => 'Holidays',
                'description' => 'Festival of lights — glowing card rims, rangoli-inspired section marks, luminous CTAs.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'ramadan' => [
                'label' => 'Ramadan evening',
                'group' => 'Holidays',
                'description' => 'Serene evening market — arched frames, crescent motif accents, calm vertical rhythm.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'mothers_day' => [
                'label' => 'Mother\'s Day blooms',
                'group' => 'Holidays',
                'description' => 'Floral celebration — soft bouquet cards, ribbon hero, gentle garden section bands.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
            'black_friday' => [
                'label' => 'Black Friday rush',
                'group' => 'Holidays',
                'description' => 'High-urgency sale UI — bold slabs, stamp badges, aggressive section contrast.',
                'needs_background' => false,
                'overlay_default' => 0,
                'max_backgrounds' => 0,
                'bg_mode' => 'none',
            ],
        ];

        foreach ($items as $id => &$meta) {
            $meta['structure'] = self::structureFor($id);
            $meta['card_style'] = self::cardStyleFor($id);
            $meta['category_style'] = self::categoryStyleFor($id);
        }
        unset($meta);

        return $items;
    }

    /**
     * Page composition / DOM structure (not just CSS skin).
     */
    public static function structureFor(string $id): string
    {
        return match ($id) {
            'editorial' => 'editorial',
            'atelier', 'monsoon' => 'atelier',
            'glass', 'silk', 'boutique', 'valentine', 'mothers_day', 'easter' => 'bento',
            'cinema', 'runway', 'split_stage' => 'runway',
            'gallery_wall', 'parallax_loom' => 'gallery',
            'brutalist', 'neon', 'halloween', 'black_friday' => 'rush',
            'autumn', 'thanksgiving', 'christmas' => 'harvest',
            default => 'marketplace',
        };
    }

    public static function cardStyleFor(string $id): string
    {
        return match (self::structureFor($id)) {
            'editorial' => 'horizontal',
            'atelier' => 'compact',
            'bento' => 'soft',
            'runway' => 'poster',
            'gallery' => 'poster',
            'rush' => 'slab',
            'harvest' => 'framed',
            default => 'standard',
        };
    }

    public static function categoryStyleFor(string $id): string
    {
        return match (self::structureFor($id)) {
            'editorial' => 'chips',
            'atelier' => 'rail',
            'bento' => 'bento',
            'runway' => 'pills',
            'gallery' => 'mosaic',
            'rush' => 'list',
            'harvest' => 'ribbon',
            default => 'grid',
        };
    }

    public static function ids(): array
    {
        return array_keys(self::all());
    }

    public static function isValid(?string $id): bool
    {
        return $id !== null && isset(self::all()[$id]);
    }

    public static function normalize(?string $id): string
    {
        return self::isValid($id) ? (string) $id : self::DEFAULT;
    }

    /**
     * @return array{id: string, label: string, group: string, description: string, needs_background: bool, overlay_default: int, max_backgrounds: int, bg_mode: string, demo_images: list<string>}
     */
    public static function get(string $id): array
    {
        $id = self::normalize($id);
        $meta = self::all()[$id];

        return ['id' => $id] + $meta + ['demo_images' => self::demoImagesFor($id)];
    }

    /**
     * @return array<string, list<array{id: string, label: string, group: string, description: string, needs_background: bool, overlay_default: int, max_backgrounds: int, bg_mode: string, demo_images: list<string>}>>
     */
    public static function grouped(): array
    {
        $groups = [];
        foreach (self::all() as $id => $meta) {
            $groups[$meta['group']][] = ['id' => $id] + $meta + ['demo_images' => self::demoImagesFor($id)];
        }

        return $groups;
    }

    /**
     * Normalize stored background images (JSON array and/or legacy single path).
     *
     * @return list<string>
     */
    public static function normalizeImages(?string $jsonOrPath, ?string $legacySingle = null, int $max = 12): array
    {
        $images = [];

        if ($jsonOrPath) {
            $decoded = json_decode($jsonOrPath, true);
            if (is_array($decoded)) {
                foreach ($decoded as $item) {
                    if (is_string($item) && trim($item) !== '') {
                        $images[] = trim($item);
                    }
                }
            } elseif (is_string($jsonOrPath) && trim($jsonOrPath) !== '' && ! str_starts_with(trim($jsonOrPath), '[')) {
                $images[] = trim($jsonOrPath);
            }
        }

        if ($legacySingle && trim($legacySingle) !== '') {
            array_unshift($images, trim($legacySingle));
        }

        $images = array_values(array_unique($images));

        return array_slice($images, 0, max(0, $max));
    }
}
