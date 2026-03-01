export type LguAccountProfile = {
  fullName: string;
  email: string;
  position: string;
  office: string;
  role: "barangay" | "city";
};

export type AdminAccountProfile = {
  fullName: string;
  email: string;
  role: "admin";
};
