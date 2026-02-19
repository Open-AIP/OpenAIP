import { supabaseServer } from "../supabase/server";
import type { RoleType } from "@/lib/contracts/databasev2";

type RouteRole = "citizen" | "barangay" | "city" | "municipality" | "admin";

export type GetUserResult = {
  userId: string;
  id: string;
  fullName: string;
  email: string;
  role: RoleType;
  routeRole: RouteRole;
  officeLabel: string;
  barangayId: string | null;
  cityId: string | null;
  municipalityId: string | null;
  isActive: boolean;
  // Compatibility aliases for existing call sites.
  userRole: RouteRole;
  userLocale: string;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
  baseURL: string;
};

function isRoleType(value: unknown): value is RoleType {
  return (
    value === "citizen" ||
    value === "barangay_official" ||
    value === "city_official" ||
    value === "municipal_official" ||
    value === "admin"
  );
}

function toRouteRole(role: RoleType): RouteRole {
  if (role === "barangay_official") return "barangay";
  if (role === "city_official") return "city";
  if (role === "municipal_official") return "municipality";
  return role;
}

function toOfficeLabel(role: RoleType): string {
  if (role === "city_official") return "City Hall";
  if (role === "municipal_official") return "Municipal Hall";
  if (role === "barangay_official" || role === "citizen") return "Barangay Hall";
  return "System Administration";
}

export const getUser = async (): Promise<GetUserResult> => {

  const baseURL = process.env.BASE_URL;

  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not set');
  }

  const supabase = await supabaseServer();

  const { data: authData, error: authError } = await supabase.auth.getUser();

  const authUser = authData.user;
  if(authError || !authUser?.id) {
    throw new Error(
      authError?.message ||
      'Failed to fetch user info.'
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,full_name,email,barangay_id,city_id,municipality_id,is_active")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(
      profileError?.message || "Failed to fetch profile info."
    );
  }

  if (!isRoleType(profile.role)) {
    throw new Error("Invalid profile role.");
  }

  if (!profile.is_active) {
    throw new Error("Inactive user profile.");
  }

  const role = profile.role;
  const userId = profile.id;
  const routeRole = toRouteRole(role);
  const officeLabel = toOfficeLabel(role);
  const fullName = profile.full_name ?? authUser.email ?? "";
  const email = profile.email ?? authUser.email ?? "";

  return {
    userId,
    id: userId,
    fullName,
    email,
    role,
    routeRole,
    officeLabel,
    barangayId: profile.barangay_id,
    cityId: profile.city_id,
    municipalityId: profile.municipality_id,
    isActive: profile.is_active,
    userRole: routeRole,
    userLocale: officeLabel,
    barangay_id: profile.barangay_id,
    city_id: profile.city_id,
    municipality_id: profile.municipality_id,
    baseURL
  };
}
