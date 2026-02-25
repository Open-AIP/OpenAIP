export type CitizenAuthStep =
  | "login"
  | "signup_email"
  | "verify_otp"
  | "complete_profile";

export type CitizenAuthMode = "login" | "signup";

export type CitizenAuthVariant = "signup_cta" | "login_cta";
