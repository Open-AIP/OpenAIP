"use client";

import { useEffect, useMemo, useState } from "react";
import ProjectUpdatesFiltersRow from "./ProjectUpdatesFiltersRow";
import ProjectUpdatesTable from "./ProjectUpdatesTable";
import SensitiveGuidelinesPanel from "./SensitiveGuidelinesPanel";
import ProjectUpdateDetailsModal from "./modals/ProjectUpdateDetailsModal";
import FlagForReviewModal from "./modals/FlagForReviewModal";
import RemoveUpdateModal from "./modals/RemoveUpdateModal";
import { getFeedbackModerationProjectUpdatesRepo } from "@/lib/repos/feedback-moderation-project-updates";
import {
  mapProjectUpdateToDetails,
  mapProjectUpdatesToRows,
} from "@/lib/mappers/feedback-moderation-project-updates";
import type {
  ModerationActionRecord,
  ProjectUpdateRecord,
} from "@/lib/repos/feedback-moderation-project-updates/types";

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

const toScope = (update: ProjectUpdateRecord) => ({
  region_id: update.region_id,
  province_id: update.province_id,
  city_id: update.city_id,
  municipality_id: update.municipality_id,
  barangay_id: update.barangay_id,
});

export default function ProjectUpdatesPage() {
  const repo = useMemo(() => getFeedbackModerationProjectUpdatesRepo(), []);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lguFilter, setLguFilter] = useState("all");

  const [seedData, setSeedData] = useState<Awaited<ReturnType<typeof repo.getSeedData>> | null>(
    null
  );
  const [actions, setActions] = useState<ModerationActionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [flagId, setFlagId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [removeReason, setRemoveReason] = useState("");
  const [removeViolation, setRemoveViolation] = useState("");

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextSeed = await repo.getSeedData();
        if (!isActive) return;
        setSeedData(nextSeed);
        setActions(nextSeed.actions);
      } catch (loadError) {
        if (!isActive) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load project update moderation data."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isActive = false;
    };
  }, [repo]);

  const rows = useMemo(
    () =>
      seedData
        ? mapProjectUpdatesToRows({
            updates: seedData.updates,
            actions,
            projects: seedData.lguMap.projects,
            aips: seedData.lguMap.aips,
            profiles: seedData.lguMap.profiles,
            cities: seedData.lguMap.cities,
            barangays: seedData.lguMap.barangays,
            municipalities: seedData.lguMap.municipalities,
          })
        : [],
    [actions, seedData]
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

  const selectedUpdate = seedData
    ? seedData.updates.find((row) => row.id === detailsId) ?? null
    : null;
  const selectedActions = actions.filter((row) => row.entity_id === detailsId);
  const selectedProject = seedData?.lguMap.projects.find(
    (row) => row.id === selectedUpdate?.entity_id
  );
  const selectedAip = seedData?.lguMap.aips.find((row) => row.id === selectedProject?.aip_id);
  const selectedProfile = seedData?.lguMap.profiles.find(
    (row) => row.id === selectedUpdate?.actor_id
  );

  const detailsModel = selectedUpdate && seedData
    ? mapProjectUpdateToDetails({
        update: selectedUpdate,
        actions: selectedActions,
        project: selectedProject,
        aip: selectedAip,
        profile: selectedProfile,
        cities: seedData.lguMap.cities,
        barangays: seedData.lguMap.barangays,
        municipalities: seedData.lguMap.municipalities,
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
    if (!flagId || !seedData) return;
    const targetUpdate = seedData.updates.find((row) => row.id === flagId);
    if (!targetUpdate) return;

    setActionPending(true);
    setActionError(null);

    repo
      .flagUpdate({
        updateId: flagId,
        reason: flagReason.trim(),
        violationCategory: null,
        scope: toScope(targetUpdate),
      })
      .then((nextSeed) => {
        setSeedData(nextSeed);
        setActions(nextSeed.actions);
        resetFlagState();
      })
      .catch((actionErr) => {
        setActionError(
          actionErr instanceof Error
            ? actionErr.message
            : "Failed to flag this project update."
        );
      })
      .finally(() => {
        setActionPending(false);
      });
  };

  const handleRemoveConfirm = () => {
    if (!removeId || !seedData) return;
    const targetUpdate = seedData.updates.find((row) => row.id === removeId);
    if (!targetUpdate) return;

    setActionPending(true);
    setActionError(null);

    repo
      .removeUpdate({
        updateId: removeId,
        reason: removeReason.trim(),
        violationCategory: removeViolation || null,
        scope: toScope(targetUpdate),
      })
      .then((nextSeed) => {
        setSeedData(nextSeed);
        setActions(nextSeed.actions);
        resetRemoveState();
      })
      .catch((actionErr) => {
        setActionError(
          actionErr instanceof Error
            ? actionErr.message
            : "Failed to remove this project update."
        );
      })
      .finally(() => {
        setActionPending(false);
      });
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

      {loading ? (
        <div className="text-sm text-slate-500">Loading project updates...</div>
      ) : error ? (
        <div className="text-sm text-rose-600">{error}</div>
      ) : (
        <>
          {actionError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}

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
        </>
      )}

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
        isSubmitting={actionPending}
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
        isSubmitting={actionPending}
      />
    </div>
  );
}
