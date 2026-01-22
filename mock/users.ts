export type MockRole = "Barangay Official" | "City Official" | "Admin" | "Citizen";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: MockRole;
  office: string; // e.g., "Barangay Health Office"
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "u-brgy-juan",
    name: "Juan Dela Cruz",
    email: "juan@barangay.gov.ph",
    role: "Barangay Official",
    office: "Barangay Health Office",
  },
  {
    id: "u-city-maria",
    name: "Maria Santos",
    email: "maria@city.gov.ph",
    role: "City Official",
    office: "City Planning Office",
  },
];
