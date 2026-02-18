import { CommentsView } from "@/features/feedback";
import { getUser } from "@/lib/actions/auth.actions";
import { mapUserToActorContext } from "@/lib/domain/actor-context";
import { redirect } from "next/navigation";

const BarangayComments = async () => {
  const user = await getUser().catch(() => {
    redirect("/barangay/sign-in");
  });

  if (!user) {
    redirect("/barangay/sign-in");
  }

  const actor = mapUserToActorContext(user);
  if (!actor || actor.scope.kind !== "barangay") {
    redirect("/barangay/unauthorized");
  }

  return (
    <div>
      <CommentsView scope="barangay" lguId={actor.scope.id ?? null} />
    </div>
  );
}

export default BarangayComments;
