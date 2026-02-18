import AdminShell from "@/components/layout/admin-shell";
import { getUser } from "@/lib/actions/auth.actions";
import { normalizeToDbRole, routeRoleToDbRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userData = await getUser().catch(() => {
    redirect("/admin/sign-in");
  });

  if (!userData) {
    redirect("/admin/sign-in");
  }

  const normalizedRole = normalizeToDbRole(userData.userRole);
  if (normalizedRole !== routeRoleToDbRole("admin")) {
    redirect("/admin/unauthorized");
  }

  return <AdminShell>{children}</AdminShell>;
}
