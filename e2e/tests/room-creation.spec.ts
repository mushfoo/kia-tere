import { test, expect } from "@playwright/test";

test.describe("Room Creation", () => {
  test("should create a new room and navigate to lobby", async ({ page }) => {
    // Navigate to the game
    await page.goto("/");

    // Verify we're on the main menu
    await expect(page.locator("h1")).toContainText("Kia Tere");

    // Fill in player name
    const playerNameInput = page.locator(
      'input[placeholder="Enter your name"]',
    );
    await expect(playerNameInput).toBeVisible();
    await playerNameInput.fill("TestPlayer");

    // Click create room button
    const createRoomButton = page.locator("button", { hasText: "Create Room" });
    await expect(createRoomButton).toBeVisible();
    await createRoomButton.click();

    // Wait for WebSocket connection and room creation
    // We should see a room code appear, indicating we're in the lobby
    await expect(page.locator("text=/Room Code|[A-Z0-9]{6}/")).toBeVisible({
      timeout: 10000,
    });

    // Verify room code is displayed (6 character alphanumeric)
    // Look for room code in the UI - it should be displayed prominently
    const roomCodeElement = page
      .locator('[class*="font-mono"]')
      .or(page.locator("text=/^[A-Z0-9]{6}$/"));
    await expect(roomCodeElement).toBeVisible();

    // Verify player is listed as host
    await expect(page.locator("text=TestPlayer")).toBeVisible();

    // Verify start game button is visible for host
    await expect(
      page.locator("button", { hasText: "Start Game" }),
    ).toBeVisible();
  });

  test("should show main menu with required elements", async ({ page }) => {
    // Navigate to the game
    await page.goto("/");

    // Verify main menu elements are present
    await expect(page.locator("h1")).toContainText("Kia Tere");
    await expect(
      page.locator('input[placeholder="Enter your name"]'),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "Create Room" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "Join Room" }),
    ).toBeVisible();

    // Verify create room button is initially disabled when no name is entered
    const createButton = page.locator("button", { hasText: "Create Room" });
    await expect(createButton).toBeDisabled();

    // Fill in name and verify button becomes enabled
    await page.locator('input[placeholder="Enter your name"]').fill("TestUser");
    await expect(createButton).toBeEnabled();
  });
});

