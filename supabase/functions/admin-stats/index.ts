import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { PRICE_TO_PLAN_ID } from "../_shared/stripePlans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, number> = { basic: 4.99, pro: 13.99, insider: 49.99 };
const EMPTY_PLAN_COUNTS: Record<string, number> = { basic: 0, pro: 0, insider: 0 };

function inferPlanFromAmount(amountCents: number | null | undefined): string | null {
  if (amountCents === 499) return "basic";
  if (amountCents === 1399) return "pro";
  if (amountCents === 4999) return "insider";
  return null;
}

type StripeStats = {
  totalActive: number;
  scheduledCancels: number;
  planCounts: Record<string, number>;
  planScheduledCancels: Record<string, number>;
};

async function fetchStripeStats(stripeKey: string, label: string): Promise<StripeStats> {
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const planCounts: Record<string, number> = { ...EMPTY_PLAN_COUNTS };
  const planScheduledCancels: Record<string, number> = { ...EMPTY_PLAN_COUNTS };

  let totalActive = 0;
  let scheduledCancels = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Record<string, unknown> = { status: "active", limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    const subs = await stripe.subscriptions.list(params);

    for (const sub of subs.data) {
      totalActive++;
      const price = sub.items.data[0]?.price;
      const priceId = price?.id;
      const amountCents = price?.unit_amount;

      let plan = priceId
        ? (PRICE_TO_PLAN_ID as Record<string, string>)[priceId] ?? null
        : null;
      if (!plan) plan = inferPlanFromAmount(amountCents);

      if (sub.cancel_at_period_end) {
        scheduledCancels++;
        if (plan && planScheduledCancels[plan] !== undefined) {
          planScheduledCancels[plan]++;
        }
      }

      // Count all active subs for MRR (including scheduled cancels — they're still paying this cycle)
      if (plan && planCounts[plan] !== undefined) {
        planCounts[plan]++;
      }
    }

    hasMore = subs.has_more;
    if (subs.data.length > 0) startingAfter = subs.data[subs.data.length - 1].id;
  }

  console.log(`[ADMIN-STATS][${label}] active=${totalActive} scheduledCancels=${scheduledCancels} plans=${JSON.stringify(planCounts)}`);
  return { totalActive, scheduledCancels, planCounts, planScheduledCancels };
}

function mergeStats(stats: StripeStats[]): StripeStats {
  return stats.reduce(
    (acc, curr) => ({
      totalActive: acc.totalActive + curr.totalActive,
      scheduledCancels: acc.scheduledCancels + curr.scheduledCancels,
      planCounts: {
        basic: acc.planCounts.basic + curr.planCounts.basic,
        pro: acc.planCounts.pro + curr.planCounts.pro,
        insider: acc.planCounts.insider + curr.planCounts.insider,
      },
      planScheduledCancels: {
        basic: acc.planScheduledCancels.basic + curr.planScheduledCancels.basic,
        pro: acc.planScheduledCancels.pro + curr.planScheduledCancels.pro,
        insider: acc.planScheduledCancels.insider + curr.planScheduledCancels.insider,
      },
    }),
    { totalActive: 0, scheduledCancels: 0, planCounts: { ...EMPTY_PLAN_COUNTS }, planScheduledCancels: { ...EMPTY_PLAN_COUNTS } }
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
      { label: "new", key: newKey },
      { label: "old", key: oldKey },
    ];

    const settled = await Promise.allSettled(
      accountFetches.map(async ({ label, key }) => {
        if (!key) throw new Error(`${label.toUpperCase()} Stripe key missing`);
        return { label, stats: await fetchStripeStats(key, label) };
      })
    );

    const successfulStats: StripeStats[] = [];
    const sources: Record<string, { included: boolean; error?: string }> = { new: { included: false }, old: { included: false } };

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

    if (successfulStats.length === 0) throw new Error("Could not load stats from either Stripe account");

    const merged = mergeStats(successfulStats);

    const { count: totalUsers } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Current MRR: all active subs (including scheduled cancels — they're still paying this cycle)
    const currentMrr = Object.entries(merged.planCounts).reduce(
      (sum, [plan, count]) => sum + count * (PLAN_PRICES[plan] || 0), 0
    );

    // Projected MRR: exclude scheduled cancels
    const projectedMrr = Object.entries(merged.planCounts).reduce(
      (sum, [plan, count]) => {
        const scheduledCancels = merged.planScheduledCancels[plan] || 0;
        return sum + (count - scheduledCancels) * (PLAN_PRICES[plan] || 0);
      }, 0
    );

    const cancelRate = merged.totalActive > 0
      ? ((merged.scheduledCancels / merged.totalActive) * 100).toFixed(1)
      : "0";

    return new Response(
      JSON.stringify({
        totalUsers: totalUsers || 0,
        mrr: currentMrr,
        projectedMrr,
        totalActive: merged.totalActive,
        scheduledCancels: merged.scheduledCancels,
        cancelRate,
        sources,
        plans: Object.entries(merged.planCounts).map(([key, count]) => {
          const scheduledCancels = merged.planScheduledCancels[key] || 0;
          const planCancelRate = count > 0 ? ((scheduledCancels / count) * 100).toFixed(1) : "0";
          return {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            count,
            revenue: count * (PLAN_PRICES[key] || 0),
            scheduledCancels,
            cancelRate: planCancelRate,
          };
        }),
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
