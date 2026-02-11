type LguType = "city" | "barangay";
type LguStatus = "active" | "deactivated";

type LguRecord = {
  id: string;
  type: LguType;
  name: string;
  code: string;
  parentCityId?: string | null;
  parentCityName?: string | null;
  status: LguStatus;
  updatedAt: string;
};

export const LGUS_TABLE: LguRecord[] = [
  {
    id: "lgu_city_qc",
    type: "city",
    name: "Quezon City",
    code: "QC-2024",
    parentCityId: null,
    parentCityName: null,
    status: "active",
    updatedAt: "2026-01-15",
  },
  {
    id: "lgu_brg_qc_001",
    type: "barangay",
    name: "Barangay 1",
    code: "BRG-001-QC",
    parentCityId: "lgu_city_qc",
    parentCityName: "Quezon City",
    status: "active",
    updatedAt: "2026-02-01",
  },
  {
    id: "lgu_brg_qc_002",
    type: "barangay",
    name: "Barangay 2",
    code: "BRG-002-QC",
    parentCityId: "lgu_city_qc",
    parentCityName: "Quezon City",
    status: "active",
    updatedAt: "2026-01-28",
  },
  {
    id: "lgu_city_mnl",
    type: "city",
    name: "Manila City",
    code: "MNL-2024",
    parentCityId: null,
    parentCityName: null,
    status: "active",
    updatedAt: "2026-01-20",
  },
  {
    id: "lgu_brg_mnl_003",
    type: "barangay",
    name: "Barangay San Miguel",
    code: "BRG-003-MNL",
    parentCityId: "lgu_city_mnl",
    parentCityName: "Manila City",
    status: "deactivated",
    updatedAt: "2025-12-10",
  },
];
