import LguShell from "@/components/layout/lgu-shell";
import { getUser } from "@/lib/actions/auth.actions";

const BarangayLayout = async ({children} : {children: React.ReactNode}) => {
  const { fullName, role } = await getUser();
  
  return (
    <LguShell 
      variant="barangay" 
      userName={fullName}
      roleLabel={role === "citizen" ? "Citizen" : "Barangay Official"}
    >
      {children}
    </LguShell>
  );
}

export default BarangayLayout;
