import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("next redirects: about-us aliases", () => {
  it("redirects legacy about routes to /about-us", async () => {
    const redirects =
      typeof nextConfig.redirects === "function" ? await nextConfig.redirects() : [];

    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/about",
          destination: "/about-us",
          permanent: false,
        }),
        expect.objectContaining({
          source: "/aboutus",
          destination: "/about-us",
          permanent: false,
        }),
      ])
    );
  });
});
