import { redirect } from "next/navigation";

type SignUpPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { next } = await searchParams;
  const params = new URLSearchParams({ auth: "signup", authStep: "email" });

  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    params.set("next", next);
  }

  redirect(`/?${params.toString()}`);
}
