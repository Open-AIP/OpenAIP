import { CommentsView } from "@/features/feedback";
import { getUser } from "@/lib/actions/auth.actions";
import { mapUserToActorContext } from "@/lib/domain/actor-context";
import { redirect } from "next/navigation";

const CityComments = async () => {
  const user = await getUser().catch(() => {
    redirect("/city/sign-in");
  });

  if (!user) {
    redirect("/city/sign-in");
  }

  const actor = mapUserToActorContext(user);
  if (!actor || actor.scope.kind !== "city") {
    redirect("/city/unauthorized");
  }

  return (
    <div>
      <CommentsView scope="city" lguId={actor.scope.id ?? null} />
    </div>
  );
};

export default CityComments;
