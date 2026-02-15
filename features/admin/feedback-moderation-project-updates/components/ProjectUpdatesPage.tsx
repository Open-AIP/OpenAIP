"use client";

import { useMemo, useState } from "react";
import ProjectUpdatesFiltersRow from "./ProjectUpdatesFiltersRow";
import ProjectUpdatesTable from "./ProjectUpdatesTable";
import SensitiveGuidelinesPanel from "./SensitiveGuidelinesPanel";
import ProjectUpdateDetailsModal from "./modals/ProjectUpdateDetailsModal";
import FlagForReviewModal from "./modals/FlagForReviewModal";
import RemoveUpdateModal from "./modals/RemoveUpdateModal";
import {
  PROJECT_UPDATE_ACTIONS,
  PROJECT_UPDATE_LOGS,
  PROJECT_UPDATE_LGU_MAP,
} from "@/mocks/fixtures/admin/feedback-moderation/projectUpdatesMedia.mock";
import {
  mapProjectUpdateToDetails,
  mapProjectUpdatesToRows,
} from "@/lib/repos/feedback-moderation-project-updates/mappers/project-updates.mapper";
import type { ModerationActionRecord } from "@/lib/repos/feedback-moderation-project-updates/types";

const TYPE_OPTIONS = [
  { value: "all", label: "All Type" },
  { value: "update", label: "Update" },
  { value: "photo", label: "Photo" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "flagged", label: "Flagged" },
  { value: "removed", label: "Removed" },
];

const VIOLATION_OPTIONS = [
  "Attendance Sheets",
  "Government IDs & Signatures",
  "Beneficiary Personal Info",
  "Inappropriate Images",
];

const ADMIN_ACTOR = {
  id: "admin_001",
  role: "admin",
};

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

export default function ProjectUpdatesPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lguFilter, setLguFilter] = useState("all");

  const [actions, setActions] = useState<ModerationActionRecord[]>(PROJECT_UPDATE_ACTIONS);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [flagId, setFlagId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [removeReason, setRemoveReason] = useState("");
  const [removeViolation, setRemoveViolation] = useState("");

  const rows = useMemo(
    () =>
      mapProjectUpdatesToRows({
        updates: PROJECT_UPDATE_LOGS,
        actions,
        projects: PROJECT_UPDATE_LGU_MAP.projects,
        aips: PROJECT_UPDATE_LGU_MAP.aips,
        profiles: PROJECT_UPDATE_LGU_MAP.profiles,
        cities: PROJECT_UPDATE_LGU_MAP.cities,
        barangays: PROJECT_UPDATE_LGU_MAP.barangays,
        municipalities: PROJECT_UPDATE_LGU_MAP.municipalities,
      }),
    [actions]
  );

  const lguOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.lguName))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.type.toLowerCase() !== typeFilter) return false;
      if (statusFilter !== "all" && row.status.toLowerCase() !== statusFilter) return false;
      if (lguFilter !== "all" && row.lguName !== lguFilter) return false;

      if (!loweredQuery) return true;
      const haystack = [row.title, row.caption, row.uploadedBy, row.lguName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(loweredQuery);
    });
  }, [rows, query, typeFilter, statusFilter, lguFilter]);

  const selectedUpdate = PROJECT_UPDATE_LOGS.find((row) => row.id === detailsId) ?? null;
  const selectedActions = actions.filter((row) => row.entity_id === detailsId);
  const selectedProject = PROJECT_UPDATE_LGU_MAP.projects.find(
    (row) => row.id === selectedUpdate?.entity_id
  );
  const selectedAip = PROJECT_UPDATE_LGU_MAP.aips.find((row) => row.id === selectedProject?.aip_id);
  const selectedProfile = PROJECT_UPDATE_LGU_MAP.profiles.find(
    (row) => row.id === selectedUpdate?.actor_id
  );

  const detailsModel = selectedUpdate
    ? mapProjectUpdateToDetails({
        update: selectedUpdate,
        actions: selectedActions,
        project: selectedProject,
        aip: selectedAip,
        profile: selectedProfile,
        cities: PROJECT_UPDATE_LGU_MAP.cities,
        barangays: PROJECT_UPDATE_LGU_MAP.barangays,
        municipalities: PROJECT_UPDATE_LGU_MAP.municipalities,
      })
    : null;

  const resetFlagState = () => {
    setFlagId(null);
    setFlagReason("");
  };

  const resetRemoveState = () => {
    setRemoveId(null);
    setRemoveReason("");
    setRemoveViolation("");
  };

  const handleFlagConfirm = () => {
    if (!flagId) return;
    const next: ModerationActionRecord = {
      id: createId("update_action"),
      actor_id: ADMIN_ACTOR.id,
      actor_role: ADMIN_ACTOR.role,
      action: "project_update_flagged",
      entity_table: "activity_log",
      entity_id: flagId,
      region_id: null,
      province_id: null,
      city_id: null,
      municipality_id: null,
      barangay_id: null,
      metadata: {
        reason: flagReason.trim(),
        violation_category: null,
      },
      created_at: new Date().toISOString(),
    };
    setActions((prev) => [...prev, next]);
    resetFlagState();
  };

  const handleRemoveConfirm = () => {
    if (!removeId) return;
    const next: ModerationActionRecord = {
      id: createId("update_action"),
      actor_id: ADMIN_ACTOR.id,
      actor_role: ADMIN_ACTOR.role,
      action: "project_update_removed",
      entity_table: "activity_log",
      entity_id: removeId,
      region_id: null,
      province_id: null,
      city_id: null,
      municipality_id: null,
      barangay_id: null,
      metadata: {
        reason: removeReason.trim(),
        violation_category: removeViolation || null,
      },
      created_at: new Date().toISOString(),
    };
    setActions((prev) => [...prev, next]);
    resetRemoveState();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-base font-semibold text-slate-900">
          Project Updates & Media Review
        </div>
        <div className="text-sm text-slate-500">
          Review updates and uploaded media for compliance and sensitive content.
        </div>
      </div>

      <ProjectUpdatesFiltersRow
        query={query}
        onQueryChange={setQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        lguFilter={lguFilter}
        onLguChange={setLguFilter}
        typeOptions={TYPE_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        lguOptions={lguOptions}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ProjectUpdatesTable
          rows={filteredRows}
          onViewPreview={(id) => setDetailsId(id)}
          onRemove={(id) => {
            setRemoveId(id);
            setRemoveReason("");
            setRemoveViolation("");
          }}
          onFlag={(id) => {
            setFlagId(id);
            setFlagReason("");
          }}
        />

        <SensitiveGuidelinesPanel />
      </div>

      <ProjectUpdateDetailsModal
        open={detailsId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsId(null);
        }}
        details={detailsModel}
      />

      <FlagForReviewModal
        open={flagId !== null}
        onOpenChange={(open) => {
          if (!open) resetFlagState();
        }}
        reason={flagReason}
        onReasonChange={setFlagReason}
        onConfirm={handleFlagConfirm}
      />

      <RemoveUpdateModal
        open={removeId !== null}
        onOpenChange={(open) => {
          if (!open) resetRemoveState();
        }}
        reason={removeReason}
        onReasonChange={setRemoveReason}
        violationCategory={removeViolation}
        onViolationCategoryChange={setRemoveViolation}
        violationOptions={VIOLATION_OPTIONS}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
