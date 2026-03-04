import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { PRICE_TO_PLAN_ID } from "../_shared/stripePlans.ts";

// Old Stripe price-to-plan mapping (add your old price IDs here if different)
const OLD_PRICE_TO_PLAN: Record<string, string> = {
  // Map old Stripe price IDs to plan names. We'll also try to infer from amount.
};

function inferPlanFromAmount(amountCents: number): string | null {
  // Match by monthly price in cents
  if (amountCents === 499) return "basic";
  if (amountCents === 1399) return "pro";
  if (amountCents === 4999) return "insider";
  return null;
}

async function fetchStripeStats(stripeKey: string, label: string) {
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const planCounts: Record<string, number> = { basic: 0, pro: 0, insider: 0 };
  let totalActive = 0;
  let cancelingCount = 0;
  let canceledCount = 0;

  // Active subscriptions
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: any = { status: "active", limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    const subs = await stripe.subscriptions.list(params);

    for (const sub of subs.data) {
      totalActive++;
      if (sub.cancel_at_period_end) cancelingCount++;

      const priceId = sub.items.data[0]?.price?.id;
      const amountCents = sub.items.data[0]?.price?.unit_amount;
      // Try new mapping, then old mapping, then infer from amount
      let plan = priceId ? (PRICE_TO_PLAN_ID as Record<string, string>)[priceId] ?? OLD_PRICE_TO_PLAN[priceId] : null;
      if (!plan && amountCents) plan = inferPlanFromAmount(amountCents);
      if (plan && planCounts[plan] !== undefined) {
        planCounts[plan]++;
      }
    }

    hasMore = subs.has_more;
    if (subs.data.length > 0) startingAfter = subs.data[subs.data.length - 1].id;
  }

  // Canceled subscriptions
  hasMore = true;
  startingAfter = undefined;
  while (hasMore) {
    const params: any = { status: "canceled", limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    const subs = await stripe.subscriptions.list(params);
    canceledCount += subs.data.length;
    hasMore = subs.has_more;
    if (subs.data.length > 0) startingAfter = subs.data[subs.data.length - 1].id;
  }

  console.log(`[ADMIN-STATS][${label}] active=${totalActive} canceling=${cancelingCount} canceled=${canceledCount} plans=${JSON.stringify(planCounts)}`);

  return { totalActive, cancelingCount, canceledCount, planCounts };
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
    // Verify admin
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

    // Fetch stats from both Stripe accounts in parallel
    const newKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const oldKey = Deno.env.get("STRIPE_OLD_SECRET_KEY") || "";

    const promises: Promise<any>[] = [];
    if (newKey) promises.push(fetchStripeStats(newKey, "NEW"));
    else promises.push(Promise.resolve({ totalActive: 0, cancelingCount: 0, canceledCount: 0, planCounts: { basic: 0, pro: 0, insider: 0 } }));

    if (oldKey) promises.push(fetchStripeStats(oldKey, "OLD"));
    else promises.push(Promise.resolve({ totalActive: 0, cancelingCount: 0, canceledCount: 0, planCounts: { basic: 0, pro: 0, insider: 0 } }));

    const [newStats, oldStats] = await Promise.all(promises);

    // Merge
    const planCounts: Record<string, number> = {
      basic: newStats.planCounts.basic + oldStats.planCounts.basic,
      pro: newStats.planCounts.pro + oldStats.planCounts.pro,
      insider: newStats.planCounts.insider + oldStats.planCounts.insider,
    };
    const totalActive = newStats.totalActive + oldStats.totalActive;
    const cancelingCount = newStats.cancelingCount + oldStats.cancelingCount;
    const canceledCount = newStats.canceledCount + oldStats.canceledCount;

    // Total users from profiles
    const { count: totalUsers } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const planPrices: Record<string, number> = {
      basic: 4.99,
      pro: 13.99,
      insider: 49.99,
    };

    const mrr = Object.entries(planCounts).reduce(
      (sum, [plan, count]) => sum + count * (planPrices[plan] || 0),
      0
    );

    const allPaidEver = totalActive + canceledCount;
    const cancelRate = allPaidEver > 0 ? ((canceledCount / allPaidEver) * 100).toFixed(1) : "0";

    return new Response(
      JSON.stringify({
        totalUsers: totalUsers || 0,
        mrr,
        totalActive,
        cancelingCount,
        canceledCount,
        cancelRate,
        plans: Object.entries(planCounts).map(([key, count]) => ({
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
