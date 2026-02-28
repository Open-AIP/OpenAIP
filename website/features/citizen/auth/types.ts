export type CitizenAuthStep =
  | "welcome"
  | "email_password"
  | "verify_otp"
  | "complete_profile";

export type CitizenAuthMode = "login" | "signup";

export type CitizenAuthVariant = "signup_cta" | "login_cta";

export type CitizenAccountProfile = {
  fullName: string;
  email: string;
  firstName: string;
  lastName: string;
  barangay: string;
  city: string;
  province: string;
};
