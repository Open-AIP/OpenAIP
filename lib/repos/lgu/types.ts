export type LguType = "city" | "barangay";
export type LguStatus = "active" | "deactivated";

export type LguRecord = {
  id: string;
  type: LguType;
  name: string;
  code: string;

  parentCityId?: string | null;
  parentCityName?: string | null;

  status: LguStatus;
  updatedAt: string; // YYYY-MM-DD
};

export type CreateLguInput = {
  type: LguType;
  name: string;
  code: string;
  parentCityId?: string | null;
  parentCityName?: string | null;
};

export type UpdateLguInput = Partial<
  Pick<LguRecord, "type" | "name" | "code" | "parentCityId" | "parentCityName">
>;

