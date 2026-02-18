import { CommentsView } from "@/features/feedback";
import { getUser } from "@/lib/actions/auth.actions";
import { normalizeToDbRole, routeRoleToDbRole } from "@/lib/auth/roles";
import { mapUserToActorContext } from "@/lib/domain/actor-context";
import { redirect } from "next/navigation";

const BarangayComments = async () => {
  const user = await getUser().catch(() => {
    redirect("/barangay/sign-in");
  });

  if (!user) {
    redirect("/barangay/sign-in");
  }

  const normalizedRole = normalizeToDbRole(user.userRole);
  if (!normalizedRole || normalizedRole !== routeRoleToDbRole("barangay")) {
    redirect("/barangay/unauthorized");
  }

  const actor = mapUserToActorContext(user);
  const lguId = actor?.scope.kind === "barangay" ? actor.scope.id ?? null : null;

  return (
    <div>
      <CommentsView scope="barangay" lguId={lguId} />
    </div>
  );
}

export default BarangayComments;
