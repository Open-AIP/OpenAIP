import LguShell from "@/components/layout/lgu-shell";
import { ScopeProvider } from "@/features/shared/providers/scope";
import { getUser } from "@/lib/actions/auth.actions";
import { normalizeToDbRole, routeRoleToDbRole } from "@/lib/auth/roles";
import { mapUserToActorContext } from "@/lib/domain/actor-context";
import { buildScopeContextValue } from "@/lib/domain/scope-context";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const CityLayout = async ({children} : {children: React.ReactNode}) => {
  const userData = await getUser().catch(() => {
    redirect("/city/sign-in");
  });

  if (!userData) {
    redirect("/city/sign-in");
  }

  const { fullName, userRole, userLocale } = userData;
  const normalizedRole = normalizeToDbRole(userRole);

  if (!normalizedRole || normalizedRole !== routeRoleToDbRole("city")) {
    redirect("/city/unauthorized");
  }

  const actor = mapUserToActorContext(userData);
  const scopeContext = buildScopeContextValue({
    actor,
    fallbackRole: normalizedRole,
    fallbackScope: "city",
    userLocale,
  });

  return (
    <ScopeProvider value={scopeContext}>
      <LguShell 
        variant="city" 
        userName={fullName}
        roleLabel="City Official"
      >
        {children}
      </LguShell>
    </ScopeProvider>
  )
}

export default CityLayout




