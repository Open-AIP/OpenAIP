/**
 * Add Information Page Component
 * 
 * Schema-driven form component for adding information to health and infrastructure projects.
 * Uses Zod validation and react-hook-form for state management.
 * 
 * @module feature/projects/shared/add-information/add-information-page
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { FormField } from "./FormField";
import { healthFieldConfig, infraFieldConfig } from "./field-config";
import { toDateInputValue } from "./date-normalization";
import {
  healthAddInfoSchema,
  infraAddInfoSchema,
  type HealthAddInfoFormData,
  type InfraAddInfoFormData,
} from "./schemas";

/**
 * Project type discriminator
 */
type ProjectKind = "health" | "infrastructure";

/**
 * Breadcrumb navigation item
 */
type BreadcrumbItem = {
  label: string;
  href?: string;
};

/**
 * Uploader information for display
 */
type UploaderInfo = {
  name: string;
  position: string;
  office: string;
};

/**
 * Pre-filled project information (for disabled fields)
 */
type ProjectInfo = {
  name?: string;
  description?: string;
  startDate?: string;
  targetCompletionDate?: string;
  budgetAllocated?: string;
  implementingOffice?: string;
  fundingSource?: string;
};

function normalizeStringValue(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function hasNonEmptyFormValue(formData: FormData, key: string): boolean {
  const current = formData.get(key);
  return typeof current === "string" && current.trim().length > 0;
}

/**
 * AddInformationPage Component
 * 
 * Universal form for adding project information using schema-driven validation.
 * 
 * Features:
 * - Single form state (no manual useState for fields)
 * - Schema-based validation (Zod)
 * - Config-driven field rendering
 * - Automatic validation feedback
 * - Type-safe form data
 * 
 * @param kind - Type of project (health or infrastructure)
 * @param breadcrumb - Navigation breadcrumb items
 * @param uploader - Information about the user adding the data
 * @param projectInfo - Pre-filled project data (optional)
 */
export default function AddInformationPage({
  projectId,
  scope,
  kind,
  breadcrumb,
  uploader,
  projectInfo,
}: {
  projectId: string;
  scope: "barangay" | "city";
  kind: ProjectKind;
  breadcrumb: BreadcrumbItem[];
  uploader: UploaderInfo;
  projectInfo?: ProjectInfo;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const normalizedProjectInfo = React.useMemo(
    () => ({
      name: normalizeStringValue(projectInfo?.name),
      description: normalizeStringValue(projectInfo?.description),
      startDate: toDateInputValue(projectInfo?.startDate),
      targetCompletionDate: toDateInputValue(projectInfo?.targetCompletionDate),
      budgetAllocated: normalizeStringValue(projectInfo?.budgetAllocated),
      implementingOffice: normalizeStringValue(projectInfo?.implementingOffice),
      fundingSource: normalizeStringValue(projectInfo?.fundingSource),
    }),
    [projectInfo]
  );

  // Select schema and config based on project type
  const schema = kind === "health" ? healthAddInfoSchema : infraAddInfoSchema;
  const fieldConfig = kind === "health" ? healthFieldConfig : infraFieldConfig;
  const schemaForResolver =
    schema as unknown as Parameters<typeof zodResolver>[0];
  const resolver =
    zodResolver(schemaForResolver) as unknown as Resolver<
      HealthAddInfoFormData | InfraAddInfoFormData
    >;
  const defaultValues: Record<string, string | File | null | undefined> = {
    photoFile: null,
    projectName: normalizedProjectInfo.name,
    description: normalizedProjectInfo.description,
    startDate: normalizedProjectInfo.startDate,
    targetCompletionDate: normalizedProjectInfo.targetCompletionDate,
    budgetAllocated: normalizedProjectInfo.budgetAllocated,
    implementingOffice: normalizedProjectInfo.implementingOffice,
    fundingSource: normalizedProjectInfo.fundingSource,
  };

  // Single form controller - replaces all individual useState calls
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<HealthAddInfoFormData | InfraAddInfoFormData>({
    resolver,
    mode: "onChange",
    defaultValues: defaultValues as unknown as HealthAddInfoFormData | InfraAddInfoFormData,
  });

  /**
   * Submission handler - separated from UI logic
   * This is the boundary where form data becomes backend persistence input.
   */
  const onSubmit: SubmitHandler<HealthAddInfoFormData | InfraAddInfoFormData> = async (
    data
  ) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const formData = new FormData();
      formData.set("kind", kind);

      for (const [key, value] of Object.entries(data)) {
        if (key === "photoFile") {
          if (value instanceof File) {
            formData.set(key, value);
          }
          continue;
        }

        if (typeof value === "string") {
          formData.set(key, value);
        }
      }

      const requiredPrefilledFields =
        kind === "health"
          ? {
              projectName: normalizedProjectInfo.name,
              description: normalizedProjectInfo.description,
              implementingOffice: normalizedProjectInfo.implementingOffice,
              startDate: normalizedProjectInfo.startDate,
              targetCompletionDate: normalizedProjectInfo.targetCompletionDate,
              budgetAllocated: normalizedProjectInfo.budgetAllocated,
            }
          : {
              projectName: normalizedProjectInfo.name,
              description: normalizedProjectInfo.description,
              implementingOffice: normalizedProjectInfo.implementingOffice,
              fundingSource: normalizedProjectInfo.fundingSource,
              startDate: normalizedProjectInfo.startDate,
              targetCompletionDate: normalizedProjectInfo.targetCompletionDate,
            };

      for (const [key, value] of Object.entries(requiredPrefilledFields)) {
        if (!value) continue;
        if (!hasNonEmptyFormValue(formData, key)) {
          formData.set(key, value);
        }
      }

      const response = await fetch(
        `/api/${scope}/projects/${encodeURIComponent(projectId)}/add-information`,
        {
          method: "POST",
          body: formData,
        }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to save project information.");
      }

      router.refresh();
      router.back();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save project information."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={breadcrumb} />

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Add Information</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Project Information */}
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-6">
            <div className="text-lg font-semibold text-slate-900">Project Information</div>

            {/* Photo Upload - Shared Component */}
            <div className="space-y-2">
              <Label>Project Photo</Label>
              <Controller
                name="photoFile"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <label className="block cursor-pointer">
                    <input
                      {...field}
                      className="hidden"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file && file.size > 5 * 1024 * 1024) {
                          alert("File size must be under 5MB");
                          return;
                        }
                        onChange(file);
                      }}
                    />
                    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center hover:bg-slate-50 transition">
                      <div className="mx-auto h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center">
                        <Upload className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        {value?.name ?? "Click to upload image"}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">PNG, JPG up to 5MB</div>
                    </div>
                  </label>
                )}
              />
            </div>

            {/* Dynamic Fields - Config-driven rendering */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldConfig.map((config) => (
                  <Controller
                    key={config.name}
                    name={config.name as keyof (HealthAddInfoFormData | InfraAddInfoFormData)}
                    control={control}
                    render={({ field }) => (
                      <FormField
                        config={config}
                        register={register}
                        errors={errors}
                        value={field.value as string}
                        onChange={field.onChange}
                      />
                    )}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploader Information */}
        <Card className="border-slate-200 mt-6">
          <CardContent className="p-6">
            <div className="text-lg font-semibold text-slate-900">Uploader Information</div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-slate-500">Name</div>
                <div className="mt-1 font-medium text-slate-900">{uploader.name}</div>
              </div>
              <div>
                <div className="text-slate-500">Position</div>
                <div className="mt-1 font-medium text-slate-900">{uploader.position}</div>
              </div>
              <div>
                <div className="text-slate-500">Office</div>
                <div className="mt-1 font-medium text-slate-900">{uploader.office}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#022437] hover:bg-[#022437]/90"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Done"}
          </Button>
        </div>
        {submitError ? (
          <p className="mt-3 text-sm text-red-600 text-right">{submitError}</p>
        ) : null}
      </form>
    </div>
  );
}
