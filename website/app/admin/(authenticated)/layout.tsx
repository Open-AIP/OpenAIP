import AdminShell from "@/components/layout/admin-shell";
import { getUser } from "@/lib/actions/auth.actions";
import { normalizeToDbRole, routeRoleToDbRole } from "@/lib/auth/roles";
import { isTempAdminBypassEnabled } from "@/lib/auth/dev-bypass";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (isTempAdminBypassEnabled()) {
    return (
      <AdminShell profileName="Admin User" profileRole="System Administration">
        {children}
      </AdminShell>
    );
  }

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

  return (
    <AdminShell profileName={userData.fullName} profileRole={userData.officeLabel}>
      {children}
    </AdminShell>
  );
}
