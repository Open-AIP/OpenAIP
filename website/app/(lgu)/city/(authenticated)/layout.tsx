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

  const { fullName, email, role, scopeName, officeLabel } = userData;

  if (role !== "city_official") {
    redirect("/city/unauthorized");
  }

  const position = role === "city_official" ? "City Official" : "Official";
  const office = officeLabel || "City Hall";

  return (
    <LguShell 
      variant="city" 
      userName={fullName}
      roleLabel="City Official"
      scopeDisplayName={scopeName ?? undefined}
      accountProfile={{
        fullName,
        email,
        position,
        office,
        role: "city",
      }}
    >
      {children}
    </LguShell>
  )
}

export default CityLayout




