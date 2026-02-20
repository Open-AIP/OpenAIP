import LguShell from "@/components/layout/lgu-shell";
import { getUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";

const BarangayLayout = async ({children} : {children: React.ReactNode}) => {
  const userData = await getUser().catch(() => {
    redirect("/barangay/sign-in");
  });

  if (!userData) {
    redirect("/barangay/sign-in");
  }

  const { fullName, role, scopeName } = userData;

  if (role !== "barangay_official") {
    redirect("/barangay/unauthorized");
  }
  
  return (
    <LguShell 
      variant="barangay" 
      userName={fullName}
      roleLabel="Barangay Official"
      scopeDisplayName={scopeName ?? undefined}
    >
      {children}
    </LguShell>
  );
}

export default BarangayLayout;
