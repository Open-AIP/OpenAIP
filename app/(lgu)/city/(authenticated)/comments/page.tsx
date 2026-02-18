import { CommentsView } from "@/features/feedback";
import { getUser } from "@/lib/actions/auth.actions";
import { normalizeToDbRole, routeRoleToDbRole } from "@/lib/auth/roles";
import { mapUserToActorContext } from "@/lib/domain/actor-context";
import { redirect } from "next/navigation";

const CityComments = async () => {
  const user = await getUser().catch(() => {
    redirect("/city/sign-in");
  });

  if (!user) {
    redirect("/city/sign-in");
  }

  const normalizedRole = normalizeToDbRole(user.userRole);
  if (!normalizedRole || normalizedRole !== routeRoleToDbRole("city")) {
    redirect("/city/unauthorized");
  }

  const actor = mapUserToActorContext(user);
  const lguId = actor?.scope.kind === "city" ? actor.scope.id ?? null : null;

  return (
    <div>
      <CommentsView scope="city" lguId={lguId} />
    </div>
  );
};

export default CityComments;
