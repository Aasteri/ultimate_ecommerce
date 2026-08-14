<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingRate;
use App\Services\ShippingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminShippingController extends Controller
{
    public function __construct(private ShippingService $shippingService) {}

    public function rates(): JsonResponse
    {
        return response()->json($this->shippingService->ratesTable());
    }

    public function index(): JsonResponse
    {
        $query = ShippingRate::query()->orderBy('type')->orderBy('sort_order')->orderBy('name');

        if (request()->filled('type')) {
            $query->where('type', request('type'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in([ShippingRate::TYPE_LAGOS, ShippingRate::TYPE_STATE])],
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'base_rate' => 'required|numeric|min:0|max:99999999.99',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0|max:9999',
        ]);

        $code = $data['code'] ?? Str::slug($data['name']);
        if ($code === '') {
            $code = Str::slug($data['name']) ?: 'rate-' . time();
        }

        $exists = ShippingRate::where('type', $data['type'])->where('code', $code)->exists();
        if ($exists) {
            return response()->json(['message' => 'A rate with this code already exists for that type'], 422);
        }

        $rate = ShippingRate::create([
            'type' => $data['type'],
            'code' => $code,
            'name' => $data['name'],
            'base_rate' => $data['base_rate'],
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? ((int) ShippingRate::where('type', $data['type'])->max('sort_order') + 1),
        ]);

        return response()->json($rate, 201);
    }

    public function update(Request $request, ShippingRate $shippingRate): JsonResponse
    {
        $data = $request->validate([
            'type' => ['sometimes', Rule::in([ShippingRate::TYPE_LAGOS, ShippingRate::TYPE_STATE])],
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:100',
            'base_rate' => 'sometimes|numeric|min:0|max:99999999.99',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0|max:9999',
        ]);

        if (isset($data['code']) || isset($data['type'])) {
            $type = $data['type'] ?? $shippingRate->type;
            $code = $data['code'] ?? $shippingRate->code;
            $exists = ShippingRate::where('type', $type)
                ->where('code', $code)
                ->where('id', '!=', $shippingRate->id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'A rate with this code already exists for that type'], 422);
            }
        }

        $shippingRate->update($data);

        return response()->json($shippingRate->fresh());
    }

    public function destroy(ShippingRate $shippingRate): JsonResponse
    {
        $shippingRate->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
