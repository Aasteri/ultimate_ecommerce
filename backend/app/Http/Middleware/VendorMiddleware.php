<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VendorMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $shop = $user?->shop;

        if (!$shop || $shop->status !== 'approved') {
            return response()->json(['message' => 'An approved shop is required'], 403);
        }

        return $next($request);
    }
}
