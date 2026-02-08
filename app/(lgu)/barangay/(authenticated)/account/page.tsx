import AccountView from "@/features/account/account-view";
import { getUser } from "@/lib/actions/auth.actions";

export default async function BarangayAccount() {
  const { fullName, email, userRole, userLocale } = await getUser();

  // If you have more user fields (position/office), map them here.
  // For now, follow your current available fields.
  const position =
    userRole === "citizen"
      ? "Citizen"
      : userRole === "barangay"
      ? "Barangay Official"
      : "Official";

  const office = userLocale || "—";

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
