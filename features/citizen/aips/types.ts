import type { Sector } from "@/lib/repos/aip";

export type AipListItem = {
  id: string;
  lguName: string;
  title: string;
  year: string;
  publishedDate: string;
  budget: string;
  projectsCount: number;
  description: string;
};

export type AipProjectSector = Sector;

export type AipProjectRow = {
  id: string;
  sector: AipProjectSector;
  aipReferenceCode: string;
  programDescription: string;
  totalAmount: string;
};

export type AccountabilityPerson = {
  name: string;
  role?: string;
  office?: string;
};

export type AipAccountability = {
  uploadedBy?: AccountabilityPerson | null;
  reviewedBy?: AccountabilityPerson | null;
  approvedBy?: AccountabilityPerson | null;
  uploadDate?: string;
  approvalDate?: string;
};

export type CommentPlaceholder = {
  id: string;
  name: string;
  barangay: string;
  timestamp: string;
  content: string;
};

export type AipDetails = AipListItem & {
  subtitle: string;
  pdfFilename: string;
  summary: string;
  detailedDescriptionIntro: string;
  detailedBullets: string[];
  detailedClosing: string;
  projectRows: AipProjectRow[];
  placeholderComments: CommentPlaceholder[];
  accountability: AipAccountability;
};
