import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Import shared plan mapping
import { PRICE_TO_PLAN_ID } from "../_shared/stripePlans.ts";

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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch all active subscriptions from Stripe
    const planCounts: Record<string, number> = { basic: 0, pro: 0, insider: 0 };
    let totalActive = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: any = { status: "active", limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;

      const subs = await stripe.subscriptions.list(params);

      for (const sub of subs.data) {
        totalActive++;
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? PRICE_TO_PLAN_ID[priceId as keyof typeof PRICE_TO_PLAN_ID] : null;
        if (plan && planCounts[plan] !== undefined) {
          planCounts[plan]++;
        }
      }

      hasMore = subs.has_more;
      if (subs.data.length > 0) {
        startingAfter = subs.data[subs.data.length - 1].id;
      }
    }

    // Fetch canceled subscriptions count
    let canceledCount = 0;
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const params: any = { status: "canceled", limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;

      const subs = await stripe.subscriptions.list(params);
      canceledCount += subs.data.length;

      hasMore = subs.has_more;
      if (subs.data.length > 0) {
        startingAfter = subs.data[subs.data.length - 1].id;
      }
    }

    // Fetch canceling (cancel_at_period_end) count
    let cancelingCount = 0;
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const params: any = { status: "active", limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;

      const subs = await stripe.subscriptions.list(params);

      for (const sub of subs.data) {
        if (sub.cancel_at_period_end) {
          cancelingCount++;
        }
      }

      hasMore = subs.has_more;
      if (subs.data.length > 0) {
        startingAfter = subs.data[subs.data.length - 1].id;
      }
    }

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
