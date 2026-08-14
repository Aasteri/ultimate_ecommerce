<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        Category::query()->update(['is_active' => false]);

        $tree = [
            ['name' => 'Fabrics', 'slug' => 'fabrics', 'sort_order' => 1],
            ['name' => 'Threads', 'slug' => 'threads', 'sort_order' => 2],
            ['name' => 'Zippers & closures', 'slug' => 'zippers-and-closures', 'sort_order' => 3],
            ['name' => 'Buttons & trims', 'slug' => 'buttons-and-trims', 'sort_order' => 4],
            ['name' => 'Needles, pins & notions', 'slug' => 'needles-pins-notions', 'sort_order' => 5],
            ['name' => 'Interfacing & lining', 'slug' => 'interfacing-and-lining', 'sort_order' => 6],
            ['name' => 'Patterns & designs', 'slug' => 'patterns-and-designs', 'sort_order' => 7],
            ['name' => 'Sewing machines & parts', 'slug' => 'sewing-machines-and-parts', 'sort_order' => 8],
            ['name' => 'Cutting & measuring tools', 'slug' => 'cutting-and-measuring-tools', 'sort_order' => 9],
            ['name' => 'Pressing & finishing', 'slug' => 'pressing-and-finishing', 'sort_order' => 10],
            ['name' => 'Embroidery supplies', 'slug' => 'embroidery-supplies', 'sort_order' => 11],
            ['name' => 'Packaging & extras', 'slug' => 'packaging-and-extras', 'sort_order' => 12],
        ];

        foreach ($tree as $item) {
            $this->upsertCategory($item);
        }
    }

    private function upsertCategory(array $item, ?int $parentId = null): void
    {
        $category = Category::updateOrCreate(
            ['slug' => $item['slug']],
            [
                'parent_id' => $parentId,
                'name' => $item['name'],
                'sort_order' => $item['sort_order'] ?? 0,
                'is_active' => true,
            ]
        );

        if (! empty($item['children'])) {
            foreach ($item['children'] as $child) {
                $this->upsertCategory($child, $category->id);
            }
        }
    }
}
