/**
 * Post Update Form Component
 * 
 * Form for creating new project updates.
 * Collects update information including title, description, progress,
 * attendance count, and optional photos.
 * 
 * @module feature/projects/shared/update-view/post-update-form
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ProjectUpdateUi } from "@/features/projects/types";
import { Upload, Image as ImageIcon } from "lucide-react";

/**
 * Clamps a number between 0 and 100
 * @param n - Number to clamp
 * @returns Clamped value between 0-100
 */
function clamp01to100(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * PostUpdateForm Component
 * 
 * Form for posting project updates.
 * Features:
 * - Title and description inputs
 * - Progress percentage slider (0-100%)
 * - Attendance count input
 * - Photo upload (max 5 photos, PNG/JPG)
 * - Form validation
 * - Auto-generated date
 * - Memory management for photo URLs
 * 
 * Validation rules:
 * - Title: minimum 3 characters
 * - Description: minimum 10 characters
 * - Attendance: required
 * 
 * @param onCreate - Callback when a new update is created
 */
export default function PostUpdateForm({
  projectId,
  scope,
  projectKind,
  currentProgressPercent,
  currentParticipantsReached,
  participantsTargetTotal,
  onCreate,
}: {
  projectId: string;
  scope: "barangay" | "city";
  projectKind: "health" | "infrastructure";
  currentProgressPercent: number;
  currentParticipantsReached: number;
  participantsTargetTotal?: number | null;
  onCreate: (update: ProjectUpdateUi) => void;
}) {
  const router = useRouter();
  const baselineProgress = clamp01to100(currentProgressPercent);
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [progress, setProgress] = React.useState<number>(baselineProgress);
  const [attendance, setAttendance] = React.useState<string>("");
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const requiresAttendance = projectKind === "health";
  const currentParticipantsReachedDisplay = Math.max(
    0,
    Math.trunc(currentParticipantsReached)
  );
  const participantsTargetDisplay =
    participantsTargetTotal === null || participantsTargetTotal === undefined
      ? null
      : Math.max(0, Math.trunc(participantsTargetTotal));
  const normalizedProgress = clamp01to100(progress);
  const currentProgressAtLimit = baselineProgress >= 100;
  const isProgressForward = normalizedProgress > baselineProgress;

  React.useEffect(() => {
    setProgress(baselineProgress);
  }, [baselineProgress]);

  function onPickPhotos(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).filter((file) => file.size > 0).slice(0, 5);
    setPhotos(picked);
  }

  async function submit() {
    if (isSubmitting) return;
    if (currentProgressAtLimit) return;
    if (title.trim().length < 3) return;
    if (desc.trim().length < 10) return;
    if (requiresAttendance && !attendance) return;
    if (!isProgressForward) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("description", desc.trim());
      formData.set("progressPercent", String(normalizedProgress));
      if (requiresAttendance && attendance.trim()) {
        formData.set("attendanceCount", attendance.trim());
      }
      for (const photo of photos) {
        formData.append("photos", photo);
      }

      const response = await fetch(
        `/api/${scope}/projects/${encodeURIComponent(projectId)}/updates`,
        {
          method: "POST",
          body: formData,
        }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        update?: ProjectUpdateUi;
      };

      if (!response.ok || !payload.update) {
        if (response.ok && !payload.update) {
          router.refresh();
        }
        throw new Error(payload.message ?? "Failed to post project update.");
      }

      onCreate(payload.update);

      setTitle("");
      setDesc("");
      setProgress(normalizedProgress);
      setAttendance("");
      setPhotos([]);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to post project update."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled =
    isSubmitting ||
    currentProgressAtLimit ||
    title.trim().length < 3 ||
    desc.trim().length < 10 ||
    (requiresAttendance && !attendance) ||
    !isProgressForward;

  return (
    <Card className="border-slate-200 h-fit">
      <CardHeader className="pb-0">
        <div className="text-base font-semibold text-slate-900">Post Update</div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <Label>Update Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., First vaccination drive completed"
          />
        </div>

        <div className="space-y-2">
          <Label>Description *</Label>
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe what was accomplished in this update..."
            className="min-h-[90px]"
          />
          <div className="text-xs text-slate-500">Minimum 10 characters</div>
        </div>

        <div className="space-y-2">
          <Label>Progress Percentage</Label>
          <div className="text-xs text-slate-500">
            Current progress: {baselineProgress}%. New update must be greater than{" "}
            {baselineProgress}%.
          </div>
          {currentProgressAtLimit ? (
            <div className="text-xs text-amber-700">
              Current progress is already 100%. You can no longer post a higher progress
              update.
            </div>
          ) : null}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>0%</span>
            <span className="text-slate-700 font-medium">{normalizedProgress}%</span>
            <span>100%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(clamp01to100(Number(e.target.value)))}
            className="w-full"
          />
        </div>

        {requiresAttendance ? (
          <div className="space-y-2">
            <Label>Attendance Count *</Label>
            {participantsTargetDisplay !== null ? (
              <div className="text-xs text-slate-500">
                Current participants reached:{" "}
                <span className="font-medium text-slate-700">
                  {currentParticipantsReachedDisplay.toLocaleString()} /{" "}
                  {participantsTargetDisplay.toLocaleString()}
                </span>
              </div>
            ) : null}
            <Input
              value={attendance}
              onChange={(e) => setAttendance(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="Number of participants"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Upload Photos (Optional)</Label>

          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg"
              multiple
              className="hidden"
              onChange={(e) => onPickPhotos(e.target.files)}
            />

            <div className="rounded-xl border-2 border-slate-200 bg-white p-6 text-center hover:bg-slate-50 transition">
              <div className="mx-auto h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center">
                <Upload className="h-6 w-6 text-slate-400" />
              </div>
              <div className="mt-3 text-sm text-slate-600">Click to upload photos</div>
              <div className="mt-1 text-xs text-slate-400">Max 5 photos, PNG or JPG</div>
            </div>
          </label>

          {photos.length ? (
            <div className="flex flex-wrap gap-2">
              {photos.map((f, idx) => (
                <div
                  key={`${idx}-${f.name}-${f.size}`}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                >
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                  <span className="max-w-[190px] truncate">{f.name}</span>
                </div>
              ))}            </div>
          ) : null}
        </div>

        <Button
          className="w-full bg-[#022437] hover:bg-[#022437]/90"
          onClick={submit}
          disabled={disabled}
        >
          {isSubmitting ? "Posting..." : "Post Update"}
        </Button>
        {submitError ? (
          <p className="text-sm text-red-600">{submitError}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
