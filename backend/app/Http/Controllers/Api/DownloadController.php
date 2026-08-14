<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Download;
use App\Services\DownloadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DownloadController extends Controller
{
    public function __construct(private DownloadService $downloadService) {}

    public function index(Request $request): JsonResponse
    {
        $downloads = Download::with(['product.formats', 'product.category', 'product.files'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Download $download) {
                $file = $download->product?->currentFile();
                $download->setAttribute('file_ready', $file && \Illuminate\Support\Facades\Storage::disk('local')->exists($file->file_path));
                return $download;
            });

        return response()->json($downloads);
    }

    public function generateLink(Request $request, Download $download): JsonResponse
    {
        if ($download->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $download->loadMissing('product.files');
        $file = $download->product?->currentFile();
        if (!$file || !\Illuminate\Support\Facades\Storage::disk('local')->exists($file->file_path)) {
            return response()->json([
                'message' => 'This product has no downloadable file yet. Please contact support and we will send it to you.',
            ], 422);
        }

        $token = $this->downloadService->createToken($download);

        return response()->json([
            'url' => url("/api/downloads/file/{$token->token}"),
            'expires_at' => $token->expires_at,
        ]);
    }

    public function file(string $token)
    {
        $downloadToken = \App\Models\DownloadToken::where('token', $token)
            ->where('expires_at', '>', now())
            ->firstOrFail();

        return $this->downloadService->streamFile($downloadToken);
    }
}
