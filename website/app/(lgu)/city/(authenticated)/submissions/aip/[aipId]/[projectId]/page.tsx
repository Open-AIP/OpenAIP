import { notFound } from "next/navigation";
import { AipProjectDetailView } from "@/features/aip";
import { getCitySubmissionAipLabel } from "@/features/submissions/presentation/submissions.presentation";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAipProjectRepo } from "@/lib/repos/aip/repo.server";
import { getAipSubmissionsReviewRepo } from "@/lib/repos/submissions/repo.server";

type RouteSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(input: RouteSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      params.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          params.append(key, item);
        }
      }
    }
  }
  return params;
}

export default async function CitySubmissionAipProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ aipId: string; projectId: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const { aipId, projectId } = await params;
  const resolvedSearchParams = await searchParams;
  const actor = await getActorContext();
  const submissionsRepo = getAipSubmissionsReviewRepo();
  const projectRepo = getAipProjectRepo("barangay");

  let submissionDetail:
    | Awaited<ReturnType<typeof submissionsRepo.getSubmissionAipDetail>>
    | null = null;
  let projectDetail: Awaited<ReturnType<typeof projectRepo.getReviewDetail>> | null = null;

  try {
    [submissionDetail, projectDetail] = await Promise.all([
      submissionsRepo.getSubmissionAipDetail({ aipId, actor }),
      projectRepo.getReviewDetail(aipId, projectId),
    ]);
  } catch {
    return notFound();
  }

  if (!submissionDetail || !projectDetail || projectDetail.project.aipId !== aipId) {
    return notFound();
  }

  const aipDisplayLabel = getCitySubmissionAipLabel({
    barangayName: submissionDetail.aip.barangayName,
    year: submissionDetail.aip.year,
  });

  const backParams = toUrlSearchParams(resolvedSearchParams);
  backParams.set("focus", projectId);
  const backQuery = backParams.toString();
  const aipDetailHrefBase = `/city/submissions/aip/${encodeURIComponent(aipId)}`;
  const aipDetailHref = backQuery
    ? `${aipDetailHrefBase}?${backQuery}`
    : aipDetailHrefBase;

  return (
    <AipProjectDetailView
      scope="city"
      aip={submissionDetail.aip}
      detail={projectDetail}
      breadcrumbItems={[
        { label: "Submissions", href: "/city/submissions" },
        { label: aipDisplayLabel, href: aipDetailHref },
        { label: `Project ${projectDetail.project.projectRefCode}` },
      ]}
      forceReadOnly
      showOfficialCommentPanel={false}
      readOnlyMessage="Project editing is disabled because this AIP is owned by a barangay."
    />
  );
}
