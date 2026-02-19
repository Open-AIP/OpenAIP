import type { Json } from "@/lib/contracts/databasev2";
import { formatDate } from "@/lib/formatting";
import type {
  AipRecord,
  BarangayRecord,
  CityRecord,
  ModerationActionRecord,
  MunicipalityRecord,
  ProfileRecord,
  ProjectRecord,
  ProjectUpdateDetailsModel,
  ProjectUpdateRecord,
  ProjectUpdateRowModel,
  ProjectUpdateStatus,
  ProjectUpdateType,
} from "@/lib/repos/feedback-moderation-project-updates/types";

type UpdateMetadata = {
  update_title?: string;
  update_caption?: string;
  update_body?: string;
  progress_percent?: number;
  attendance_count?: number;
  media_urls?: string[];
  update_type?: string;
  uploader_name?: string;
  uploader_email?: string;
  uploader_position?: string;
};

type ActionMetadata = {
  reason?: string;
  violation_category?: string;
};

const asMetadata = (metadata: Json): UpdateMetadata => {
  if (metadata && typeof metadata === "object") return metadata as UpdateMetadata;
  return {};
};

const asActionMetadata = (metadata: Json): ActionMetadata => {
  if (metadata && typeof metadata === "object") return metadata as ActionMetadata;
  return {};
};

const normalizeUpdateType = (value?: string | null): ProjectUpdateType => {
  if (!value) return "Update";
  const normalized = value.toLowerCase();
  if (normalized.includes("photo")) return "Photo";
  return "Update";
};

const normalizeStatus = (action?: ModerationActionRecord | null): ProjectUpdateStatus => {
  if (!action) return "Active";
  if (action.action === "project_update_removed") return "Removed";
  if (action.action === "project_update_flagged") return "Flagged";
  return "Active";
};

const getLguName = (
  aip: AipRecord | undefined,
  cities: CityRecord[],
  barangays: BarangayRecord[],
  municipalities: MunicipalityRecord[]
) => {
  if (!aip) return "â€”";
  if (aip.city_id) {
    return cities.find((row) => row.id === aip.city_id)?.name ?? "City";
  }
  if (aip.municipality_id) {
    return municipalities.find((row) => row.id === aip.municipality_id)?.name ?? "Municipality";
  }
  if (aip.barangay_id) {
    return barangays.find((row) => row.id === aip.barangay_id)?.name ?? "Barangay";
  }
  return "â€”";
};

const getLatestAction = (actions: ModerationActionRecord[]) =>
  actions
    .slice()
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] ?? null;

export function mapProjectUpdatesToRows(input: {
  updates: ProjectUpdateRecord[];
  actions: ModerationActionRecord[];
  projects: ProjectRecord[];
  aips: AipRecord[];
  profiles: ProfileRecord[];
  cities: CityRecord[];
  barangays: BarangayRecord[];
  municipalities: MunicipalityRecord[];
}): ProjectUpdateRowModel[] {
  const actionMap = new Map<string, ModerationActionRecord[]>();
  input.actions.forEach((action) => {
    if (!action.entity_id) return;
    const list = actionMap.get(action.entity_id) ?? [];
    list.push(action);
    actionMap.set(action.entity_id, list);
  });

  return input.updates.map((update) => {
    const metadata = asMetadata(update.metadata);
    const project = input.projects.find((row) => row.id === update.entity_id);
    const aip = input.aips.find((row) => row.id === project?.aip_id);
    const lguName = getLguName(aip, input.cities, input.barangays, input.municipalities);
    const profile = input.profiles.find((row) => row.id === update.actor_id);
    const actions = actionMap.get(update.id) ?? [];
    const latestAction = getLatestAction(actions);
    const status = normalizeStatus(latestAction);
    const mediaUrls = Array.isArray(metadata.media_urls) ? metadata.media_urls : [];

    const updateType = normalizeUpdateType(
      metadata.update_type ?? (mediaUrls.length ? "photo" : "update")
    );

    const uploaderName = metadata.uploader_name ?? profile?.full_name ?? "Unknown";
    const uploaderPosition = metadata.uploader_position;
    const uploadedBy = uploaderPosition ? `${uploaderName} (${uploaderPosition})` : uploaderName;

    return {
      id: update.id,
      previewUrl: mediaUrls[0] ?? null,
      title: metadata.update_title ?? project?.program_project_description ?? "Project Update",
      caption: metadata.update_caption ?? null,
      lguName,
      uploadedBy,
      type: updateType,
      status,
      date: formatDate(update.created_at),
    };
  });
}

export function mapProjectUpdateToDetails(input: {
  update: ProjectUpdateRecord;
  actions: ModerationActionRecord[];
  project?: ProjectRecord | undefined;
  aip?: AipRecord | undefined;
  profile?: ProfileRecord | undefined;
  cities: CityRecord[];
  barangays: BarangayRecord[];
  municipalities: MunicipalityRecord[];
}): ProjectUpdateDetailsModel {
  const metadata = asMetadata(input.update.metadata);
  const latestAction = getLatestAction(input.actions);
  const status = normalizeStatus(latestAction);
  const actionMeta = latestAction ? asActionMetadata(latestAction.metadata) : {};
  const lguName = getLguName(input.aip, input.cities, input.barangays, input.municipalities);

  const uploaderName = metadata.uploader_name ?? input.profile?.full_name ?? "Unknown";
  const uploaderEmail = metadata.uploader_email ?? input.profile?.email ?? null;
  const uploaderPosition = metadata.uploader_position ?? null;

  const mediaUrls = Array.isArray(metadata.media_urls) ? metadata.media_urls : [];

  return {
    id: input.update.id,
    projectTitle: input.project?.program_project_description ?? "Project Update",
    lguName,
    updateTitle: metadata.update_title ?? "Project Update",
    updateCaption: metadata.update_caption ?? null,
    updateContent: metadata.update_body ?? "No update content provided.",
    progressPercent: typeof metadata.progress_percent === "number" ? metadata.progress_percent : null,
    attendanceCount: typeof metadata.attendance_count === "number" ? metadata.attendance_count : null,
    attachments: mediaUrls,
    uploadedByName: uploaderName,
    uploadedByPosition: uploaderPosition,
    uploadedByEmail: uploaderEmail,
    uploadedAt: formatDate(input.update.created_at),
    status,
    removedReason: status === "Removed" ? actionMeta.reason ?? null : null,
    violationCategory: actionMeta.violation_category ?? null,
  };
}
