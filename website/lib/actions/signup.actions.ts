"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { RoleType } from "@/lib/contracts/databasev2";

type RouteRole = "citizen" | "barangay" | "city" | "municipality" | "admin";

type OfficialEligibilityResult =
  | {
      ok: true;
      fullName: string;
      locale: string;
      role: RoleType;
    }
  | {
      ok: false;
      message: string;
    };

function mapRouteRoleToRoleType(routeRole: RouteRole): RoleType | null {
  if (routeRole === "barangay") return "barangay_official";
  if (routeRole === "city") return "city_official";
  if (routeRole === "municipality") return "municipal_official";
  return null;
}

export async function verifyOfficialInviteEligibilityAction(input: {
  email: string;
  routeRole: RouteRole;
}): Promise<OfficialEligibilityResult> {
  const email = input.email.trim().toLowerCase();
  const expectedRole = mapRouteRoleToRoleType(input.routeRole);

  if (!expectedRole) {
    return { ok: false, message: "Invalid official role." };
  }

  if (!email) {
    return { ok: false, message: "Email is required." };
  }

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return { ok: false, message: "Server is not configured for invite validation." };
  }

  const { data, error } = await admin
    .from("profiles")
    .select(
      "role,full_name,is_active,email,barangay:barangays!profiles_barangay_id_fkey(name),city:cities!profiles_city_id_fkey(name),municipality:municipalities!profiles_municipality_id_fkey(name)"
    )
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    return { ok: false, message: "Failed to validate invitation." };
  }

  if (!data) {
    return { ok: false, message: "Unregistered Email. Contact Admin." };
  }

  if (!data.is_active) {
    return { ok: false, message: "Account is deactivated. Contact Admin." };
  }

  if (data.role !== expectedRole) {
    return { ok: false, message: "Role Mismatch" };
  }

  const fullName =
    typeof data.full_name === "string" && data.full_name.trim()
      ? data.full_name.trim()
      : email;

  const barangayName =
    data.barangay && typeof data.barangay === "object" && "name" in data.barangay
      ? (data.barangay.name as string | null)
      : null;
  const cityName =
    data.city && typeof data.city === "object" && "name" in data.city
      ? (data.city.name as string | null)
      : null;
  const municipalityName =
    data.municipality && typeof data.municipality === "object" && "name" in data.municipality
      ? (data.municipality.name as string | null)
      : null;

  const locale = barangayName ?? cityName ?? municipalityName ?? "";

  return {
    ok: true,
    fullName,
    locale,
    role: data.role as RoleType,
  };
}
