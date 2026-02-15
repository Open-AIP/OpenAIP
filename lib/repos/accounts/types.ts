export type AccountTab = "officials" | "citizens";
export type AccountStatus = "active" | "deactivated";

export type AccountRole =
  | "admin"
  | "barangay_official"
  | "city_official"
  | "municipal_official"
  | "citizen";

export type OfficialRole =
  | "barangay_official"
  | "city_official"
  | "municipal_official";

export type AccountScopeType = "none" | "barangay" | "city" | "municipality";
export type LguScopeType = Exclude<AccountScopeType, "none">;

export type AccountRecord = {
  id: string;
  tab: AccountTab;
  fullName: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  isActive: boolean;
  lguScopeType: AccountScopeType;
  lguScopeId: string | null;
  lguAssignment: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  invitedAt: string | null;
  emailConfirmedAt: string | null;
  invitationPending: boolean;
  canResendInvite: boolean;
};

export type LguOption = {
  key: string;
  scopeType: LguScopeType;
  id: string;
  label: string;
  isActive: boolean;
};

export type AccountListInput = {
  tab: AccountTab;
  query?: string;
  role?: AccountRole | "all";
  status?: AccountStatus | "all";
  lguKey?: string | "all";
  page?: number;
  pageSize?: number;
};

export type AccountListResult = {
  rows: AccountRecord[];
  total: number;
  page: number;
  pageSize: number;
  roleOptions: AccountRole[];
  lguOptions: LguOption[];
};

export type CreateOfficialAccountInput = {
  fullName: string;
  email: string;
  role: OfficialRole;
  scopeType: LguScopeType;
  scopeId: string;
};

export type UpdateAccountInput = {
  fullName: string;
  role: AccountRole;
  scopeType: AccountScopeType;
  scopeId: string | null;
};

