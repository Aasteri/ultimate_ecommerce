<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('shop:id,user_id,name,slug,status')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('referral_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        return response()->json([
            'users' => $query->paginate($request->integer('per_page', 30)),
            'stats' => [
                'total' => User::count(),
                'customers' => User::where('role', 'customer')->count(),
                'admins' => User::where('role', 'admin')->count(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('shop:id,user_id,name,slug,status,rejection_reason');

        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|min:2|max:80',
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:20|regex:/^$|^\+?[\d\s-]{10,20}$/',
            'role' => 'sometimes|in:customer,admin',
            'marketing_opt_in' => 'boolean',
            'password' => 'nullable|string|min:8|max:100',
        ]);

        if (($data['role'] ?? null) === 'customer' && $user->isAdmin()) {
            $otherAdmins = User::where('role', 'admin')->where('id', '!=', $user->id)->count();
            if ($otherAdmins === 0) {
                return response()->json(['message' => 'You cannot demote the last admin account.'], 422);
            }
        }

        if (($data['role'] ?? null) === 'customer' && $user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot demote your own admin account.'], 422);
        }

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('email', $data)) {
            $user->email = strtolower(trim($data['email']));
        }
        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'];
        }
        if (array_key_exists('role', $data)) {
            $user->role = $data['role'];
        }
        if (array_key_exists('marketing_opt_in', $data)) {
            $user->marketing_opt_in = $data['marketing_opt_in'];
        }
        if (! empty($data['password'])) {
            $user->password = $data['password'];
            $user->tokens()->delete();
        }

        $user->save();

        return response()->json($user->fresh('shop:id,user_id,name,slug,status'));
    }
}
