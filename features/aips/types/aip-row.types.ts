export type Sector = "Economic Sector" | "Social Sector" | "Other Sector";

/**
 * One row inside the AIP extracted table.
 * Connects to a project via projectRefCode.
 */
export type AipProjectRow = {
  id: string;               // row id
  aipId: string;            // fk → AipHeader.id
  projectRefCode: string;   // fk → ProjectMaster.projectRefCode

  sector: Sector;
  amount: number;

  // What AIP extraction says for the row
  aipDescription: string;
};
