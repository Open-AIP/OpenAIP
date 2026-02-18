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
import { FormField } from "./form-field";
import { healthFieldConfig, infraFieldConfig } from "./field-config";
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
  month?: string;
  year?: string;
  name?: string;
  description?: string;
  implementingOffice?: string;
  fundingSource?: string;
};

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
  kind,
  breadcrumb,
  uploader,
  projectInfo,
}: {
  kind: ProjectKind;
  breadcrumb: BreadcrumbItem[];
  uploader: UploaderInfo;
  projectInfo?: ProjectInfo;
}) {
  const router = useRouter();
  const [fileError, setFileError] = React.useState<string | null>(null);

  // Select schema and config based on project type
  const schema = kind === "health" ? healthAddInfoSchema : infraAddInfoSchema;
  const fieldConfig = kind === "health" ? healthFieldConfig : infraFieldConfig;
  const schemaForResolver =
    schema as unknown as Parameters<typeof zodResolver>[0];
  const resolver =
    zodResolver(schemaForResolver) as unknown as Resolver<
      HealthAddInfoFormData | InfraAddInfoFormData
    >;

  // Single form controller - replaces all individual useState calls
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<HealthAddInfoFormData | InfraAddInfoFormData>({
    resolver,
    mode: "onChange",
    defaultValues: {
      // Pre-fill disabled fields from projectInfo
      ...(projectInfo?.month && { month: projectInfo.month }),
      ...(projectInfo?.year && { year: projectInfo.year }),
      ...(projectInfo?.name && { projectName: projectInfo.name }),
      ...(projectInfo?.description && { description: projectInfo.description }),
      ...(projectInfo?.implementingOffice && { implementingOffice: projectInfo.implementingOffice }),
      ...(projectInfo?.fundingSource && { fundingSource: projectInfo.fundingSource }),
      photoFile: null,
    },
  });

  const photoFile = watch("photoFile");

  /**
   * Submission handler - separated from UI logic
   * This is the boundary where form data becomes business logic
   * 
   * Future: Replace console.log with Supabase insert/update
   */
  const onSubmit: SubmitHandler<HealthAddInfoFormData | InfraAddInfoFormData> = (data) => {
    // Clean payload for submission
    const payload = {
      kind,
      photoFileName: photoFile?.name ?? null,
      ...data,
    };

    console.log("ADD INFO SUBMIT:", payload);

    // TODO: Replace with Supabase mutation
    // await createProjectInfo(payload);
    
    router.back();
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
                          setFileError("File size must be under 5MB.");
                          return;
                        }
                        setFileError(null);
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
              {fileError ? <div className="text-xs text-rose-600">{fileError}</div> : null}
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
            disabled={!isValid}
          >
            Done
          </Button>
        </div>
      </form>
    </div>
  );
}
