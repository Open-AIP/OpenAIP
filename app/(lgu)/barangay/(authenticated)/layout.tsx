import LguShell from "@/components/layout/lgu-shell";
import { getUser } from "@/lib/actions/auth.actions";
import { normalizeToDbRole, routeRoleToDbRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const BarangayLayout = async ({children} : {children: React.ReactNode}) => {
  const userData = await getUser().catch(() => {
    redirect("/barangay/sign-in");
  });

  if (!userData) {
    redirect("/barangay/sign-in");
  }

  const { fullName, userRole } = userData;
  const normalizedRole = normalizeToDbRole(userRole);

  if (normalizedRole !== routeRoleToDbRole("barangay")) {
    redirect("/barangay/unauthorized");
  }
  
  return (
    <LguShell 
      variant="barangay" 
      userName={fullName}
      roleLabel="Barangay Official"
    >
      {children}
    </LguShell>
  );
}

export default BarangayLayout;
