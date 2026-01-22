import LguShell from "@/components/layout/lgu-shell";
import { getUser } from "@/lib/actions/auth.actions";

const BarangayLayout = async ({children} : {children: React.ReactNode}) => {
  const { fullName, userRole } = await getUser();
  
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