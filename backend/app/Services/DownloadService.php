<?php

namespace App\Services;

use App\Models\Download;
use App\Models\DownloadToken;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DownloadService
{
    public function createToken(Download $download): DownloadToken
    {
        return $download->tokens()->create([
            'token' => Str::random(64),
            'expires_at' => now()->addHours(24),
        ]);
    }

    public function streamFile(DownloadToken $token): StreamedResponse
    {
        $download = $token->download;
        $product = $download->product;
        $file = $product->currentFile();

        if (!$file || !Storage::disk('local')->exists($file->file_path)) {
            abort(404, 'This product file is not available yet. Please contact support.');
        }

        $download->increment('download_count');
        $download->update(['last_downloaded_at' => now()]);

        return Storage::disk('local')->download($file->file_path, basename($file->file_path));
    }
}
