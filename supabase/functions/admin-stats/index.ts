import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { PRICE_TO_PLAN_ID } from "../_shared/stripePlans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMPTY_PLAN_COUNTS: Record<string, number> = { basic: 0, pro: 0, insider: 0 };

const OLD_PRICE_TO_PLAN: Record<string, string> = {
  // Optional explicit mapping for old account price IDs (if they differ)
  // price_OLD_BASIC: "basic",
  // price_OLD_PRO: "pro",
  // price_OLD_INSIDER: "insider",
};

function inferPlanFromAmount(amountCents: number | null | undefined): string | null {
  if (amountCents === 499) return "basic";
  if (amountCents === 1399) return "pro";
  if (amountCents === 4999) return "insider";
  return null;
}

type StripeStats = {
  totalActive: number;
  cancelingCount: number;
  canceledCount: number;
  planCounts: Record<string, number>;
};

async function fetchStripeStats(stripeKey: string, label: "new" | "old"): Promise<StripeStats> {
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const planCounts: Record<string, number> = { ...EMPTY_PLAN_COUNTS };

  let totalActive = 0;
  let cancelingCount = 0;
  let canceledCount = 0;

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Record<string, unknown> = { status: "active", limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const subs = await stripe.subscriptions.list(params);

    for (const sub of subs.data) {
      totalActive++;
      const isCanceling = !!sub.cancel_at_period_end;
      if (isCanceling) cancelingCount++;

      const price = sub.items.data[0]?.price;
      const priceId = price?.id;
      const amountCents = price?.unit_amount;

      let plan = priceId
        ? (PRICE_TO_PLAN_ID as Record<string, string>)[priceId] ?? OLD_PRICE_TO_PLAN[priceId] ?? null
        : null;

      if (!plan) {
        plan = inferPlanFromAmount(amountCents);
      }

      // Only count towards MRR if NOT canceling
      if (!isCanceling && plan && planCounts[plan] !== undefined) {
        planCounts[plan] += 1;
      }
    }

    hasMore = subs.has_more;
    if (subs.data.length > 0) {
      startingAfter = subs.data[subs.data.length - 1].id;
    }
  }

  hasMore = true;
  startingAfter = undefined;

  while (hasMore) {
    const params: Record<string, unknown> = { status: "canceled", limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const subs = await stripe.subscriptions.list(params);
    canceledCount += subs.data.length;

    hasMore = subs.has_more;
    if (subs.data.length > 0) {
      startingAfter = subs.data[subs.data.length - 1].id;
    }
  }

  console.log(`[ADMIN-STATS][${label}] active=${totalActive} canceling=${cancelingCount} canceled=${canceledCount} plans=${JSON.stringify(planCounts)}`);

  return { totalActive, cancelingCount, canceledCount, planCounts };
}

function mergeStats(stats: StripeStats[]): StripeStats {
  return stats.reduce(
    (acc, curr) => ({
      totalActive: acc.totalActive + curr.totalActive,
      cancelingCount: acc.cancelingCount + curr.cancelingCount,
      canceledCount: acc.canceledCount + curr.canceledCount,
      planCounts: {
        basic: acc.planCounts.basic + curr.planCounts.basic,
        pro: acc.planCounts.pro + curr.planCounts.pro,
        insider: acc.planCounts.insider + curr.planCounts.insider,
      },
    }),
    { totalActive: 0, cancelingCount: 0, canceledCount: 0, planCounts: { ...EMPTY_PLAN_COUNTS } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Not authorized");

    const newKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const oldKey = Deno.env.get("STRIPE_OLD_SECRET_KEY") ?? "";

    const accountFetches = [
      { label: "new" as const, key: newKey },
      { label: "old" as const, key: oldKey },
    ];

    const settled = await Promise.allSettled(
      accountFetches.map(async ({ label, key }) => {
        if (!key) {
          throw new Error(`${label.toUpperCase()} Stripe key missing`);
        }
        const stats = await fetchStripeStats(key, label);
        return { label, stats };
      })
    );

    const successfulStats: StripeStats[] = [];
    const sources: Record<string, { included: boolean; error?: string }> = {
      new: { included: false },
      old: { included: false },
    };

    settled.forEach((result, idx) => {
      const label = accountFetches[idx].label;
      if (result.status === "fulfilled") {
        successfulStats.push(result.value.stats);
        sources[label] = { included: true };
      } else {
        const errMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        sources[label] = { included: false, error: errMsg };
        console.warn(`[ADMIN-STATS][${label}] failed: ${errMsg}`);
      }
    });

    if (successfulStats.length === 0) {
      throw new Error("Could not load stats from either Stripe account");
    }

    const merged = mergeStats(successfulStats);

    const { count: totalUsers } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Count cancellations from our own database (only those done through the website)
    const { count: dbCanceledCount } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "canceled");

    const { count: dbCancelingCount } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "canceling");

    const websiteCanceled = (dbCanceledCount || 0) + (dbCancelingCount || 0);

    const planPrices: Record<string, number> = {
      basic: 4.99,
      pro: 13.99,
      insider: 49.99,
    };

    const mrr = Object.entries(merged.planCounts).reduce(
      (sum, [plan, count]) => sum + count * (planPrices[plan] || 0),
      0
    );

    const allPaidEver = merged.totalActive + websiteCanceled;
    const cancelRate = allPaidEver > 0 ? ((websiteCanceled / allPaidEver) * 100).toFixed(1) : "0";

    return new Response(
      JSON.stringify({
        totalUsers: totalUsers || 0,
        mrr,
        totalActive: merged.totalActive,
        cancelingCount: dbCancelingCount || 0,
        canceledCount: dbCanceledCount || 0,
        cancelRate,
        sources,
        plans: Object.entries(merged.planCounts).map(([key, count]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          count,
          revenue: count * (planPrices[key] || 0),
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
