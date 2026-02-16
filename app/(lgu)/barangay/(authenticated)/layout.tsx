import LguShell from "@/components/layout/lgu-shell";
import { getUser } from "@/lib/actions/auth.actions";
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

  if (userRole !== "barangay") {
    redirect("/barangay/unauthorized");
  }
  
  return (
    <LguShell 
      variant="barangay" 
      userName={fullName}
      roleLabel={userRole === "citizen" ? "Citizen" : "Barangay Official"}
    >
      {children}
    </LguShell>
  );
}

export default BarangayLayout;