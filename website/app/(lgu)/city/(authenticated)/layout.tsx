import LguShell from "@/components/layout/lgu-shell";
import { getUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";

const CityLayout = async ({children} : {children: React.ReactNode}) => {
  const userData = await getUser().catch(() => {
    redirect("/city/sign-in");
  });

  if (!userData) {
    redirect("/city/sign-in");
  }

  const { fullName, role, scopeName } = userData;

  if (role !== "city_official") {
    redirect("/city/unauthorized");
  }

  return (
    <LguShell 
      variant="city" 
      userName={fullName}
      roleLabel="City Official"
      scopeDisplayName={scopeName ?? undefined}
    >
      {children}
    </LguShell>
  )
}

export default CityLayout




