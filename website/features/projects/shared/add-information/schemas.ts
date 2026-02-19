import { z } from "zod";
import { PROJECT_STATUS_VALUES } from "@/features/projects/types";

// Shared validation rules
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const YEARS = Array.from({ length: 6 }, (_, i) => String(2024 + i));

// Health project schema
export const healthAddInfoSchema = z.object({
  // Photo (shared)
  photoFile: z.instanceof(File).nullable().optional(),
  
  // Pre-filled fields (disabled in UI)
  month: z.enum(MONTHS),
  year: z.enum(YEARS as unknown as [string, ...string[]]),
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  implementingOffice: z.string().min(1, "Implementing office is required"),
  
  // Editable fields
  totalTargetParticipants: z.string().min(1, "Total target participants is required"),
  targetParticipants: z.string().min(1, "Target participants is required"),
  budgetAllocated: z.string().min(1, "Budget is required"),
  status: z.enum(PROJECT_STATUS_VALUES),
});

// Infrastructure project schema
export const infraAddInfoSchema = z.object({
  // Photo (shared)
  photoFile: z.instanceof(File).nullable().optional(),
  
  // Pre-filled fields (disabled in UI)
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  implementingOffice: z.string().min(1, "Implementing office is required"),
  fundingSource: z.string().min(1, "Funding source is required"),
  
  // Editable fields
  startDate: z.string().min(1, "Start date is required"),
  targetCompletionDate: z.string().min(1, "Completion date is required"),
  contractorName: z.string().min(1, "Contractor name is required"),
  contractCost: z.string().min(1, "Contract cost is required"),
  status: z.enum(PROJECT_STATUS_VALUES),
});

export type HealthAddInfoFormData = z.infer<typeof healthAddInfoSchema>;
export type InfraAddInfoFormData = z.infer<typeof infraAddInfoSchema>;
