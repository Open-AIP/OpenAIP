export type CitizenAuthStep =
  | "welcome"
  | "email_password"
  | "verify_otp"
  | "complete_profile";

export type CitizenAuthMode = "login" | "signup";

export type CitizenAuthVariant = "signup_cta" | "login_cta";
