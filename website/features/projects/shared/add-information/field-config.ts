import { PROJECT_STATUS_VALUES } from "@/features/projects/types";

export type FieldType = "text" | "textarea" | "select" | "date" | "file";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  options?: readonly string[] | string[];
  gridColumn?: "full" | "half";
};

export const healthFieldConfig: FieldConfig[] = [
  // Pre-filled (disabled) fields
  {
    name: "month",
    label: "Month",
    type: "select",
    disabled: true,
    required: true,
    gridColumn: "half",
    options: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
  },
  {
    name: "year",
    label: "Year",
    type: "select",
    disabled: true,
    required: true,
    gridColumn: "half",
    options: Array.from({ length: 6 }, (_, i) => String(2024 + i)),
  },
  {
    name: "projectName",
    label: "Health Project Name",
    type: "text",
    placeholder: "Enter project name",
    disabled: true,
    required: true,
    gridColumn: "full",
  },
  {
    name: "description",
    label: "Program Description",
    type: "textarea",
    placeholder: "Provide a detailed description of the health project...",
    disabled: true,
    required: true,
    gridColumn: "full",
  },
  
  // Editable fields
  {
    name: "totalTargetParticipants",
    label: "Total Target Participants",
    type: "text",
    placeholder: "Enter number of participants",
    required: true,
    gridColumn: "half",
  },
  {
    name: "targetParticipants",
    label: "Target Participants",
    type: "text",
    placeholder: "e.g., Senior Citizens, Children, All Residents",
    required: true,
    gridColumn: "half",
  },
  {
    name: "budgetAllocated",
    label: "Budget Allocated (₱)",
    type: "text",
    placeholder: "Enter budget amount",
    required: true,
    gridColumn: "half",
  },
  {
    name: "implementingOffice",
    label: "Implementing Office",
    type: "select",
    disabled: true,
    required: true,
    gridColumn: "half",
    options: [
      "Barangay Health Office",
      "Barangay Council",
      "Barangay Nutrition Office",
    ],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    gridColumn: "half",
    options: PROJECT_STATUS_VALUES,
  },
];

export const infraFieldConfig: FieldConfig[] = [
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    required: true,
    gridColumn: "half",
  },
  {
    name: "targetCompletionDate",
    label: "Target Completion Date",
    type: "date",
    required: true,
    gridColumn: "half",
  },
  {
    name: "projectName",
    label: "Infrastructure Project Name",
    type: "text",
    placeholder: "Enter project name",
    disabled: true,
    required: true,
    gridColumn: "full",
  },
  {
    name: "description",
    label: "Project Description",
    type: "textarea",
    placeholder: "Provide a detailed description of the infrastructure project...",
    disabled: true,
    required: true,
    gridColumn: "full",
  },
  {
    name: "implementingOffice",
    label: "Implementing Office",
    type: "select",
    disabled: true,
    required: true,
    gridColumn: "half",
    options: [
      "Barangay Engineering Office",
      "Barangay Council",
      "City Engineering Office",
    ],
  },
  {
    name: "fundingSource",
    label: "Funding Source",
    type: "select",
    disabled: true,
    required: true,
    gridColumn: "half",
    options: [
      "Local Government Fund",
      "Infrastructure Development Fund",
      "National Assistance",
    ],
  },
  {
    name: "contractorName",
    label: "Contractor Name",
    type: "text",
    placeholder: "Enter contractor name",
    required: true,
    gridColumn: "full",
  },
  {
    name: "contractCost",
    label: "Contract Cost (₱)",
    type: "text",
    placeholder: "Enter contract cost",
    required: true,
    gridColumn: "half",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    gridColumn: "half",
    options: PROJECT_STATUS_VALUES,
  },
];
