<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'flutterwave' => [
        // Test (v3 Inline)
        'public_key' => env('FLUTTERWAVE_PUBLIC_KEY'),
        'secret_key' => env('FLUTTERWAVE_SECRET_KEY'),
        'encryption_key' => env('FLUTTERWAVE_ENCRYPTION_KEY'),
        // Live (v4 OAuth Client ID / Client Secret)
        'live_client_id' => env('FLUTTERWAVE_LIVE_CLIENT_ID'),
        'live_client_secret' => env('FLUTTERWAVE_LIVE_CLIENT_SECRET'),
        'live_encryption_key' => env('FLUTTERWAVE_LIVE_ENCRYPTION_KEY'),
        'secret_hash' => env('FLUTTERWAVE_SECRET_HASH'),
        'mode' => env('FLUTTERWAVE_MODE', 'test'),
        'base_url' => env('FLUTTERWAVE_BASE_URL', 'https://api.flutterwave.com/v3'),
        'v4_base_url' => env('FLUTTERWAVE_V4_BASE_URL', 'https://f4bexperience.flutterwave.com'),
        'v4_token_url' => env(
            'FLUTTERWAVE_V4_TOKEN_URL',
            'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token'
        ),
        // Optional fallback if API omits checkout_url: use {id} and/or {reference}
        'v4_checkout_url_template' => env('FLUTTERWAVE_V4_CHECKOUT_URL_TEMPLATE'),
    ],

];
