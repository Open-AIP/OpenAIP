import { createClient } from "../supabase/server";

export const getUser = async () => {

  const baseURL = process.env.BASE_URL;

  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not set');
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if(error || !data) {
    throw new Error(
      error?.message ||
      'Failed to fetch user info.'
    )
  }

  const fullName = data?.claims?.user_metadata?.fullName;
  const email = data?.claims?.user_metadata?.email;
  const userRole = data?.claims?.user_metadata?.access?.role;
  const userLocale = data?.claims?.user_metadata?.access?.locale;
  const claims = data?.claims as unknown as Record<string, unknown> | undefined;
  const userId =
    claims && typeof claims.sub === "string"
      ? claims.sub
      : claims && typeof claims.user_id === "string"
      ? claims.user_id
      : claims && typeof claims.id === "string"
      ? claims.id
      : undefined;

  return {
    userId,
    id: userId,
    fullName,
    email,
    userRole,
    userLocale,
    baseURL
  };
}
