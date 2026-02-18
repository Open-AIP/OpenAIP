import LguShell from "@/components/layout/lgu-shell";
import { getUser } from "@/lib/actions/auth.actions";
import { normalizeToDbRole, routeRoleToDbRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const CityLayout = async ({children} : {children: React.ReactNode}) => {
  const userData = await getUser().catch(() => {
    redirect("/city/sign-in");
  });

  if (!userData) {
    redirect("/city/sign-in");
  }

  const { fullName, userRole } = userData;
  const normalizedRole = normalizeToDbRole(userRole);

  if (normalizedRole !== routeRoleToDbRole("city")) {
    redirect("/city/unauthorized");
  }

  return (
    <LguShell 
      variant="city" 
      userName={fullName}
      roleLabel="City Official"
    >
      {children}
    </LguShell>
  )
}

export default CityLayout




