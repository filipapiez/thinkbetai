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
  newSubsSinceMarch4: number;
  totalMoneyMade: number;
};

async function fetchStripeStats(stripeKey: string, label: string): Promise<StripeStats> {
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const planCounts: Record<string, number> = { ...EMPTY_PLAN_COUNTS };
  const planScheduledCancels: Record<string, number> = { ...EMPTY_PLAN_COUNTS };

  let totalActive = 0;
  let scheduledCancels = 0;
  let newSubsSinceMarch4 = 0;
  const march4Ts = Math.floor(new Date("2026-03-04T00:00:00Z").getTime() / 1000);
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

      if (plan && planCounts[plan] !== undefined) {
        planCounts[plan]++;
      }

      // Check if created after March 4
      if ((sub as any).created >= march4Ts) {
        newSubsSinceMarch4++;
      }
    }

    hasMore = subs.has_more;
    if (subs.data.length > 0) startingAfter = subs.data[subs.data.length - 1].id;
  }

  // Fetch total money made from all successful charges
  let totalMoneyMade = 0;
  let chargeHasMore = true;
  let chargeStartingAfter: string | undefined;
  while (chargeHasMore) {
    const chargeParams: Record<string, unknown> = { limit: 100 };
    if (chargeStartingAfter) chargeParams.starting_after = chargeStartingAfter;
    const charges = await stripe.charges.list(chargeParams);
    for (const charge of charges.data) {
      if (charge.status === "succeeded" && !charge.refunded) {
        totalMoneyMade += (charge.amount - (charge.amount_refunded || 0));
      }
    }
    chargeHasMore = charges.has_more;
    if (charges.data.length > 0) chargeStartingAfter = charges.data[charges.data.length - 1].id;
  }

  console.log(`[ADMIN-STATS][${label}] active=${totalActive} scheduledCancels=${scheduledCancels} newSince0304=${newSubsSinceMarch4} totalMoneyMade=${totalMoneyMade} plans=${JSON.stringify(planCounts)}`);
  return { totalActive, scheduledCancels, planCounts, planScheduledCancels, newSubsSinceMarch4, totalMoneyMade };
}

function mergeStats(a: StripeStats, b: StripeStats): StripeStats {
  const planCounts: Record<string, number> = { ...EMPTY_PLAN_COUNTS };
  const planScheduledCancels: Record<string, number> = { ...EMPTY_PLAN_COUNTS };
  for (const key of Object.keys(EMPTY_PLAN_COUNTS)) {
    planCounts[key] = (a.planCounts[key] || 0) + (b.planCounts[key] || 0);
    planScheduledCancels[key] = (a.planScheduledCancels[key] || 0) + (b.planScheduledCancels[key] || 0);
  }
  return {
    totalActive: a.totalActive + b.totalActive,
    scheduledCancels: a.scheduledCancels + b.scheduledCancels,
    planCounts,
    planScheduledCancels,
    newSubsSinceMarch4: a.newSubsSinceMarch4 + b.newSubsSinceMarch4,
    totalMoneyMade: a.totalMoneyMade + b.totalMoneyMade,
  };
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const oldStripeKey = Deno.env.get("STRIPE_OLD_SECRET_KEY") ?? "";
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY missing");

    // Fetch from both accounts in parallel
    const statsPromises: Promise<StripeStats>[] = [fetchStripeStats(stripeKey, "primary")];
    if (oldStripeKey) statsPromises.push(fetchStripeStats(oldStripeKey, "legacy"));

    const results = await Promise.all(statsPromises);
    const stats = results.length > 1 ? mergeStats(results[0], results[1]) : results[0];

    const { count: totalUsers } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const currentMrr = Object.entries(stats.planCounts).reduce(
      (sum, [plan, count]) => sum + count * (PLAN_PRICES[plan] || 0), 0
    );

    const projectedMrr = Object.entries(stats.planCounts).reduce(
      (sum, [plan, count]) => {
        const sc = stats.planScheduledCancels[plan] || 0;
        return sum + (count - sc) * (PLAN_PRICES[plan] || 0);
      }, 0
    );

    const cancelRate = stats.totalActive > 0
      ? ((stats.scheduledCancels / stats.totalActive) * 100).toFixed(1)
      : "0";

    return new Response(
      JSON.stringify({
        totalUsers: totalUsers || 0,
        mrr: currentMrr,
        projectedMrr,
        totalActive: stats.totalActive,
        scheduledCancels: stats.scheduledCancels,
        cancelRate,
        newSubsSinceMarch4: stats.newSubsSinceMarch4,
        totalMoneyMade: stats.totalMoneyMade / 100,
        plans: Object.entries(stats.planCounts).map(([key, count]) => {
          const sc = stats.planScheduledCancels[key] || 0;
          const planCancelRate = count > 0 ? ((sc / count) * 100).toFixed(1) : "0";
          return {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            count,
            revenue: count * (PLAN_PRICES[key] || 0),
            scheduledCancels: sc,
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
