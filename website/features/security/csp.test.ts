import { describe, expect, it } from "vitest";
import { withSecurityHeaders } from "@/lib/security/csp";

describe("withSecurityHeaders", () => {
  it("allows inline styles in development while still emitting a style nonce", () => {
    const response = new Response(null);

    withSecurityHeaders(response, {
      isProduction: false,
      nonce: "dev-nonce",
    });

    const csp = response.headers.get("Content-Security-Policy");

    expect(csp).toContain("style-src 'self' 'nonce-dev-nonce' 'unsafe-inline'");
    expect(csp).toContain(
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com/leaflet@1.9.4/dist/images/"
    );
  });

  it("requires a style nonce in production", () => {
    const response = new Response(null);

    withSecurityHeaders(response, {
      isProduction: true,
      nonce: "prod-nonce",
    });

    const csp = response.headers.get("Content-Security-Policy");

    expect(csp).toContain("style-src 'self' 'nonce-prod-nonce'");
    expect(csp).not.toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain(
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com/leaflet@1.9.4/dist/images/"
    );
  });
});
