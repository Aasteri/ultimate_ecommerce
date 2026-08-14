<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\DownloadController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminContactController;
use App\Http\Controllers\Admin\AdminCouponController;
use App\Http\Controllers\Admin\AdminInboxController;
use App\Http\Controllers\Admin\AdminMarketingController;
use App\Http\Controllers\Admin\AdminNewsletterController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminPageController;
use App\Http\Controllers\Admin\AdminPayoutController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminReferralController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminShippingController;
use App\Http\Controllers\Admin\AdminShopController;
use App\Http\Controllers\Admin\AdminThemeController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Vendor\VendorOrderController;
use App\Http\Controllers\Vendor\VendorPayoutController;
use App\Http\Controllers\Vendor\VendorProductController;
use App\Http\Controllers\Vendor\VendorShopController;
use Illuminate\Support\Facades\Route;

Route::get('/home', [ProductController::class, 'home']);
Route::get('/products/filters', [ProductController::class, 'filters']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/shops', [ShopController::class, 'index']);
Route::get('/shops/{slug}', [ShopController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/pages/{slug}', [PageController::class, 'show']);
Route::get('/settings', [PageController::class, 'settings']);
Route::post('/newsletter', [NewsletterController::class, 'subscribe']);
Route::get('/newsletter/unsubscribe/{token}', [NewsletterController::class, 'showByToken']);
Route::post('/newsletter/unsubscribe', [NewsletterController::class, 'unsubscribe']);
Route::post('/contact', [ContactController::class, 'store']);
Route::get('/shipping/config', [CheckoutController::class, 'shippingConfig']);
Route::post('/shipping/quote', [CheckoutController::class, 'quote']);
Route::get('/checkout/config', [CheckoutController::class, 'config']);
Route::get('/downloads/file/{token}', [DownloadController::class, 'file']);
Route::post('/checkout/webhook', [CheckoutController::class, 'webhook']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/password/forgot', [PasswordResetController::class, 'requestOtp']);
Route::post('/password/reset', [PasswordResetController::class, 'reset']);

Route::get('/cart', [CartController::class, 'show']);
Route::post('/cart/add', [CartController::class, 'add']);
Route::put('/cart/items/{cartItem}', [CartController::class, 'update']);
Route::delete('/cart/items/{cartItem}', [CartController::class, 'remove']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'update']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{notification}', [NotificationController::class, 'markRead']);

    Route::post('/checkout/coupon', [CouponController::class, 'apply']);

    Route::post('/checkout/initiate', [CheckoutController::class, 'initiate']);
    Route::post('/checkout/verify', [CheckoutController::class, 'verify']);
    Route::post('/checkout/simulate', [CheckoutController::class, 'simulate']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    Route::get('/downloads', [DownloadController::class, 'index']);
    Route::post('/downloads/{download}/link', [DownloadController::class, 'generateLink']);

    Route::get('/shop', [VendorShopController::class, 'show']);
    Route::post('/shop', [VendorShopController::class, 'apply']);
    Route::put('/shop', [VendorShopController::class, 'update']);
    Route::post('/shop/logo', [VendorShopController::class, 'uploadLogo']);

    Route::get('/referrals', [ReferralController::class, 'show']);
    Route::post('/referrals/payouts', [ReferralController::class, 'requestPayout']);
});

Route::middleware(['auth:sanctum', 'vendor'])->prefix('vendor')->group(function () {
    Route::get('/dashboard', [VendorShopController::class, 'dashboard']);

    Route::get('/products', [VendorProductController::class, 'index']);
    Route::post('/products', [VendorProductController::class, 'store']);
    Route::get('/products/{product}', [VendorProductController::class, 'show']);
    Route::put('/products/{product}', [VendorProductController::class, 'update']);
    Route::delete('/products/{product}', [VendorProductController::class, 'destroy']);
    Route::post('/products/{product}/preview', [VendorProductController::class, 'uploadPreview']);
    Route::delete('/products/{product}/images/{image}', [VendorProductController::class, 'deleteImage']);
    Route::post('/products/{product}/images/{image}/primary', [VendorProductController::class, 'setPrimaryImage']);
    Route::post('/products/{product}/file', [VendorProductController::class, 'uploadFile']);

    Route::get('/orders', [VendorOrderController::class, 'index']);
    Route::get('/orders/{vendorOrder}', [VendorOrderController::class, 'show']);
    Route::put('/orders/{vendorOrder}/fulfillment', [VendorOrderController::class, 'updateFulfillment']);

    Route::get('/payouts', [VendorPayoutController::class, 'index']);
    Route::post('/payouts', [VendorPayoutController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'stats']);

    Route::get('/products', [AdminProductController::class, 'index']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::get('/products/{product}', [AdminProductController::class, 'show']);
    Route::put('/products/{product}', [AdminProductController::class, 'update']);
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);
    Route::post('/products/{product}/preview', [AdminProductController::class, 'uploadPreview']);
    Route::delete('/products/{product}/images/{image}', [AdminProductController::class, 'deleteImage']);
    Route::post('/products/{product}/images/{image}/primary', [AdminProductController::class, 'setPrimaryImage']);
    Route::post('/products/{product}/images/reorder', [AdminProductController::class, 'reorderImages']);
    Route::post('/products/{product}/file', [AdminProductController::class, 'uploadFile']);

    Route::get('/categories', [AdminCategoryController::class, 'index']);
    Route::post('/categories', [AdminCategoryController::class, 'store']);
    Route::put('/categories/{category}', [AdminCategoryController::class, 'update']);
    Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{order}/fulfillment', [AdminOrderController::class, 'updateFulfillment']);
    Route::put('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    Route::get('/shops', [AdminShopController::class, 'index']);
    Route::get('/shops/{shop}', [AdminShopController::class, 'show']);
    Route::put('/shops/{shop}', [AdminShopController::class, 'update']);
    Route::post('/shops/{shop}/seed-activity', [AdminShopController::class, 'seedActivity']);

    Route::get('/payouts', [AdminPayoutController::class, 'index']);
    Route::put('/payouts/{payout}', [AdminPayoutController::class, 'update']);

    Route::get('/coupons', [AdminCouponController::class, 'index']);
    Route::post('/coupons', [AdminCouponController::class, 'store']);
    Route::put('/coupons/{coupon}', [AdminCouponController::class, 'update']);
    Route::delete('/coupons/{coupon}', [AdminCouponController::class, 'destroy']);

    Route::get('/marketing/users', [AdminMarketingController::class, 'users']);
    Route::get('/marketing/campaigns', [AdminMarketingController::class, 'campaigns']);
    Route::post('/marketing/send', [AdminMarketingController::class, 'send']);

    Route::get('/inbox', [AdminInboxController::class, 'index']);
    Route::post('/inbox', [AdminInboxController::class, 'store']);
    Route::put('/inbox/{internalMessage}/read', [AdminInboxController::class, 'markRead']);

    Route::get('/referrals', [AdminReferralController::class, 'index']);
    Route::get('/wallet-payouts', [AdminReferralController::class, 'walletPayouts']);
    Route::put('/wallet-payouts/{walletPayout}', [AdminReferralController::class, 'updateWalletPayout']);

    Route::get('/shipping-rates', [AdminShippingController::class, 'rates']);
    Route::get('/shipping-rates/list', [AdminShippingController::class, 'index']);
    Route::post('/shipping-rates', [AdminShippingController::class, 'store']);
    Route::put('/shipping-rates/{shippingRate}', [AdminShippingController::class, 'update']);
    Route::delete('/shipping-rates/{shippingRate}', [AdminShippingController::class, 'destroy']);

    Route::get('/settings', [AdminSettingController::class, 'index']);
    Route::put('/settings', [AdminSettingController::class, 'update']);
    Route::get('/theme', [AdminThemeController::class, 'show']);
    Route::post('/theme/options', [AdminThemeController::class, 'options']);
    Route::put('/theme', [AdminThemeController::class, 'update']);
    Route::post('/theme/logo', [AdminThemeController::class, 'uploadLogo']);
    Route::post('/theme/background', [AdminThemeController::class, 'uploadBackground']);

    Route::get('/pages', [AdminPageController::class, 'index']);
    Route::post('/pages', [AdminPageController::class, 'store']);
    Route::put('/pages/{page}', [AdminPageController::class, 'update']);
    Route::delete('/pages/{page}', [AdminPageController::class, 'destroy']);

    Route::get('/messages', [AdminContactController::class, 'index']);
    Route::put('/messages/{message}/read', [AdminContactController::class, 'markRead']);
    Route::post('/messages/{message}/reply', [AdminContactController::class, 'reply']);

    Route::get('/newsletter', [AdminNewsletterController::class, 'index']);
    Route::post('/newsletter', [AdminNewsletterController::class, 'store']);
    Route::put('/newsletter/{newsletter}', [AdminNewsletterController::class, 'update']);
    Route::delete('/newsletter/{newsletter}', [AdminNewsletterController::class, 'destroy']);
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{user}', [AdminUserController::class, 'show']);
    Route::put('/users/{user}', [AdminUserController::class, 'update']);
});
