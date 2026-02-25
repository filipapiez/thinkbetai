import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getPlanIdFromPriceId } from "../_shared/stripePlans.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey || !webhookSecret) {
      logStep("Missing configuration", { hasStripeKey: !!stripeKey, hasWebhookSecret: !!webhookSecret });
      return new Response("Missing Stripe configuration", { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("Missing stripe-signature header");
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      logStep("Event verified", { type: event.type, id: event.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Signature verification failed", { error: errorMessage });
      return new Response(`Webhook signature verification failed: ${errorMessage}`, { status: 400 });
    }

    // Create backend admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", {
        sessionId: session.id,
        clientReferenceId: session.client_reference_id,
        metadata: session.metadata,
        customerEmail: session.customer_details?.email,
      });

      // 1. Determine the userId: prefer client_reference_id, then metadata
      let userId = session.client_reference_id || session.metadata?.userId;

      // 2. Fallback: find user by email if no userId attached
      if (!userId) {
        const email = session.customer_details?.email || session.customer_email;
        if (email) {
          logStep("No userId on session, falling back to email lookup", { email });
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("email", email)
            .limit(1)
            .single();
          if (profile?.user_id) {
            userId = profile.user_id;
            logStep("Found user via email", { userId, email });
          }
        }
      }

      if (!userId) {
        logStep("No userId found on session (no client_reference_id, metadata, or email match)");
        return new Response("No userId on session", { status: 400 });
      }

      // 3. Determine planId: metadata first, then line-item price lookup
      let planId =
        (session.metadata?.planId as string | undefined) ||
        getPlanIdFromPriceId(session.metadata?.priceId);

      // For Payment Links there's no metadata, so resolve from line items
      if (!planId) {
        try {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
          const priceId = lineItems.data[0]?.price?.id;
          logStep("Resolving planId from line item price", { priceId });
          planId = getPlanIdFromPriceId(priceId);
        } catch (e) {
          logStep("Failed to fetch line items", { error: String(e) });
        }
      }

      if (!planId) {
        logStep("Could not determine planId", { userId });
        // Default to basic so the user at least gets access
        planId = "basic";
        logStep("Defaulting to basic plan");
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          has_access: true,
          subscription_status: "active",
          access_type: planId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        logStep("Error updating profile", { error: updateError.message, userId, planId });
        return new Response(`Error updating profile: ${updateError.message}`, { status: 500 });
      }

      logStep("Profile updated successfully", { userId, planId });
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Handle subscription canceled/deleted
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription deletion", { subscriptionId: subscription.id });

      // Find user by Stripe customer ID
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      if (!customer.deleted && customer.email) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            has_access: false,
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("email", customer.email);

        if (error) {
          logStep("Error updating profile on cancellation", { error: error.message });
        } else {
          logStep("Profile updated for cancellation", { email: customer.email });
        }
      }

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Handle subscription updates (e.g., renewal, payment failed)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription update", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      if (!customer.deleted && customer.email) {
        const isActive = subscription.status === "active" || subscription.status === "trialing";

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            has_access: isActive,
            subscription_status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq("email", customer.email);

        if (error) {
          logStep("Error updating profile on subscription update", { error: error.message });
        } else {
          logStep("Profile updated for subscription change", {
            email: customer.email,
            status: subscription.status,
            hasAccess: isActive,
          });
        }
      }

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    logStep("Event type not handled, ignoring", { type: event.type });
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Unexpected error", { error: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});
