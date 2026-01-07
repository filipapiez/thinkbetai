import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PROMO_CODE = "GETIT";

interface SignupRequest {
  email: string;
  password: string;
  promoCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, promoCode }: SignupRequest = await req.json();

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize promo code
    const normalizedPromo = (promoCode || "").trim().toUpperCase();

    // Validate promo code if provided
    if (normalizedPromo && normalizedPromo !== VALID_PROMO_CODE) {
      return new Response(
        JSON.stringify({ error: "Invalid promo code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error("Auth error:", authError);
      if (authError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "This email is already registered. Please log in." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to create account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    const isPro = normalizedPromo === VALID_PROMO_CODE;
    const promoUsed = isPro ? VALID_PROMO_CODE : null;

    // Update the profile (created by trigger) with promo status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        has_access: isPro,
        access_type: isPro ? "promo" : null,
        subscription_status: isPro ? "active" : "inactive",
        promo_used: promoUsed,
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail the signup, profile was created by trigger
    }

    // Send emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const createdAt = new Date().toISOString();

      // Email to admin
      if (adminEmail) {
        try {
          await resend.emails.send({
            from: "ThinkBetAI <onboarding@resend.dev>",
            to: [adminEmail],
            subject: "New ThinkBetAI Signup",
            html: `
              <h2>New User Signup</h2>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Plan:</strong> ${isPro ? "PRO (Free forever – promo)" : "No plan (Free / Locked)"}</p>
              <p><strong>Promo code used:</strong> ${promoUsed || "None"}</p>
              <p><strong>Signup date:</strong> ${createdAt}</p>
            `,
          });
          console.log("Admin notification email sent");
        } catch (emailError) {
          console.error("Failed to send admin email:", emailError);
        }
      }

      // Welcome email to user
      try {
        await resend.emails.send({
          from: "ThinkBetAI <onboarding@resend.dev>",
          to: [email],
          subject: "Welcome to ThinkBetAI",
          html: `
            <h2>Welcome to ThinkBetAI!</h2>
            <p>Thanks for signing up. If you have any questions or need help, reply to this email and we'll be happy to help.</p>
            <p>— ThinkBetAI Team</p>
          `,
        });
        console.log("Welcome email sent to user");
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping emails");
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        isPro,
        message: isPro 
          ? "Account created with PRO access!" 
          : "Account created! Choose a plan to get started.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
