export type LguType =
  | "region"
  | "province"
  | "city"
  | "municipality"
  | "barangay";

export type BarangayParentType = "city" | "municipality";
export type LguStatus = "active" | "deactivated";

export type LguRecord = {
  id: string;
  type: LguType;
  name: string;
  code: string;

  parentType?: LguType | null;
  parentId?: string | null;
  parentName?: string | null;

  regionId?: string | null;
  regionName?: string | null;
  provinceId?: string | null;
  provinceName?: string | null;
  cityId?: string | null;
  cityName?: string | null;
  municipalityId?: string | null;
  municipalityName?: string | null;

  isIndependent?: boolean | null;

  status: LguStatus;
  updatedAt: string; // YYYY-MM-DD
};

export type CreateLguInput = {
  type: LguType;
  name: string;
  code: string;

  regionId?: string | null;
  provinceId?: string | null;

  parentType?: BarangayParentType | null;
  parentId?: string | null;

  isIndependent?: boolean | null;
};

export type UpdateLguInput = Partial<
  Pick<CreateLguInput, "name" | "code" | "regionId" | "provinceId" | "parentType" | "parentId" | "isIndependent">
>;

