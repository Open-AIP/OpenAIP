import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next } = await searchParams;
  const params = new URLSearchParams({ auth: "login" });

  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    params.set("next", next);
  }

  redirect(`/?${params.toString()}`);
}
