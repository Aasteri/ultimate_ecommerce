<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Page::orderBy('title')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:80|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/|unique:pages',
            'content' => 'nullable|string',
            'is_published' => 'boolean',
        ]);

        return response()->json(Page::create($data), 201);
    }

    public function update(Request $request, Page $page): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:80|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/|unique:pages,slug,' . $page->id,
            'content' => 'nullable|string',
            'is_published' => 'boolean',
        ]);

        $page->update($data);

        return response()->json($page);
    }

    public function destroy(Page $page): JsonResponse
    {
        $page->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
