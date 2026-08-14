<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductFormat;
use App\Models\Setting;
use App\Models\ShippingZone;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@thetailorsmarket.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        Setting::set('site_name', 'The Tailors Market');
        Setting::set('site_description', 'Everything tailors need — fabrics, tools, patterns, and supplies from trusted vendors.');
        Setting::set('currency', 'NGN');
        Setting::set('contact_email', 'info@thetailorsmarket.com');
        Setting::set('hero_badge', 'Marketplace for tailors');
        Setting::set('hero_title', 'Everything a tailor needs, in one market');
        Setting::set('hero_subtitle', 'Shop fabrics, tools, threads, machines, and digital patterns from trusted vendors. Download files instantly or get physical supplies delivered.');
        Setting::set('hero_card_label', 'Curated supplies');
        Setting::set('theme_primary', 'forest');
        Setting::set('theme_secondary', 'sand');
        Setting::set('theme_accent', 'camel');
        $theme = \App\Support\ThemePalette::resolve(\App\Support\ThemePalette::defaultTokens());
        Setting::set('theme_tokens', json_encode($theme['tokens']));
        Setting::set('theme_vars', json_encode($theme['vars']));
        Setting::set('layout_id', 'classic');
        Setting::set('layout_bg_overlay', '0');

        $this->call(CategorySeeder::class);
        $this->call(ShippingRateSeeder::class);

        ShippingZone::create([
            'name' => 'Lagos Metro',
            'regions' => ['Lagos'],
            'rate' => 5000,
            'currency' => 'NGN',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        ShippingZone::create([
            'name' => 'Nigeria (Other States)',
            'regions' => ['Nigeria'],
            'rate' => 12000,
            'currency' => 'NGN',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        ShippingZone::create([
            'name' => 'International',
            'regions' => ['International'],
            'rate' => 25000,
            'currency' => 'NGN',
            'is_active' => true,
            'sort_order' => 3,
        ]);

        $samples = [
            ['title' => 'Ankara cotton fabric (6 yards)', 'digital' => null, 'physical' => 8500, 'formats' => [], 'digital_ok' => false, 'physical_ok' => true],
            ['title' => 'Tailor measuring tape set', 'digital' => null, 'physical' => 2500, 'formats' => [], 'digital_ok' => false, 'physical_ok' => true],
            ['title' => 'Agbada embroidery pattern pack', 'digital' => 3500, 'physical' => null, 'formats' => ['DST', 'PES', 'PDF'], 'digital_ok' => true, 'physical_ok' => false],
            ['title' => 'YKK zipper assortment', 'digital' => null, 'physical' => 4000, 'formats' => [], 'digital_ok' => false, 'physical_ok' => true],
        ];

        foreach ($samples as $i => $sample) {
            $product = Product::create([
                'category_id' => Category::where('is_active', true)->inRandomOrder()->first()?->id,
                'title' => $sample['title'],
                'slug' => Str::slug($sample['title']),
                'description' => 'Quality tailoring supply from The Tailors Market.',
                'digital_price' => $sample['digital'],
                'physical_price' => $sample['physical'],
                'is_digital_available' => $sample['digital_ok'],
                'is_physical_available' => $sample['physical_ok'],
                'physical_stock' => $sample['physical_ok'] ? 50 : 0,
                'width_mm' => null,
                'height_mm' => null,
                'status' => 'published',
                'is_featured' => $i < 2,
                'is_new_arrival' => $i < 3,
            ]);

            foreach ($sample['formats'] as $format) {
                ProductFormat::create(['product_id' => $product->id, 'format' => $format]);
            }
        }

        $pages = [
            ['title' => 'How it works', 'slug' => 'how-it-works', 'content' => '<h2>For buyers</h2><p>Browse tailoring materials and digital patterns, choose digital, physical, or both where offered, pay securely, then download files instantly or receive shipped items.</p><h2>For vendors</h2><p>Open a shop, list your supplies, and keep 90% of product sales plus shipping on your items.</p>'],
            ['title' => 'FAQs', 'slug' => 'faqs', 'content' => '<h3>What can I buy?</h3><p>Fabrics, threads, tools, machines, trims, and digital patterns — whatever tailors need.</p><h3>Digital vs physical</h3><p>Digital products are downloaded after payment. Physical products are packed and shipped. Some listings offer both.</p>'],
            ['title' => 'Terms of Service', 'slug' => 'terms', 'content' => '<p>By using The Tailors Market you agree to our terms.</p>'],
            ['title' => 'Privacy Policy', 'slug' => 'privacy', 'content' => '<p>We respect your privacy and protect your data.</p>'],
            ['title' => 'Licensing', 'slug' => 'licensing', 'content' => '<p>Digital pattern and file purchases include commercial use for your own production. Do not resell or redistribute the original digital files.</p>'],
        ];

        foreach ($pages as $page) {
            Page::create([...$page, 'is_published' => true]);
        }
    }
}
