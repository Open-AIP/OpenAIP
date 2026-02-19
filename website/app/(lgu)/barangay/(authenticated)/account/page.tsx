import AccountView from "@/features/account/account-view";
import { getUser } from "@/lib/actions/auth.actions";

export default async function BarangayAccount() {
  const { fullName, email, role, officeLabel } = await getUser();

  const position =
    role === "citizen"
      ? "Citizen"
      : role === "barangay_official"
      ? "Barangay Official"
      : "Official";

  const office = officeLabel || "-";

  return (
    <AccountView
      user={{
        fullName,
        email,
        position,
        office,
        role: "barangay",
        baseURL: "/barangay",
      }}
    />
  );
}
