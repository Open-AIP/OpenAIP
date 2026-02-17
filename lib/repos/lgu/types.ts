import type { LguRecord, LguType } from "@/lib/types/domain/lgu.domain";

export type { LguType, LguStatus, LguRecord } from "@/lib/types/domain/lgu.domain";

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

