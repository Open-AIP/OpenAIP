import SubmissionsView from "@/features/submissions/SubmissionsView";
import { getCitySubmissionsFeed } from "@/features/submissions/services/submissionsService";

export default async function CitySubmissionsPage() {
  const data = await getCitySubmissionsFeed();
  return <SubmissionsView data={data} />;
}
