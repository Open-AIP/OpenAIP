import AccountView from "@/feature/account/account-view";
import { getUser } from "@/lib/actions/auth.actions";

export default async function CityAccount() {
  const { fullName, email, userRole, userLocale } = await getUser();

  const position =
    userRole === "citizen"
      ? "Citizen"
      : userRole === "city"
      ? "City Official"
      : "Official";

  const office = userLocale || "City Hall";

  return (
    <AccountView
      user={{
        fullName,
        email,
        position,
        office,
      }}
    />
  );
}