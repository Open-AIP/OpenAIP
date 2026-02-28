import { getCitizenAipRepo } from "@/lib/repos/citizen-aips";
import { toAipListItems } from "@/features/citizen/aips/data/aips.data";
import CitizenAipsListView from "@/features/citizen/aips/views/citizen-aips-list-view";

export const dynamic = "force-dynamic";

export default async function CitizenAipsPage() {
  const repo = getCitizenAipRepo();
  const records = await repo.listPublishedAips();
  const items = toAipListItems(records);

  return <CitizenAipsListView items={items} />;
}
