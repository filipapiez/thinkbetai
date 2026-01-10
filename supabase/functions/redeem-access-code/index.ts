import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RedemptionRequest {
  code: string;
}

// deno-lint-ignore no-explicit-any
async function logAttempt(
  client: any,
  userId: string,
  code: string | null,
  success: boolean,
  reason: string
): Promise<void> {
  try {
    await client.from("access_code_redemption_attempts").insert({
      user_id: userId,
      code,
      success,
      reason,
    });
  } catch (error) {
    console.error("Failed to log redemption attempt:", error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's JWT for auth context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client (for getting user info)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client (for privileged operations)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: RedemptionRequest = await req.json();
    const codeText = body.code?.trim().toUpperCase();

    // Validate input
    if (!codeText || codeText.length < 2 || codeText.length > 50) {
      await logAttempt(serviceClient, user.id, codeText || null, false, "Invalid code format");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: Check recent attempts (max 5 attempts per 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await serviceClient
      .from("access_code_redemption_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", fifteenMinutesAgo);

    if (recentAttempts && recentAttempts >= 5) {
      await logAttempt(serviceClient, user.id, codeText, false, "Rate limited");
      return new Response(
        JSON.stringify({ success: false, error: "Too many attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has already redeemed a code
    const { data: userProfile, error: profileError } = await serviceClient
      .from("profiles")
      .select("promo_used")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      await logAttempt(serviceClient, user.id, codeText, false, "Profile lookup failed");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userProfile?.promo_used) {
      await logAttempt(serviceClient, user.id, codeText, false, "User already redeemed a code");
      return new Response(
        JSON.stringify({ success: false, error: "You have already redeemed a code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate code exists and is active
    const { data: codeRecord, error: codeError } = await serviceClient
      .from("access_codes")
      .select("*")
      .eq("code", codeText)
      .eq("is_active", true)
      .single();

    if (codeError || !codeRecord) {
      await logAttempt(serviceClient, user.id, codeText, false, "Invalid or inactive code");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max uses limit
    if (codeRecord.max_uses !== null && codeRecord.current_uses >= codeRecord.max_uses) {
      await logAttempt(serviceClient, user.id, codeText, false, "Code usage limit reached");
      return new Response(
        JSON.stringify({ success: false, error: "This code has reached its usage limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment usage counter
    const { error: updateCodeError } = await serviceClient
      .from("access_codes")
      .update({ current_uses: codeRecord.current_uses + 1 })
      .eq("id", codeRecord.id);

    if (updateCodeError) {
      console.error("Failed to update code usage:", updateCodeError);
      await logAttempt(serviceClient, user.id, codeText, false, "Failed to update code usage");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to redeem code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user profile with access
    const { error: updateProfileError } = await serviceClient
      .from("profiles")
      .update({
        has_access: true,
        access_type: "free_code",
        subscription_status: "active",
        promo_used: codeText,
      })
      .eq("user_id", user.id);

    if (updateProfileError) {
      console.error("Failed to update profile:", updateProfileError);
      // Rollback code usage
      await serviceClient
        .from("access_codes")
        .update({ current_uses: codeRecord.current_uses })
        .eq("id", codeRecord.id);
      
      await logAttempt(serviceClient, user.id, codeText, false, "Failed to update profile");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to grant access" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful redemption
    await logAttempt(serviceClient, user.id, codeText, true, "Success");

    console.log(`Access code ${codeText} redeemed successfully by user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
