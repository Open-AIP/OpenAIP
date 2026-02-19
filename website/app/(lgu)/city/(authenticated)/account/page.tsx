import AccountView from "@/features/account/account-view";
import { getUser } from "@/lib/actions/auth.actions";

export default async function CityAccount() {
  const { fullName, email, role, officeLabel } = await getUser();

  const position =
    role === "citizen"
      ? "Citizen"
      : role === "city_official"
      ? "City Official"
      : "Official";

  const office = officeLabel || "City Hall";

  return (
    <AccountView
      user={{
        fullName,
        email,
        position,
        office,
        role: "city",
        baseURL: "/city",
      }}
    />
  );
}
