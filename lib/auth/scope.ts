export type CanonicalScopeKind = "barangay" | "city" | "municipality" | "none";

export type LguScopeKind = Exclude<CanonicalScopeKind, "none">;

