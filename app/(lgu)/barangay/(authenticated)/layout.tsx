import LguShell from "@/components/layout/lgu-shell";

const BarangayLayout = ({children} : {children: React.ReactNode}) => {
  return <LguShell variant="barangay">{children}</LguShell>;
}

export default BarangayLayout;