import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams: Promise<{ next?: string; returnTo?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, returnTo } = await searchParams;
  const params = new URLSearchParams({ auth: "login", authStep: "email" });
  const candidate = next ?? returnTo;

  if (typeof candidate === "string" && candidate.startsWith("/") && !candidate.startsWith("//")) {
    params.set("next", candidate);
  }

  redirect(`/?${params.toString()}`);
}
