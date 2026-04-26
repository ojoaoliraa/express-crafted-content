import { supabase } from "@/integrations/supabase/client";

/**
 * Decide para onde mandar o usuário depois do login.
 * - /onboarding se ainda não completou
 * - /app caso contrário
 */
export async function getPostLoginPath(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return "/onboarding";
  return data.onboarding_complete ? "/app" : "/onboarding";
}
