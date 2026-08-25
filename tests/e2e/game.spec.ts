import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

test("room peers derive the same live prompt", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: "mesh-speed-type",
  });

  try {
    await expect(a.locator(".race-card h2")).toBeVisible();
    await expect(b.locator(".race-card h2")).toBeVisible();
    await expect(a.locator(".race-card h2")).toHaveText(
      await b.locator(".race-card h2").innerText(),
    );
    await a.getByRole("button", { name: /start 30-second race/i }).click();
    await expect(b.getByText("Race in progress")).toBeVisible();
    await expect(a.getByText(/racers connected/i)).toBeVisible();
    await expect(b.getByText(/racers connected/i)).toBeVisible();
  } finally {
    await cleanup();
  }
});
