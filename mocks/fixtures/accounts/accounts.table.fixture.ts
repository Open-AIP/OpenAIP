type AccountTab = "officials" | "citizens";
type AccountStatus = "active" | "suspended" | "deactivated";
type AccountRole = "barangay_official" | "city_official" | "citizen";

type AccountRecord = {
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
  suspensionEndDate?: string;
};

export const ACCOUNTS_TABLE: AccountRecord[] = [
  {
    id: "acct_official_maria_santos",
    tab: "officials",
    fullName: "Maria Santos",
    email: "maria.santos@barangay1.gov.ph",
    role: "barangay_official",
    lguAssignment: "Barangay 1",
    officeDepartment: "Office of the Barangay Captain",
    status: "active",
    lastLogin: "2026-02-10 09:30 AM",
    createdDate: "2025-01-15",
  },
  {
    id: "acct_official_jose_reyes",
    tab: "officials",
    fullName: "Jose Reyes",
    email: "jose.reyes@cityhall.gov.ph",
    role: "city_official",
    lguAssignment: "City Hall",
    officeDepartment: "City Planning Office",
    status: "active",
    lastLogin: "2026-02-09 02:15 PM",
    createdDate: "2025-02-01",
  },
  {
    id: "acct_official_ana_garcia",
    tab: "officials",
    fullName: "Ana Garcia",
    email: "ana.garcia@barangay2.gov.ph",
    role: "barangay_official",
    lguAssignment: "Barangay 2",
    officeDepartment: "Barangay Council",
    status: "suspended",
    lastLogin: "2026-01-28 11:45 AM",
    createdDate: "2024-12-10",
    suspensionReason: "Verification needed for updated appointment documents.",
    suspensionEndDate: "",
  },
  {
    id: "acct_official_pedro_cruz",
    tab: "officials",
    fullName: "Pedro Cruz",
    email: "pedro.cruz@barangay1.gov.ph",
    role: "barangay_official",
    lguAssignment: "Barangay 1",
    officeDepartment: "Barangay Secretary Office",
    status: "deactivated",
    lastLogin: "2025-12-15 04:20 PM",
    createdDate: "2024-11-05",
  },
  {
    id: "acct_official_carmen_lopez",
    tab: "officials",
    fullName: "Carmen Lopez",
    email: "carmen.lopez@cityhall.gov.ph",
    role: "city_official",
    lguAssignment: "City Hall",
    officeDepartment: "Finance Department",
    status: "active",
    lastLogin: "2026-02-10 08:00 AM",
    createdDate: "2025-01-20",
  },
  {
    id: "acct_citizen_rafael_santos",
    tab: "citizens",
    fullName: "Rafael Santos",
    email: "rafael.santos@email.com",
    role: "citizen",
    lguAssignment: "Barangay 1",
    officeDepartment: "—",
    status: "active",
    lastLogin: "2026-02-08 07:12 PM",
    createdDate: "2025-06-14",
  },
  {
    id: "acct_citizen_liza_mercado",
    tab: "citizens",
    fullName: "Liza Mercado",
    email: "liza.mercado@email.com",
    role: "citizen",
    lguAssignment: "Barangay 2",
    officeDepartment: "—",
    status: "active",
    lastLogin: "2026-02-07 05:30 PM",
    createdDate: "2025-05-02",
  },
  {
    id: "acct_citizen_joanna_lim",
    tab: "citizens",
    fullName: "Joanna Lim",
    email: "joanna.lim@email.com",
    role: "citizen",
    lguAssignment: "Barangay 1",
    officeDepartment: "—",
    status: "suspended",
    lastLogin: "2026-01-30 10:05 AM",
    createdDate: "2025-03-11",
    suspensionReason: "Temporary suspension pending account review.",
    suspensionEndDate: "",
  },
];
