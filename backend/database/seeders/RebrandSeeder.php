<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\Setting;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;

class RebrandSeeder extends Seeder
{
    public function run(): void
    {
        Setting::set('site_name', 'The Tailors Market');
        Setting::set('site_description', 'Everything tailors need — fabrics, tools, patterns, and supplies from trusted vendors.');
        Setting::set('contact_email', 'info@thetailorsmarket.com');

        User::where('email', 'admin@monogramsmarket.com')
            ->update(['email' => 'admin@thetailorsmarket.com']);

        Shop::query()
            ->where('slug', 'monograms-market')
            ->orWhere('name', 'Monograms Market')
            ->update([
                'name' => 'The Tailors Market',
                'slug' => 'the-tailors-market',
                'bio' => 'Official The Tailors Market shop.',
            ]);

        $pages = [
            ['title' => 'How it works', 'slug' => 'how-it-works', 'content' => '<h2>For buyers</h2><p>Browse tailoring materials and digital patterns, choose digital, physical, or both where offered, pay securely, then download files instantly or receive shipped items.</p><h2>For vendors</h2><p>Open a shop, list your supplies, and keep 90% of product sales plus shipping on your items.</p>'],
            ['title' => 'FAQs', 'slug' => 'faqs', 'content' => '<h3>What can I buy?</h3><p>Fabrics, threads, tools, machines, trims, and digital patterns — whatever tailors need.</p><h3>Digital vs physical</h3><p>Digital products are downloaded after payment. Physical products are packed and shipped. Some listings offer both.</p>'],
            ['title' => 'Terms of Service', 'slug' => 'terms', 'content' => '<p>By using The Tailors Market you agree to our terms.</p>'],
            ['title' => 'Privacy Policy', 'slug' => 'privacy', 'content' => '<p>We respect your privacy and protect your data.</p>'],
            ['title' => 'Licensing', 'slug' => 'licensing', 'content' => '<p>Digital pattern and file purchases include commercial use for your own production. Do not resell or redistribute the original digital files.</p>'],
        ];

        foreach ($pages as $page) {
            Page::updateOrCreate(
                ['slug' => $page['slug']],
                [...$page, 'is_published' => true]
            );
        }

        $this->call(CategorySeeder::class);
    }
}
