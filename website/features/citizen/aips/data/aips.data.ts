
import type {
  AipAccountability,
  AipDetails,
  AipListItem,
  AipProjectRow as CitizenProjectRow,
} from "@/features/citizen/aips/types";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { AIP_PROJECT_ROWS_TABLE } from "@/mocks/fixtures/aip/aip-project-rows.table.fixture";
import { AIP_ACCOUNTABILITY_BY_ID } from "@/mocks/fixtures/aip/aip-accountability.fixture";
import { CITIZEN_AIP_COMMENTS } from "@/mocks/fixtures/aip/aip-comments.fixture";
import { AipHeader } from "@/lib/repos/aip/types";
import { formatDate } from "@/lib/formatting";

const DEFAULT_DETAILED_BULLETS = [
  "Road concreting and rehabilitation for key access roads",
  "Drainage and flood mitigation improvements",
  "Multi-purpose community facility upgrades",
  "Public safety equipment and lighting enhancement",
  "Community health and youth development programs",
];

const DEFAULT_SUMMARY =
  "Development and improvement of community infrastructure, social services, and local economic initiatives are prioritized under this annual plan.";

const DEFAULT_DETAILED_INTRO =
  "This comprehensive plan addresses critical development needs through the following priority programs:";

const DEFAULT_DETAILED_CLOSING =
  "These programs are intended to improve quality of life, strengthen service delivery, and ensure inclusive local development.";

const formatCurrency = (amount: number) => `PHP ${amount.toLocaleString("en-US")}`;

const formatPublishedDate = (value: string | undefined) => {
  if (!value) return "TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const getLguName = (aip: AipHeader) => {
  if (aip.scope === "city") return "City of Cabuyao";
  return aip.barangayName ?? "Barangay";
};

const projectCountByAipId = AIP_PROJECT_ROWS_TABLE.reduce<Record<string, number>>((acc, row) => {
  acc[row.aipId] = (acc[row.aipId] ?? 0) + 1;
  return acc;
}, {});

const toCitizenListItem = (aip: AipHeader): AipListItem => {
  const lguName = getLguName(aip);
  const year = String(aip.year);

  return {
    id: aip.id,
    lguName,
    title: `${lguName} - Annual Investment Plan (AIP) ${year}`,
    year,
    publishedDate: formatPublishedDate(aip.publishedAt ?? aip.uploadedAt),
    budget: formatCurrency(aip.budget),
    projectsCount: projectCountByAipId[aip.id] ?? 0,
    description: aip.description,
  };
};

type CitizenProjectSourceRow = {
  id: string;
  sector: CitizenProjectRow["sector"];
  projectRefCode: string;
  aipDescription: string;
  amount: number;
};

const toCitizenProjectRow = (row: CitizenProjectSourceRow): CitizenProjectRow => ({
  id: row.id,
  sector: row.sector,
  aipReferenceCode: row.projectRefCode,
  programDescription: row.aipDescription,
  totalAmount: formatCurrency(row.amount),
});

const SOURCE_AIPS = [...AIPS_TABLE].sort((a, b) => b.year - a.year).slice(0, 5);
const LIST_ITEMS = SOURCE_AIPS.map(toCitizenListItem);
const DETAILS_BY_ID = new Map(AIPS_TABLE.map((aip) => [aip.id, aip]));

export const FISCAL_YEAR_OPTIONS = Array.from(
  new Set(LIST_ITEMS.map((item) => item.year))
).sort((a, b) => Number(b) - Number(a));

export const LGU_OPTIONS = ["All LGUs", ...Array.from(new Set(LIST_ITEMS.map((item) => item.lguName)))];

export const DEFAULT_AIP_ID = LIST_ITEMS[0]?.id ?? AIPS_TABLE[0]?.id ?? "";

export const getCitizenAipList = () => LIST_ITEMS;

export const getCitizenAipDetails = (aipId: string): AipDetails => {
  const header = DETAILS_BY_ID.get(aipId) ?? DETAILS_BY_ID.get(DEFAULT_AIP_ID)!;
  const listItem = toCitizenListItem(header);
  const fixtureAccountability = AIP_ACCOUNTABILITY_BY_ID[header.id as keyof typeof AIP_ACCOUNTABILITY_BY_ID];

  const fallbackAccountability: AipAccountability = {
    uploadedBy: header.uploader
      ? {
          name: header.uploader.name,
          role: header.uploader.role,
        }
      : undefined,
    reviewedBy: null,
    approvedBy: null,
    uploadDate: header.uploadedAt ? formatDate(header.uploadedAt) : undefined,
    approvalDate: header.publishedAt ? formatDate(header.publishedAt) : undefined,
  };

  const accountability: AipAccountability = {
    ...fallbackAccountability,
    ...fixtureAccountability,
    uploadDate: fixtureAccountability?.uploadDate
      ? formatDate(fixtureAccountability.uploadDate)
      : fallbackAccountability.uploadDate,
    approvalDate: fixtureAccountability?.approvalDate
      ? formatDate(fixtureAccountability.approvalDate)
      : fallbackAccountability.approvalDate,
  };

  const rawRows = AIP_PROJECT_ROWS_TABLE.filter((row) => row.aipId === header.id);
  const fallbackRows = rawRows.length ? rawRows : AIP_PROJECT_ROWS_TABLE.slice(0, 6);
  const projectRows = fallbackRows.map(toCitizenProjectRow);

  return {
    ...listItem,
    subtitle: `Annual Investment Plan for Fiscal Year ${listItem.year}`,
    pdfFilename: header.fileName || `Annual_Investment_Plan_${listItem.year}.pdf`,
    summary: header.summaryText ?? DEFAULT_SUMMARY,
    detailedDescriptionIntro: DEFAULT_DETAILED_INTRO,
    detailedBullets: header.detailedBullets ?? DEFAULT_DETAILED_BULLETS,
    detailedClosing: DEFAULT_DETAILED_CLOSING,
    projectRows,
    placeholderComments: CITIZEN_AIP_COMMENTS,
    accountability,
  };
};
