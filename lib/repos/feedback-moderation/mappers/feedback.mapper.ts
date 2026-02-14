import type { FeedbackKind } from "@/lib/contracts/databasev2";
import type {
  Dbv2ActivityLogRow,
  Dbv2FeedbackRow,
  FeedbackModerationDataset,
} from "@/lib/repos/feedback-moderation/types";

export type FeedbackModerationRow = {
  id: string;
  kind: FeedbackKind;
  commentPreview: string;
  commentBody: string;
  submittedByName: string;
  submittedByEmail?: string | null;
  lguName: string;
  projectName: string;
  violationCategory: string | null;
  status: "Visible" | "Hidden";
  submittedDate: string;
  submittedDateLabel: string;
};

const toDateLabel = (iso: string) => iso.slice(0, 10);

const getLatestHiddenLog = (
  activity: Dbv2ActivityLogRow[],
  feedbackId: string
): Dbv2ActivityLogRow | null => {
  const matching = activity.filter(
    (log) =>
      log.entity_table === "feedback" &&
      log.entity_id === feedbackId &&
      log.action === "feedback_hidden"
  );

  if (!matching.length) return null;
  return matching.reduce((latest, current) =>
    new Date(current.created_at).getTime() > new Date(latest.created_at).getTime()
      ? current
      : latest
  );
};

const readViolationCategory = (log: Dbv2ActivityLogRow | null) => {
  if (!log || !log.metadata || typeof log.metadata !== "object") return null;
  const metadata = log.metadata as Record<string, unknown>;
  const category = metadata.violation_category;
  return typeof category === "string" ? category : null;
};

const resolveLguName = (dataset: FeedbackModerationDataset, profileId: string | null) => {
  if (!profileId) return "Unknown LGU";
  const profile = dataset.profiles.find((row) => row.id === profileId);
  if (!profile) return "Unknown LGU";

  if (profile.barangay_id) {
    const barangay = dataset.barangays.find((row) => row.id === profile.barangay_id);
    return barangay?.name ?? "Unknown Barangay";
  }

  if (profile.city_id) {
    const city = dataset.cities.find((row) => row.id === profile.city_id);
    return city?.name ?? "Unknown City";
  }

  if (profile.municipality_id) {
    const municipality = dataset.municipalities.find((row) => row.id === profile.municipality_id);
    return municipality?.name ?? "Unknown Municipality";
  }

  return "Unknown LGU";
};

const resolveProjectName = (dataset: FeedbackModerationDataset, feedback: Dbv2FeedbackRow) => {
  if (feedback.target_type === "project" && feedback.project_id) {
    const project = dataset.projects.find((row) => row.id === feedback.project_id);
    return project?.program_project_description ?? "Unknown Project";
  }

  if (feedback.target_type === "aip" && feedback.aip_id) {
    const aip = dataset.aips.find((row) => row.id === feedback.aip_id);
    return aip ? `AIP ${aip.fiscal_year}` : "AIP";
  }

  return "N/A";
};

const resolveSubmittedBy = (dataset: FeedbackModerationDataset, authorId: string | null) => {
  const profile = authorId
    ? dataset.profiles.find((row) => row.id === authorId)
    : null;

  return {
    name: profile?.full_name ?? "Anonymous",
    email: profile?.email ?? null,
  };
};

export const mapFeedbackModerationRows = (
  dataset: FeedbackModerationDataset
): FeedbackModerationRow[] => {
  return dataset.feedback
    .map((feedback) => {
      const { name, email } = resolveSubmittedBy(dataset, feedback.author_id);
      const lguName = resolveLguName(dataset, feedback.author_id);
      const projectName = resolveProjectName(dataset, feedback);
      const status: "Visible" | "Hidden" = feedback.is_public ? "Visible" : "Hidden";
      const hiddenLog = feedback.is_public
        ? null
        : getLatestHiddenLog(dataset.activity, feedback.id);
      const violationCategory = feedback.is_public ? null : readViolationCategory(hiddenLog);

      return {
        id: feedback.id,
        kind: feedback.kind,
        commentPreview: feedback.body,
        commentBody: feedback.body,
        submittedByName: name,
        submittedByEmail: email,
        lguName,
        projectName,
        violationCategory,
        status,
        submittedDate: feedback.created_at,
        submittedDateLabel: toDateLabel(feedback.created_at),
      } satisfies FeedbackModerationRow;
    })
    .sort(
      (a, b) =>
        new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
    );
};
