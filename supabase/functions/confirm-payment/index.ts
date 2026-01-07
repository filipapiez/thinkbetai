import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-PAYMENT] ${step}${detailsStr}`);
};

const PLAN_NAMES: Record<string, string> = {
  basic: "Basic Plan",
  pro: "Pro Plan",
  insider: "Insider Plan",
};

const sendEmails = async (
  userEmail: string,
  planId: string,
  planName: string,
  amount: number
) => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const adminEmail = Deno.env.get("ADMIN_EMAIL");

  if (!resendKey) {
    logStep("RESEND_API_KEY not set, skipping emails");
    return;
  }

  const resend = new Resend(resendKey);
  const formattedAmount = (amount / 100).toFixed(2);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Send receipt to user
  try {
    await resend.emails.send({
      from: "ThinkBetAI <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Payment Confirmation - ThinkBetAI",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e; margin-bottom: 24px;">Payment Successful! 🎉</h1>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 16px;">
            Thank you for subscribing to ThinkBetAI! Your payment has been processed successfully.
          </p>
          
          <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #333;">Order Details</h3>
            <p style="margin: 4px 0; color: #666;"><strong>Plan:</strong> ${planName}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Amount:</strong> $${formattedAmount}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Date:</strong> ${date}</p>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 16px;">
            You now have full access to all premium features including AI-powered game analysis, 
            real-time odds tracking, and our Ask AI chatbot.
          </p>
          
          <a href="https://thinkbetai.com/games" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Start Exploring
          </a>
          
          <p style="font-size: 14px; color: #888; margin-top: 32px;">
            If you have any questions, simply reply to this email and we'll be happy to help.
          </p>
          
          <p style="font-size: 14px; color: #888;">
            — The ThinkBetAI Team
          </p>
        </div>
      `,
    });
    logStep("User receipt email sent", { to: userEmail });
  } catch (err) {
    logStep("Failed to send user email", { error: err });
  }

  // Send notification to admin
  if (adminEmail) {
    try {
      await resend.emails.send({
        from: "ThinkBetAI <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `💰 New Payment - ${planName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #22c55e; margin-bottom: 24px;">New Payment Received! 💰</h1>
            
            <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 4px 0; color: #666;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin: 4px 0; color: #666;"><strong>Plan:</strong> ${planName}</p>
              <p style="margin: 4px 0; color: #666;"><strong>Amount:</strong> $${formattedAmount}</p>
              <p style="margin: 4px 0; color: #666;"><strong>Date:</strong> ${date}</p>
            </div>
          </div>
        `,
      });
      logStep("Admin notification email sent", { to: adminEmail });
    } catch (err) {
      logStep("Failed to send admin email", { error: err });
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get payment intent ID from request body
    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) throw new Error("Payment intent ID is required");

    logStep("Verifying payment intent", { paymentIntentId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve and verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
    }

    // Verify the payment belongs to this user
    if (paymentIntent.metadata.supabase_user_id !== user.id) {
      throw new Error("Payment does not belong to this user");
    }

    const planId = paymentIntent.metadata.plan_id;
    const planName = PLAN_NAMES[planId] || paymentIntent.metadata.plan_name || "Premium Plan";

    logStep("Payment verified", { 
      status: paymentIntent.status,
      planId,
      amount: paymentIntent.amount
    });

    // Update user profile to grant access
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        has_access: true,
        access_type: planId,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Error updating profile", { error: updateError });
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    logStep("Profile updated successfully");

    // Send confirmation emails
    if (user.email) {
      await sendEmails(user.email, planId, planName, paymentIntent.amount);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        planId,
        message: "Payment confirmed and access granted" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
