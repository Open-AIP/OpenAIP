import { notFound } from "next/navigation";
import { CitySubmissionReviewDetail } from "@/features/submissions";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAipSubmissionsReviewRepo } from "@/lib/repos/submissions/repo.server";

export default async function CitySubmissionAipReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ aipId: string }>;
  searchParams: Promise<{
    mode?: string;
    intent?: string;
    result?: string;
    focus?: string;
  }>;
}) {
  const { aipId } = await params;
  const { mode, intent, result, focus } = await searchParams;

  const actor = await getActorContext();
  const repo = getAipSubmissionsReviewRepo();

  const detail = await repo.getSubmissionAipDetail({ aipId, actor });
  if (!detail) return notFound();

  return (
    <CitySubmissionReviewDetail
      aip={detail.aip}
      latestReview={detail.latestReview}
      actorUserId={actor?.userId ?? null}
      actorRole={actor?.role ?? null}
      mode={mode}
      intent={intent}
      result={result}
      focusedRowId={focus}
    />
  );
}
