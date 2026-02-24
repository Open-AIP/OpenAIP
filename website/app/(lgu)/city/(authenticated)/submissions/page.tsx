import { SubmissionsView } from "@/features/submissions";
import { getCitySubmissionsFeed } from "@/lib/repos/submissions/queries";

export const dynamic = "force-dynamic";

export default async function CitySubmissionsPage() {
  const data = await getCitySubmissionsFeed();
  return <SubmissionsView data={data} />;
}
