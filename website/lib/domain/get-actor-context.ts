import { getUser } from "@/lib/actions/auth.actions";
import { mapUserToActorContext, type ActorContext } from "./actor-context";

export async function getActorContext(): Promise<ActorContext | null> {
  try {
    const user = await getUser();
    if (!user) return null;
    return mapUserToActorContext(user);
  } catch {
    return null;
  }
}
