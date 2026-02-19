import { getUser } from "@/lib/actions/auth.actions";
import { mapUserToActorContext } from "./actor-context";

export async function getActorContext() {
  try {
    const user = await getUser();
    if (!user) return null;
    return mapUserToActorContext(user);
  } catch {
    return null;
  }
}
