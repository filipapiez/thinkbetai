// Shared admin authentication helper for edge functions.
// Allows two valid call patterns:
//   1. Authenticated user with the 'admin' role in public.user_roles
//   2. Internal cron call with header X-Cron-Secret matching CRON_SECRET env var
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface AdminAuthResult {
  ok: boolean;
  status: number;
  reason?: string;
  userId?: string;
  viaCron?: boolean;
}

export async function requireAdminOrCron(req: Request): Promise<AdminAuthResult> {
  // 1. Cron secret path (server-to-server)
  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    return { ok: true, status: 200, viaCron: true };
  }

  // 2. JWT + admin role path
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, reason: "Missing Authorization header" };
  }
  const token = authHeader.slice(7).trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return { ok: false, status: 401, reason: "Invalid token" };
  }
  const userId = userData.user.id;

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: roleRow, error: roleErr } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleErr) {
    return { ok: false, status: 500, reason: "Role lookup failed" };
  }
  if (!roleRow) {
    return { ok: false, status: 403, reason: "Admin role required" };
  }
  return { ok: true, status: 200, userId };
}

export function unauthorizedResponse(result: AdminAuthResult, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: result.reason || "Unauthorized" }),
    { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
