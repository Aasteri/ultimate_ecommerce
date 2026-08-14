<?php

use App\Models\Product;
use App\Models\Setting;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('referral_code', 16)->nullable()->unique()->after('phone');
            $table->foreignId('referred_by_id')->nullable()->after('referral_code')->constrained('users')->nullOnDelete();
            $table->decimal('wallet_balance', 12, 2)->default(0)->after('referred_by_id');
            $table->unsignedBigInteger('referral_first_order_id')->nullable()->after('wallet_balance');
        });

        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('bio')->nullable();
            $table->string('logo')->nullable();
            $table->string('status')->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->string('payout_bank_name')->nullable();
            $table->string('payout_account_name')->nullable();
            $table->string('payout_account_number')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('product_id')->constrained()->nullOnDelete();
        });

        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('pending');
            $table->string('method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('vendor_orders', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_order_number')->unique();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->decimal('commission_rate', 5, 2)->default(10);
            $table->decimal('commission_amount', 12, 2)->default(0);
            $table->decimal('vendor_amount', 12, 2)->default(0);
            $table->string('status')->default('pending');
            $table->foreignId('payout_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->decimal('amount', 12, 2);
            $table->string('description')->nullable();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('wallet_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('pending');
            $table->string('method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('referral_first_order_id')->references('id')->on('orders')->nullOnDelete();
        });

        Setting::set('platform_commission_percent', '10');
        Setting::set('referral_percent', '10');

        foreach (User::all() as $user) {
            if (!$user->referral_code) {
                do {
                    $code = strtoupper(Str::random(8));
                } while (User::where('referral_code', $code)->exists());
                $user->update(['referral_code' => $code]);
            }
        }

        $admin = User::where('role', 'admin')->first();
        if ($admin) {
            $shop = Shop::create([
                'user_id' => $admin->id,
                'name' => 'The Tailors Market',
                'slug' => 'the-tailors-market',
                'bio' => 'Official The Tailors Market shop.',
                'status' => 'approved',
                'approved_at' => now(),
            ]);
            Product::query()->whereNull('shop_id')->update(['shop_id' => $shop->id]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['referral_first_order_id']);
        });
        Schema::dropIfExists('wallet_payouts');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('vendor_orders');
        Schema::dropIfExists('payouts');
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shop_id');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shop_id');
        });
        Schema::dropIfExists('shops');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referred_by_id');
            $table->dropColumn(['referral_code', 'wallet_balance', 'referral_first_order_id']);
        });
    }
};
