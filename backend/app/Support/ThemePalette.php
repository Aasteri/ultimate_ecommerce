<?php

namespace App\Support;

class ThemePalette
{
    /**
     * Role order matters for cascading: background first, then readable content, then brand.
     *
     * @return array<string, array{label: string, group: string, hint: string, kind: string}>
     */
    public static function roles(): array
    {
        return [
            'bg' => ['label' => 'Page background', 'group' => 'Surfaces', 'hint' => 'Light paper or deep dark canvas (green, navy, black…)', 'kind' => 'canvas'],
            'bg_card' => ['label' => 'Cards & boxes', 'group' => 'Surfaces', 'hint' => 'Elevated panels that sit on the page background', 'kind' => 'elevated'],
            'bg_muted' => ['label' => 'Muted panels', 'group' => 'Surfaces', 'hint' => 'Soft section / secondary panels', 'kind' => 'panel'],
            'header_bg' => ['label' => 'Header background', 'group' => 'Surfaces', 'hint' => 'Top navigation bar', 'kind' => 'elevated'],
            'overlay' => ['label' => 'Overlay / backdrop', 'group' => 'Surfaces', 'hint' => 'Menu and modal dimmers', 'kind' => 'overlay'],
            'text' => ['label' => 'Body text', 'group' => 'Content', 'hint' => 'Main readable text (auto light/dark for canvas)', 'kind' => 'readable'],
            'text_muted' => ['label' => 'Muted text', 'group' => 'Content', 'hint' => 'Help text and captions', 'kind' => 'muted'],
            'border' => ['label' => 'Borders', 'group' => 'Content', 'hint' => 'Input and card outlines', 'kind' => 'line'],
            'focus' => ['label' => 'Focus ring', 'group' => 'Content', 'hint' => 'Keyboard / input focus glow', 'kind' => 'panel'],
            'primary' => ['label' => 'Primary', 'group' => 'Brand', 'hint' => 'Buttons, links, active states', 'kind' => 'brand'],
            'primary_hover' => ['label' => 'Primary hover', 'group' => 'Brand', 'hint' => 'Button / link hover', 'kind' => 'brand_dark'],
            'on_primary' => ['label' => 'Text on primary', 'group' => 'Brand', 'hint' => 'Text/icons on primary buttons', 'kind' => 'on_brand'],
            'accent' => ['label' => 'Accent', 'group' => 'Brand', 'hint' => 'Secondary brand accent', 'kind' => 'accent'],
            'accent_soft' => ['label' => 'Soft accent', 'group' => 'Brand', 'hint' => 'Chips and tinted badges', 'kind' => 'panel'],
            'highlight' => ['label' => 'Highlight', 'group' => 'Brand', 'hint' => 'Third accent / decorative marks', 'kind' => 'accent'],
            'success' => ['label' => 'Success', 'group' => 'Feedback', 'hint' => 'Success alerts', 'kind' => 'feedback_ok'],
            'danger' => ['label' => 'Danger', 'group' => 'Feedback', 'hint' => 'Error alerts', 'kind' => 'feedback_bad'],
        ];
    }

    /**
     * @return array<string, array{hex: string, label: string, family: string, luminance: float, tone: string}>
     */
    public static function swatches(): array
    {
        return [
            // Deep brand / canvas colors
            'forest' => ['hex' => '#2d5a4a', 'label' => 'Forest green', 'family' => 'green', 'luminance' => 0.22, 'tone' => 'deep'],
            'leaf' => ['hex' => '#1b4332', 'label' => 'Leaf green', 'family' => 'green', 'luminance' => 0.14, 'tone' => 'deep'],
            'pine' => ['hex' => '#081c15', 'label' => 'Pine black-green', 'family' => 'green', 'luminance' => 0.06, 'tone' => 'deep'],
            'emerald' => ['hex' => '#1f7a5c', 'label' => 'Emerald', 'family' => 'green', 'luminance' => 0.28, 'tone' => 'deep'],
            'olive' => ['hex' => '#5a6b3a', 'label' => 'Olive', 'family' => 'green', 'luminance' => 0.30, 'tone' => 'deep'],
            'teal' => ['hex' => '#0f766e', 'label' => 'Teal', 'family' => 'green', 'luminance' => 0.30, 'tone' => 'deep'],
            'navy' => ['hex' => '#1e3a5f', 'label' => 'Navy', 'family' => 'blue', 'luminance' => 0.14, 'tone' => 'deep'],
            'midnight' => ['hex' => '#0b1c2c', 'label' => 'Midnight blue', 'family' => 'blue', 'luminance' => 0.07, 'tone' => 'deep'],
            'ocean' => ['hex' => '#2f5d8c', 'label' => 'Ocean blue', 'family' => 'blue', 'luminance' => 0.24, 'tone' => 'deep'],
            'sky' => ['hex' => '#3d7ea6', 'label' => 'Sky blue', 'family' => 'blue', 'luminance' => 0.34, 'tone' => 'mid'],
            'crimson' => ['hex' => '#9b2c2c', 'label' => 'Crimson', 'family' => 'red', 'luminance' => 0.20, 'tone' => 'deep'],
            'brick' => ['hex' => '#a3442f', 'label' => 'Brick red', 'family' => 'red', 'luminance' => 0.26, 'tone' => 'deep'],
            'burgundy' => ['hex' => '#6b2d3c', 'label' => 'Burgundy', 'family' => 'red', 'luminance' => 0.16, 'tone' => 'deep'],
            'plum' => ['hex' => '#5c3d6e', 'label' => 'Plum', 'family' => 'purple', 'luminance' => 0.18, 'tone' => 'deep'],
            'violet' => ['hex' => '#5a4a8a', 'label' => 'Violet', 'family' => 'purple', 'luminance' => 0.22, 'tone' => 'deep'],
            'copper' => ['hex' => '#8a5a32', 'label' => 'Copper', 'family' => 'warm', 'luminance' => 0.28, 'tone' => 'deep'],
            'camel' => ['hex' => '#a67c52', 'label' => 'Camel', 'family' => 'warm', 'luminance' => 0.40, 'tone' => 'mid'],
            'sand' => ['hex' => '#c4a77d', 'label' => 'Sand gold', 'family' => 'warm', 'luminance' => 0.55, 'tone' => 'light'],
            'charcoal' => ['hex' => '#2f3438', 'label' => 'Charcoal', 'family' => 'neutral', 'luminance' => 0.12, 'tone' => 'deep'],
            'slate' => ['hex' => '#4a5560', 'label' => 'Slate', 'family' => 'neutral', 'luminance' => 0.24, 'tone' => 'deep'],
            'ink' => ['hex' => '#1a1a1a', 'label' => 'Ink black', 'family' => 'neutral', 'luminance' => 0.05, 'tone' => 'deep'],
            'graphite' => ['hex' => '#374151', 'label' => 'Graphite', 'family' => 'neutral', 'luminance' => 0.18, 'tone' => 'deep'],
            'abyss' => ['hex' => '#0a0a0a', 'label' => 'Abyss black', 'family' => 'neutral', 'luminance' => 0.03, 'tone' => 'deep'],
            // Dark elevated panels (cards on dark canvases) — slightly lighter than deep canvases
            'panel' => ['hex' => '#2d3b33', 'label' => 'Green panel', 'family' => 'green', 'luminance' => 0.20, 'tone' => 'panel'],
            'panel_blue' => ['hex' => '#243448', 'label' => 'Blue panel', 'family' => 'blue', 'luminance' => 0.18, 'tone' => 'panel'],
            'panel_warm' => ['hex' => '#342820', 'label' => 'Warm panel', 'family' => 'warm', 'luminance' => 0.16, 'tone' => 'panel'],
            'panel_night' => ['hex' => '#22262c', 'label' => 'Night panel', 'family' => 'neutral', 'luminance' => 0.14, 'tone' => 'panel'],
            'panel_raise' => ['hex' => '#343a44', 'label' => 'Raised panel', 'family' => 'neutral', 'luminance' => 0.21, 'tone' => 'panel'],
            'panel_plum' => ['hex' => '#322840', 'label' => 'Plum panel', 'family' => 'purple', 'luminance' => 0.16, 'tone' => 'panel'],
            // Light surfaces
            'mist' => ['hex' => '#f3f1ee', 'label' => 'Mist', 'family' => 'neutral', 'luminance' => 0.92, 'tone' => 'pale'],
            'paper' => ['hex' => '#faf9f7', 'label' => 'Paper', 'family' => 'neutral', 'luminance' => 0.96, 'tone' => 'pale'],
            'ivory' => ['hex' => '#fffaf3', 'label' => 'Ivory', 'family' => 'warm', 'luminance' => 0.97, 'tone' => 'pale'],
            'cream' => ['hex' => '#f5efe6', 'label' => 'Cream', 'family' => 'warm', 'luminance' => 0.92, 'tone' => 'pale'],
            'cloud' => ['hex' => '#eef2f5', 'label' => 'Cloud', 'family' => 'blue', 'luminance' => 0.93, 'tone' => 'pale'],
            'sage_mist' => ['hex' => '#e8f4f0', 'label' => 'Sage mist', 'family' => 'green', 'luminance' => 0.92, 'tone' => 'pale'],
            'blush' => ['hex' => '#fdecec', 'label' => 'Blush', 'family' => 'red', 'luminance' => 0.90, 'tone' => 'pale'],
            'lilac' => ['hex' => '#f3eef8', 'label' => 'Lilac mist', 'family' => 'purple', 'luminance' => 0.92, 'tone' => 'pale'],
            'petal' => ['hex' => '#fdf5f7', 'label' => 'Petal pink', 'family' => 'red', 'luminance' => 0.95, 'tone' => 'pale'],
            'blossom' => ['hex' => '#c45d7a', 'label' => 'Blossom rose', 'family' => 'red', 'luminance' => 0.38, 'tone' => 'mid'],
            'frost' => ['hex' => '#eef5f9', 'label' => 'Frost', 'family' => 'blue', 'luminance' => 0.94, 'tone' => 'pale'],
            'ice' => ['hex' => '#7aa3b8', 'label' => 'Ice blue', 'family' => 'blue', 'luminance' => 0.52, 'tone' => 'mid'],
            'harvest' => ['hex' => '#c46a2d', 'label' => 'Harvest amber', 'family' => 'warm', 'luminance' => 0.40, 'tone' => 'mid'],
            'marigold' => ['hex' => '#d4a017', 'label' => 'Marigold', 'family' => 'warm', 'luminance' => 0.55, 'tone' => 'light'],
            'pumpkin' => ['hex' => '#c45c26', 'label' => 'Pumpkin', 'family' => 'warm', 'luminance' => 0.36, 'tone' => 'mid'],
            'white' => ['hex' => '#ffffff', 'label' => 'White', 'family' => 'neutral', 'luminance' => 1.0, 'tone' => 'pale'],
            'snow' => ['hex' => '#f8fafc', 'label' => 'Snow', 'family' => 'neutral', 'luminance' => 0.97, 'tone' => 'pale'],
            'bone' => ['hex' => '#e8e4dc', 'label' => 'Bone', 'family' => 'warm', 'luminance' => 0.88, 'tone' => 'light'],
            // Lines / muted
            'stone' => ['hex' => '#e8e6e3', 'label' => 'Stone', 'family' => 'neutral', 'luminance' => 0.88, 'tone' => 'line'],
            'ash' => ['hex' => '#d4d0ca', 'label' => 'Ash', 'family' => 'neutral', 'luminance' => 0.78, 'tone' => 'line'],
            'edge' => ['hex' => '#3d4a43', 'label' => 'Dark edge', 'family' => 'green', 'luminance' => 0.26, 'tone' => 'line'],
            'edge_blue' => ['hex' => '#334155', 'label' => 'Blue edge', 'family' => 'blue', 'luminance' => 0.24, 'tone' => 'line'],
            'edge_night' => ['hex' => '#3f4650', 'label' => 'Night edge', 'family' => 'neutral', 'luminance' => 0.26, 'tone' => 'line'],
            'smoke' => ['hex' => '#6b7280', 'label' => 'Smoke grey', 'family' => 'neutral', 'luminance' => 0.42, 'tone' => 'muted'],
            'pewter' => ['hex' => '#5c534a', 'label' => 'Pewter', 'family' => 'warm', 'luminance' => 0.30, 'tone' => 'muted'],
            'fog' => ['hex' => '#9ca3af', 'label' => 'Fog', 'family' => 'neutral', 'luminance' => 0.62, 'tone' => 'muted'],
            'mist_text' => ['hex' => '#cbd5e1', 'label' => 'Mist text', 'family' => 'blue', 'luminance' => 0.80, 'tone' => 'muted'],
            // Overlay
            'veil' => ['hex' => '#111827', 'label' => 'Night veil', 'family' => 'neutral', 'luminance' => 0.08, 'tone' => 'overlay'],
            'dusk' => ['hex' => '#1f2937', 'label' => 'Dusk', 'family' => 'neutral', 'luminance' => 0.12, 'tone' => 'overlay'],
            // Feedback
            'success_deep' => ['hex' => '#164532', 'label' => 'Success deep', 'family' => 'green', 'luminance' => 0.16, 'tone' => 'deep'],
            'success_bright' => ['hex' => '#4ade80', 'label' => 'Success bright', 'family' => 'green', 'luminance' => 0.72, 'tone' => 'light'],
            'success_soft' => ['hex' => '#eaf7f0', 'label' => 'Success soft', 'family' => 'green', 'luminance' => 0.93, 'tone' => 'pale'],
            'danger_deep' => ['hex' => '#8a1515', 'label' => 'Danger deep', 'family' => 'red', 'luminance' => 0.16, 'tone' => 'deep'],
            'danger_bright' => ['hex' => '#f87171', 'label' => 'Danger bright', 'family' => 'red', 'luminance' => 0.62, 'tone' => 'light'],
            'danger_soft' => ['hex' => '#fdecec', 'label' => 'Danger soft', 'family' => 'red', 'luminance' => 0.90, 'tone' => 'pale'],
        ];
    }

    /**
     * @return array<string, array{label: string, tokens: array<string, string>}>
     */
    public static function templates(): array
    {
        $light = [
            'tailor_green' => [
                'label' => 'Light · Tailor green',
                'tokens' => [
                    'bg' => 'paper', 'bg_card' => 'white', 'bg_muted' => 'mist', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'sage_mist',
                    'primary' => 'forest', 'primary_hover' => 'teal', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'cream', 'highlight' => 'camel',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'deep_navy' => [
                'label' => 'Light · Deep navy',
                'tokens' => [
                    'bg' => 'paper', 'bg_card' => 'white', 'bg_muted' => 'cloud', 'header_bg' => 'white', 'overlay' => 'dusk',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'cloud',
                    'primary' => 'navy', 'primary_hover' => 'ocean', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'cloud', 'highlight' => 'sky',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'warm_atelier' => [
                'label' => 'Light · Warm atelier',
                'tokens' => [
                    'bg' => 'ivory', 'bg_card' => 'white', 'bg_muted' => 'cream', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'pewter', 'border' => 'ash', 'focus' => 'cream',
                    'primary' => 'copper', 'primary_hover' => 'brick', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'ivory', 'highlight' => 'camel',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'crimson_shop' => [
                'label' => 'Light · Crimson shop',
                'tokens' => [
                    'bg' => 'paper', 'bg_card' => 'white', 'bg_muted' => 'blush', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'blush',
                    'primary' => 'crimson', 'primary_hover' => 'burgundy', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'blush', 'highlight' => 'camel',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'emerald_market' => [
                'label' => 'Light · Emerald market',
                'tokens' => [
                    'bg' => 'paper', 'bg_card' => 'white', 'bg_muted' => 'sage_mist', 'header_bg' => 'white', 'overlay' => 'dusk',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'sage_mist',
                    'primary' => 'emerald', 'primary_hover' => 'forest', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'sage_mist', 'highlight' => 'olive',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'plum_studio' => [
                'label' => 'Light · Plum studio',
                'tokens' => [
                    'bg' => 'paper', 'bg_card' => 'white', 'bg_muted' => 'lilac', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'lilac',
                    'primary' => 'plum', 'primary_hover' => 'violet', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'lilac', 'highlight' => 'violet',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'charcoal_craft' => [
                'label' => 'Light · Charcoal craft',
                'tokens' => [
                    'bg' => 'mist', 'bg_card' => 'white', 'bg_muted' => 'cloud', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'ash', 'focus' => 'mist',
                    'primary' => 'charcoal', 'primary_hover' => 'ink', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'mist', 'highlight' => 'slate',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'ocean_tailor' => [
                'label' => 'Light · Ocean tailor',
                'tokens' => [
                    'bg' => 'cloud', 'bg_card' => 'white', 'bg_muted' => 'mist', 'header_bg' => 'white', 'overlay' => 'dusk',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'cloud',
                    'primary' => 'ocean', 'primary_hover' => 'navy', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'cloud', 'highlight' => 'sky',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
        ];

        $dark = [
            'dark_forest' => [
                'label' => 'Dark · Deep forest',
                'tokens' => [
                    'bg' => 'leaf', 'bg_card' => 'panel', 'bg_muted' => 'forest', 'header_bg' => 'panel', 'overlay' => 'pine',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge', 'focus' => 'panel_raise',
                    'primary' => 'sand', 'primary_hover' => 'camel', 'on_primary' => 'ink',
                    'accent' => 'emerald', 'accent_soft' => 'panel_raise', 'highlight' => 'success_bright',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_leaf' => [
                'label' => 'Dark · Leaf green',
                'tokens' => [
                    'bg' => 'leaf', 'bg_card' => 'forest', 'bg_muted' => 'pine', 'header_bg' => 'panel', 'overlay' => 'pine',
                    'text' => 'white', 'text_muted' => 'mist_text', 'border' => 'edge', 'focus' => 'panel_raise',
                    'primary' => 'sand', 'primary_hover' => 'camel', 'on_primary' => 'ink',
                    'accent' => 'teal', 'accent_soft' => 'panel_raise', 'highlight' => 'olive',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_pine' => [
                'label' => 'Dark · Pine night',
                'tokens' => [
                    'bg' => 'pine', 'bg_card' => 'panel', 'bg_muted' => 'leaf', 'header_bg' => 'panel_night', 'overlay' => 'abyss',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge', 'focus' => 'panel',
                    'primary' => 'emerald', 'primary_hover' => 'teal', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'panel_raise', 'highlight' => 'camel',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_black' => [
                'label' => 'Dark · Ink black',
                'tokens' => [
                    'bg' => 'abyss', 'bg_card' => 'panel_night', 'bg_muted' => 'charcoal', 'header_bg' => 'panel_night', 'overlay' => 'ink',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge_night', 'focus' => 'panel_raise',
                    'primary' => 'sand', 'primary_hover' => 'camel', 'on_primary' => 'ink',
                    'accent' => 'sky', 'accent_soft' => 'panel_raise', 'highlight' => 'ocean',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_charcoal' => [
                'label' => 'Dark · Charcoal',
                'tokens' => [
                    'bg' => 'charcoal', 'bg_card' => 'panel_raise', 'bg_muted' => 'graphite', 'header_bg' => 'panel_night', 'overlay' => 'abyss',
                    'text' => 'white', 'text_muted' => 'fog', 'border' => 'edge_night', 'focus' => 'slate',
                    'primary' => 'sand', 'primary_hover' => 'camel', 'on_primary' => 'ink',
                    'accent' => 'ocean', 'accent_soft' => 'panel_raise', 'highlight' => 'sky',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_navy' => [
                'label' => 'Dark · Deep navy',
                'tokens' => [
                    'bg' => 'navy', 'bg_card' => 'panel_blue', 'bg_muted' => 'midnight', 'header_bg' => 'panel_blue', 'overlay' => 'midnight',
                    'text' => 'snow', 'text_muted' => 'mist_text', 'border' => 'edge_blue', 'focus' => 'panel_raise',
                    'primary' => 'sand', 'primary_hover' => 'camel', 'on_primary' => 'ink',
                    'accent' => 'sky', 'accent_soft' => 'panel_raise', 'highlight' => 'ocean',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_midnight' => [
                'label' => 'Dark · Midnight blue',
                'tokens' => [
                    'bg' => 'midnight', 'bg_card' => 'panel_blue', 'bg_muted' => 'navy', 'header_bg' => 'panel_night', 'overlay' => 'abyss',
                    'text' => 'white', 'text_muted' => 'fog', 'border' => 'edge_blue', 'focus' => 'panel_raise',
                    'primary' => 'sky', 'primary_hover' => 'ocean', 'on_primary' => 'ink',
                    'accent' => 'sand', 'accent_soft' => 'panel_raise', 'highlight' => 'camel',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_ocean' => [
                'label' => 'Dark · Ocean depth',
                'tokens' => [
                    'bg' => 'midnight', 'bg_card' => 'panel_blue', 'bg_muted' => 'navy', 'header_bg' => 'panel_blue', 'overlay' => 'abyss',
                    'text' => 'snow', 'text_muted' => 'mist_text', 'border' => 'edge_blue', 'focus' => 'panel_raise',
                    'primary' => 'ocean', 'primary_hover' => 'sky', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'panel_raise', 'highlight' => 'camel',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_plum' => [
                'label' => 'Dark · Plum night',
                'tokens' => [
                    'bg' => 'plum', 'bg_card' => 'panel_raise', 'bg_muted' => 'panel_plum', 'header_bg' => 'panel_plum', 'overlay' => 'abyss',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge_night', 'focus' => 'violet',
                    'primary' => 'sand', 'primary_hover' => 'camel', 'on_primary' => 'ink',
                    'accent' => 'lilac', 'accent_soft' => 'panel_raise', 'highlight' => 'violet',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_burgundy' => [
                'label' => 'Dark · Burgundy lounge',
                'tokens' => [
                    'bg' => 'burgundy', 'bg_card' => 'panel_raise', 'bg_muted' => 'panel_warm', 'header_bg' => 'panel_warm', 'overlay' => 'abyss',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge_night', 'focus' => 'brick',
                    'primary' => 'sand', 'primary_hover' => 'camel', 'on_primary' => 'ink',
                    'accent' => 'copper', 'accent_soft' => 'panel_raise', 'highlight' => 'brick',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_copper' => [
                'label' => 'Dark · Copper night',
                'tokens' => [
                    'bg' => 'ink', 'bg_card' => 'panel_warm', 'bg_muted' => 'charcoal', 'header_bg' => 'panel_night', 'overlay' => 'abyss',
                    'text' => 'ivory', 'text_muted' => 'fog', 'border' => 'edge_night', 'focus' => 'panel_raise',
                    'primary' => 'copper', 'primary_hover' => 'camel', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'panel_raise', 'highlight' => 'brick',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
        ];

        // Pair with Season / Holiday website layouts (Admin → Website layout).
        $season = [
            'season_spring' => [
                'label' => 'Season · Spring bloom',
                'tokens' => [
                    'bg' => 'petal', 'bg_card' => 'white', 'bg_muted' => 'sage_mist', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'lilac',
                    'primary' => 'emerald', 'primary_hover' => 'forest', 'on_primary' => 'white',
                    'accent' => 'blossom', 'accent_soft' => 'blush', 'highlight' => 'olive',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'season_summer' => [
                'label' => 'Season · Summer market',
                'tokens' => [
                    'bg' => 'ivory', 'bg_card' => 'white', 'bg_muted' => 'cloud', 'header_bg' => 'white', 'overlay' => 'dusk',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'cloud',
                    'primary' => 'ocean', 'primary_hover' => 'navy', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'cream', 'highlight' => 'sky',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'season_autumn' => [
                'label' => 'Season · Autumn harvest',
                'tokens' => [
                    'bg' => 'cream', 'bg_card' => 'ivory', 'bg_muted' => 'bone', 'header_bg' => 'ivory', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'pewter', 'border' => 'ash', 'focus' => 'cream',
                    'primary' => 'copper', 'primary_hover' => 'brick', 'on_primary' => 'white',
                    'accent' => 'harvest', 'accent_soft' => 'cream', 'highlight' => 'camel',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'season_winter' => [
                'label' => 'Season · Winter frost',
                'tokens' => [
                    'bg' => 'frost', 'bg_card' => 'white', 'bg_muted' => 'cloud', 'header_bg' => 'white', 'overlay' => 'dusk',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'frost',
                    'primary' => 'navy', 'primary_hover' => 'midnight', 'on_primary' => 'white',
                    'accent' => 'ice', 'accent_soft' => 'cloud', 'highlight' => 'slate',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'season_monsoon' => [
                'label' => 'Season · Monsoon rain',
                'tokens' => [
                    'bg' => 'cloud', 'bg_card' => 'white', 'bg_muted' => 'mist', 'header_bg' => 'white', 'overlay' => 'dusk',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'cloud',
                    'primary' => 'teal', 'primary_hover' => 'navy', 'on_primary' => 'white',
                    'accent' => 'ocean', 'accent_soft' => 'sage_mist', 'highlight' => 'sky',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'dark_spring' => [
                'label' => 'Season · Spring night',
                'tokens' => [
                    'bg' => 'leaf', 'bg_card' => 'panel', 'bg_muted' => 'forest', 'header_bg' => 'panel', 'overlay' => 'pine',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge', 'focus' => 'panel_raise',
                    'primary' => 'blossom', 'primary_hover' => 'sand', 'on_primary' => 'white',
                    'accent' => 'emerald', 'accent_soft' => 'panel_raise', 'highlight' => 'success_bright',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_summer' => [
                'label' => 'Season · Summer night',
                'tokens' => [
                    'bg' => 'midnight', 'bg_card' => 'panel_blue', 'bg_muted' => 'navy', 'header_bg' => 'panel_blue', 'overlay' => 'abyss',
                    'text' => 'snow', 'text_muted' => 'mist_text', 'border' => 'edge_blue', 'focus' => 'panel_raise',
                    'primary' => 'sand', 'primary_hover' => 'marigold', 'on_primary' => 'ink',
                    'accent' => 'sky', 'accent_soft' => 'panel_raise', 'highlight' => 'ocean',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_autumn' => [
                'label' => 'Season · Autumn night',
                'tokens' => [
                    'bg' => 'ink', 'bg_card' => 'panel_warm', 'bg_muted' => 'charcoal', 'header_bg' => 'panel_night', 'overlay' => 'abyss',
                    'text' => 'ivory', 'text_muted' => 'fog', 'border' => 'edge_night', 'focus' => 'panel_raise',
                    'primary' => 'harvest', 'primary_hover' => 'pumpkin', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'panel_raise', 'highlight' => 'camel',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_winter' => [
                'label' => 'Season · Winter night',
                'tokens' => [
                    'bg' => 'midnight', 'bg_card' => 'panel_blue', 'bg_muted' => 'navy', 'header_bg' => 'panel_night', 'overlay' => 'abyss',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge_blue', 'focus' => 'panel_raise',
                    'primary' => 'ice', 'primary_hover' => 'sky', 'on_primary' => 'ink',
                    'accent' => 'snow', 'accent_soft' => 'panel_raise', 'highlight' => 'mist_text',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'holiday_christmas' => [
                'label' => 'Holiday · Christmas',
                'tokens' => [
                    'bg' => 'cream', 'bg_card' => 'white', 'bg_muted' => 'sage_mist', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'sage_mist',
                    'primary' => 'forest', 'primary_hover' => 'crimson', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'blush', 'highlight' => 'crimson',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'holiday_valentine' => [
                'label' => 'Holiday · Valentine',
                'tokens' => [
                    'bg' => 'petal', 'bg_card' => 'white', 'bg_muted' => 'blush', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'blush',
                    'primary' => 'burgundy', 'primary_hover' => 'blossom', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'blush', 'highlight' => 'crimson',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'holiday_halloween' => [
                'label' => 'Holiday · Halloween',
                'tokens' => [
                    'bg' => 'mist', 'bg_card' => 'white', 'bg_muted' => 'bone', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'pewter', 'border' => 'ash', 'focus' => 'cream',
                    'primary' => 'charcoal', 'primary_hover' => 'pumpkin', 'on_primary' => 'white',
                    'accent' => 'pumpkin', 'accent_soft' => 'cream', 'highlight' => 'harvest',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'holiday_easter' => [
                'label' => 'Holiday · Easter',
                'tokens' => [
                    'bg' => 'lilac', 'bg_card' => 'white', 'bg_muted' => 'sage_mist', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'lilac',
                    'primary' => 'violet', 'primary_hover' => 'plum', 'on_primary' => 'white',
                    'accent' => 'emerald', 'accent_soft' => 'petal', 'highlight' => 'sky',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'holiday_new_year' => [
                'label' => 'Holiday · New Year',
                'tokens' => [
                    'bg' => 'cloud', 'bg_card' => 'white', 'bg_muted' => 'mist', 'header_bg' => 'white', 'overlay' => 'dusk',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'cloud',
                    'primary' => 'navy', 'primary_hover' => 'midnight', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'cream', 'highlight' => 'marigold',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'holiday_thanksgiving' => [
                'label' => 'Holiday · Thanksgiving',
                'tokens' => [
                    'bg' => 'ivory', 'bg_card' => 'white', 'bg_muted' => 'cream', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'pewter', 'border' => 'ash', 'focus' => 'cream',
                    'primary' => 'brick', 'primary_hover' => 'copper', 'on_primary' => 'white',
                    'accent' => 'harvest', 'accent_soft' => 'bone', 'highlight' => 'camel',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'holiday_diwali' => [
                'label' => 'Holiday · Diwali',
                'tokens' => [
                    'bg' => 'ivory', 'bg_card' => 'white', 'bg_muted' => 'lilac', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'lilac',
                    'primary' => 'plum', 'primary_hover' => 'violet', 'on_primary' => 'white',
                    'accent' => 'marigold', 'accent_soft' => 'cream', 'highlight' => 'copper',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'holiday_mothers_day' => [
                'label' => 'Holiday · Mother\'s Day',
                'tokens' => [
                    'bg' => 'petal', 'bg_card' => 'white', 'bg_muted' => 'blush', 'header_bg' => 'white', 'overlay' => 'veil',
                    'text' => 'ink', 'text_muted' => 'smoke', 'border' => 'stone', 'focus' => 'blush',
                    'primary' => 'blossom', 'primary_hover' => 'burgundy', 'on_primary' => 'white',
                    'accent' => 'sand', 'accent_soft' => 'lilac', 'highlight' => 'violet',
                    'success' => 'success_deep', 'danger' => 'danger_deep',
                ],
            ],
            'dark_christmas' => [
                'label' => 'Holiday · Christmas night',
                'tokens' => [
                    'bg' => 'pine', 'bg_card' => 'panel', 'bg_muted' => 'leaf', 'header_bg' => 'panel_night', 'overlay' => 'abyss',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge', 'focus' => 'panel',
                    'primary' => 'sand', 'primary_hover' => 'crimson', 'on_primary' => 'ink',
                    'accent' => 'crimson', 'accent_soft' => 'panel_raise', 'highlight' => 'emerald',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
            'dark_halloween' => [
                'label' => 'Holiday · Halloween night',
                'tokens' => [
                    'bg' => 'abyss', 'bg_card' => 'panel_night', 'bg_muted' => 'charcoal', 'header_bg' => 'panel_night', 'overlay' => 'abyss',
                    'text' => 'snow', 'text_muted' => 'fog', 'border' => 'edge_night', 'focus' => 'pumpkin',
                    'primary' => 'pumpkin', 'primary_hover' => 'harvest', 'on_primary' => 'ink',
                    'accent' => 'sand', 'accent_soft' => 'panel_raise', 'highlight' => 'brick',
                    'success' => 'success_bright', 'danger' => 'danger_bright',
                ],
            ],
        ];

        return $light + $dark + $season;
    }

    public static function defaultTokens(): array
    {
        return self::templates()['tailor_green']['tokens'];
    }

    /**
     * @param  array<string, string>  $chosen
     * @return list<string>
     */
    public static function optionsFor(string $role, array $chosen): array
    {
        $roles = self::roles();
        $swatches = self::swatches();
        if (! isset($roles[$role])) {
            return array_keys($swatches);
        }

        $kind = $roles[$role]['kind'];
        $dark = self::isDarkMode($chosen, $swatches);
        $picked = array_values(array_filter($chosen));
        $keys = [];

        foreach ($swatches as $key => $swatch) {
            if (! self::fitsKind($kind, $swatch, $dark)) {
                continue;
            }
            if (! self::compatibleWithChosen($role, $key, $swatch, $chosen, $swatches, $dark)) {
                continue;
            }
            if (in_array($key, $picked, true) && in_array($kind, ['brand', 'brand_dark', 'accent'], true)) {
                // Only enforce uniqueness across brand/accent roles, not surfaces
                $brandRoles = ['primary', 'primary_hover', 'accent', 'highlight'];
                $usedInBrand = false;
                foreach ($brandRoles as $brandRole) {
                    if (($chosen[$brandRole] ?? null) === $key) {
                        $usedInBrand = true;
                        break;
                    }
                }
                if ($usedInBrand) {
                    continue;
                }
            }
            $keys[] = $key;
        }

        return $keys ?: self::fallbackKeys($kind, $dark);
    }

    /**
     * @param  array<string, string>  $tokens
     * @return array{tokens: array<string, string>, vars: array<string, string>, options: array<string, list<string>>, mode: string}
     */
    public static function resolve(array $tokens = []): array
    {
        $roles = array_keys(self::roles());
        $swatches = self::swatches();
        $defaults = self::defaultTokens();
        $resolved = [];
        $options = [];

        // If a full template-like payload is provided with bg, prefer those defaults for empty slots
        if (! empty($tokens['bg'])) {
            foreach (self::templates() as $tpl) {
                if (($tpl['tokens']['bg'] ?? null) === $tokens['bg']) {
                    $defaults = $tpl['tokens'];
                    break;
                }
            }
        }

        // Trust complete curated payloads (every role is a known swatch) so templates always apply as designed
        $trust = true;
        foreach ($roles as $role) {
            $value = $tokens[$role] ?? null;
            if (! $value || ! isset($swatches[$value])) {
                $trust = false;
                break;
            }
        }

        foreach ($roles as $role) {
            $options[$role] = self::optionsFor($role, $resolved);
            $candidate = $tokens[$role] ?? $defaults[$role] ?? null;
            if ($trust && $candidate && isset($swatches[$candidate])) {
                $resolved[$role] = $candidate;
                continue;
            }
            if (! $candidate || ! in_array($candidate, $options[$role], true)) {
                $candidate = $options[$role][0] ?? ($defaults[$role] ?? 'forest');
            }
            $resolved[$role] = $candidate;
        }

        // Rebuild options against final tokens so the admin UI shows valid next choices
        $options = [];
        $partial = [];
        foreach ($roles as $role) {
            $options[$role] = self::optionsFor($role, $partial);
            if (! in_array($resolved[$role], $options[$role], true)) {
                $options[$role][] = $resolved[$role];
            }
            $partial[$role] = $resolved[$role];
        }

        $mode = self::isDarkMode($resolved, $swatches) ? 'dark' : 'light';

        return [
            'tokens' => $resolved,
            'options' => $options,
            'vars' => self::toCssVars($resolved, $mode),
            'mode' => $mode,
        ];
    }

    /**
     * @param  array<string, string>  $tokens
     * @return array<string, string>
     */
    public static function toCssVars(array $tokens, ?string $mode = null): array
    {
        $hex = fn (string $role) => self::swatches()[$tokens[$role] ?? '']['hex'] ?? '#000000';
        $mode ??= self::isDarkMode($tokens, self::swatches()) ? 'dark' : 'light';

        $primary = $hex('primary');
        $overlay = $hex('overlay');

        return [
            '--theme-mode' => $mode,
            '--primary' => $primary,
            '--primary-hover' => $hex('primary_hover'),
            '--on-primary' => $hex('on_primary'),
            '--accent' => $hex('accent'),
            '--accent-light' => $hex('accent_soft'),
            '--theme-accent-3' => $hex('highlight'),
            '--bg' => $hex('bg'),
            '--bg-card' => $hex('bg_card'),
            '--bg-muted' => $hex('bg_muted'),
            '--header-bg' => $hex('header_bg'),
            '--overlay' => $overlay,
            '--overlay-rgb' => implode(', ', self::hexToRgb($overlay)),
            '--text' => $hex('text'),
            '--text-muted' => $hex('text_muted'),
            '--border' => $hex('border'),
            '--focus-ring' => $hex('focus'),
            '--success' => $hex('success'),
            '--danger' => $hex('danger'),
            '--primary-rgb' => implode(', ', self::hexToRgb($primary)),
        ];
    }

    /**
     * @param  array<string, string>  $chosen
     * @param  array<string, array{luminance: float}>  $swatches
     */
    public static function isDarkMode(array $chosen, array $swatches): bool
    {
        if (! isset($chosen['bg'], $swatches[$chosen['bg']])) {
            return false;
        }

        return $swatches[$chosen['bg']]['luminance'] < 0.42;
    }

    /** @param  array{hex: string, family: string, luminance: float, tone: string}  $swatch */
    private static function fitsKind(string $kind, array $swatch, bool $dark): bool
    {
        return match ($kind) {
            'canvas' => in_array($swatch['tone'], ['pale', 'deep', 'overlay', 'panel'], true)
                || ($swatch['tone'] === 'mid' && $swatch['luminance'] < 0.4),
            'elevated' => $dark
                ? in_array($swatch['tone'], ['panel', 'deep', 'mid'], true)
                : (in_array($swatch['tone'], ['pale', 'light'], true) || $swatch['hex'] === '#ffffff'),
            'panel' => $dark
                ? in_array($swatch['tone'], ['panel', 'deep', 'mid'], true)
                : in_array($swatch['tone'], ['pale', 'light'], true),
            'brand', 'brand_dark' => in_array($swatch['tone'], ['deep', 'mid', 'light'], true),
            'accent' => in_array($swatch['tone'], ['deep', 'mid', 'light', 'pale'], true),
            'on_brand' => $swatch['luminance'] >= 0.85 || $swatch['luminance'] <= 0.2,
            'readable' => $dark ? $swatch['luminance'] >= 0.82 : $swatch['luminance'] <= 0.22,
            'muted' => $swatch['tone'] === 'muted' || ($swatch['luminance'] > 0.28 && $swatch['luminance'] < 0.85),
            'line' => $dark
                ? ($swatch['tone'] === 'line' || ($swatch['luminance'] > 0.18 && $swatch['luminance'] < 0.4))
                : ($swatch['tone'] === 'line' || ($swatch['luminance'] > 0.7 && $swatch['luminance'] < 0.92)),
            'overlay' => $swatch['tone'] === 'overlay' || $swatch['luminance'] <= 0.12,
            'feedback_ok' => $swatch['family'] === 'green' && in_array($swatch['tone'], ['deep', 'pale', 'light'], true),
            'feedback_bad' => $swatch['family'] === 'red' && in_array($swatch['tone'], ['deep', 'pale', 'light'], true),
            default => true,
        };
    }

    /**
     * @param  array{hex: string, family: string, luminance: float, tone: string}  $swatch
     * @param  array<string, string>  $chosen
     * @param  array<string, array{hex: string, family: string, luminance: float, tone: string}>  $swatches
     */
    private static function compatibleWithChosen(string $role, string $key, array $swatch, array $chosen, array $swatches, bool $dark): bool
    {
        if ($role === 'bg_card' && isset($chosen['bg'], $swatches[$chosen['bg']])) {
            $bg = $swatches[$chosen['bg']];
            $delta = $swatch['luminance'] - $bg['luminance'];
            if ($dark) {
                // Cards should lift above the canvas (lighter), even when the lift is subtle
                if ($delta < 0.015 && ! ($swatch['tone'] === 'panel' && $delta >= 0)) {
                    return false;
                }
            } elseif (abs($delta) < 0.025) {
                return false;
            }
        }

        if ($role === 'header_bg' && isset($chosen['bg'], $swatches[$chosen['bg']])) {
            if (abs($swatch['luminance'] - $swatches[$chosen['bg']]['luminance']) < 0.02 && $key === ($chosen['bg'] ?? '')) {
                return false;
            }
        }

        if ($role === 'text' && isset($chosen['bg'], $swatches[$chosen['bg']])) {
            if (abs($swatch['luminance'] - $swatches[$chosen['bg']]['luminance']) < 0.45) {
                return false;
            }
        }

        if ($role === 'text_muted' && isset($chosen['bg'], $swatches[$chosen['bg']], $chosen['text'], $swatches[$chosen['text']])) {
            $bgL = $swatches[$chosen['bg']]['luminance'];
            $textL = $swatches[$chosen['text']]['luminance'];
            $min = min($bgL, $textL);
            $max = max($bgL, $textL);
            if ($swatch['luminance'] <= $min + 0.05 || $swatch['luminance'] >= $max - 0.05) {
                if ($swatch['tone'] !== 'muted') {
                    return false;
                }
            }
        }

        if ($role === 'border' && isset($chosen['bg_card'], $swatches[$chosen['bg_card']])) {
            if (abs($swatch['luminance'] - $swatches[$chosen['bg_card']]['luminance']) < 0.05) {
                return false;
            }
        }

        if ($role === 'primary_hover' && isset($chosen['primary'], $swatches[$chosen['primary']])) {
            $p = $swatches[$chosen['primary']];
            if (abs($swatch['luminance'] - $p['luminance']) < 0.02) {
                return false;
            }
            if ($swatch['family'] !== $p['family'] && $swatch['family'] !== 'neutral' && $p['family'] !== 'neutral' && $swatch['family'] !== 'warm') {
                return false;
            }
        }

        if ($role === 'accent' && isset($chosen['primary'], $swatches[$chosen['primary']], $chosen['bg'], $swatches[$chosen['bg']])) {
            // Must contrast with both canvas and primary
            if (abs($swatch['luminance'] - $swatches[$chosen['primary']]['luminance']) < 0.05) {
                return false;
            }
            if (abs($swatch['luminance'] - $swatches[$chosen['bg']]['luminance']) < 0.08) {
                return false;
            }
        }

        if ($role === 'on_primary' && isset($chosen['primary'], $swatches[$chosen['primary']])) {
            if (abs($swatch['luminance'] - $swatches[$chosen['primary']]['luminance']) < 0.35) {
                return false;
            }
        }

        if (in_array($role, ['accent_soft', 'bg_muted', 'focus'], true) && isset($chosen['bg'], $swatches[$chosen['bg']])) {
            // Soft panels should not vanish into bg (allow close pales like cloud on paper)
            if (abs($swatch['luminance'] - $swatches[$chosen['bg']]['luminance']) < 0.02) {
                return false;
            }
        }

        return true;
    }

    /** @return list<string> */
    private static function fallbackKeys(string $kind, bool $dark): array
    {
        $all = self::swatches();
        $keys = [];
        foreach ($all as $key => $swatch) {
            if (self::fitsKind($kind, $swatch, $dark)) {
                $keys[] = $key;
            }
        }

        return $keys ?: array_keys($all);
    }

    /** @return array{0:int,1:int,2:int} */
    public static function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }

        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2)),
        ];
    }
}
