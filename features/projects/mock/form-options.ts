export const FORM_OPTIONS = {
  projectKinds: [
    { value: "health", label: "Health" },
    { value: "infrastructure", label: "Infrastructure" },
  ],
  statuses: [
    { value: "planning", label: "Planning" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
  ],
  implementingOffices: [
    { value: "barangay_health", label: "Barangay Health Office" },
    { value: "barangay_engineering", label: "Barangay Engineering Office" },
    { value: "municipal_health", label: "Municipal Health Office" },
    { value: "city_health", label: "City Health Office" },
    { value: "rural_health", label: "Rural Health Unit" },
  ],
  fundingSources: [
    { value: "dev_fund_20", label: "20% Development Fund" },
    { value: "general_fund", label: "General Fund Allocation" },
    { value: "calamity_fund", label: "Calamity Fund" },
    { value: "infrastructure_fund", label: "Infrastructure Fund" },
  ],
};
