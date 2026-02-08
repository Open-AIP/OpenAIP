import { notFound } from "next/navigation";
import CitySubmissionReviewDetail from "@/features/submissions/views/city-submission-review-detail";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAipSubmissionsReviewRepo } from "@/features/submissions/data/submissionsReview.repo.selector";

export default async function CitySubmissionAipReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ aipId: string }>;
  searchParams: Promise<{ mode?: string; result?: string }>;
}) {
  const { aipId } = await params;
  const { mode, result } = await searchParams;

  const actor = await getActorContext();
  const repo = getAipSubmissionsReviewRepo();

  if (mode === "review") {
    await repo.startReviewIfNeeded({ aipId, actor });
  }

  const detail = await repo.getSubmissionAipDetail({ aipId, actor });
  if (!detail) return notFound();

  return (
    <CitySubmissionReviewDetail
      aip={detail.aip}
      latestReview={detail.latestReview}
      mode={mode}
      result={result}
    />
  );
}
