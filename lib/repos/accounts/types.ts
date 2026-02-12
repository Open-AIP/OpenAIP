export type AccountTab = "officials" | "citizens";
export type AccountStatus = "active" | "suspended" | "deactivated";
export type AccountRole = "barangay_official" | "city_official" | "citizen";

export type AccountRecord = {
  id: string;
  tab: AccountTab;
  fullName: string;
  email: string;
  role: AccountRole;
  lguAssignment: string;
  officeDepartment: string;
  status: AccountStatus;
  lastLogin: string;
  createdDate: string;

  suspensionReason?: string;
  suspensionEndDate?: string; // YYYY-MM-DD
};

export type SetStatusMeta =
  | {
      kind: "suspension";
      reason: string;
      endDate?: string;
    }
  | { kind: "none" };

