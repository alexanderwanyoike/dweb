import { it, expect } from "vitest";
import { consoleRoutes, primaryRoutes } from "./navigation";
it("keeps technical destinations addressable under a compact primary navigation", () => {
  expect(primaryRoutes.map((route) => route.label)).toEqual([
    "Home",
    "Identity",
    "Apps",
    "Network",
    "Settings",
    "Advanced"
  ]);
  expect(consoleRoutes.map((route) => route.path)).toEqual(
    expect.arrayContaining(["/relays", "/published", "/cache", "/diagnostics"])
  );
  expect(new Set(consoleRoutes.map((route) => route.path)).size).toBe(consoleRoutes.length);
});
