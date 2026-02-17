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
  updatedAt: string;
};
