function maskPart(value: string): string {
  if (!value) return "";
  if (value.length <= 2) return `${value[0] ?? ""}***`;
  return `${value.slice(0, 2)}***`;
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed.includes("@")) {
    return "***";
  }

  const [localPart, domainPart] = trimmed.split("@");
  const [domainName = "", domainTld = ""] = domainPart.split(".");

  const maskedLocal = maskPart(localPart);
  const maskedDomain = maskPart(domainName);
  const maskedTld = domainTld ? `${domainTld.slice(0, 2)}**` : "**";

  return `${maskedLocal}@${maskedDomain}.${maskedTld}`;
}
