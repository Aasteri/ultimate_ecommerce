<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            if (! Schema::hasColumn('newsletter_subscribers', 'unsubscribe_token')) {
                $table->string('unsubscribe_token', 64)->nullable()->unique()->after('is_active');
            }
        });

        $subscribers = DB::table('newsletter_subscribers')->whereNull('unsubscribe_token')->get(['id']);
        foreach ($subscribers as $row) {
            DB::table('newsletter_subscribers')->where('id', $row->id)->update([
                'unsubscribe_token' => Str::random(48),
            ]);
        }

        if (! Schema::hasTable('marketing_campaigns')) {
            Schema::create('marketing_campaigns', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('subject');
                $table->text('body');
                $table->string('audience', 40);
                $table->unsignedInteger('recipients_count')->default(0);
                $table->string('status', 20)->default('sent');
                $table->text('error_message')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_campaigns');

        if (Schema::hasColumn('newsletter_subscribers', 'unsubscribe_token')) {
            Schema::table('newsletter_subscribers', function (Blueprint $table) {
                $table->dropColumn('unsubscribe_token');
            });
        }
    }
};
