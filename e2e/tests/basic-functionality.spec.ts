import { test, expect } from "@playwright/test";

test.describe("Basic Functionality", () => {
  test("should create room and verify room code appears", async ({ page }) => {
    await page.goto("/");
    
    // Fill in player name and create room
    await page.locator('input[placeholder="Enter your name"]').fill("TestHost");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    // Verify room creation succeeded
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="room-code"]')).toBeVisible();
    
    // Get room code and verify format
    const roomCode = await page.locator('[data-testid="room-code"]').textContent();
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
    
    console.log(`Successfully created room: ${roomCode}`);
  });

  test("should show connection status in lobby", async ({ page }) => {
    await page.goto("/");
    
    // Fill in player name and create room to reach lobby where connection status is shown
    await page.locator('input[placeholder="Enter your name"]').fill("TestPlayer");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    // Wait for lobby to load
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
    
    // Check connection status indicators exist in lobby
    const connectionIndicators = page.locator("text=/connected|connecting|disconnected/i");
    await expect(connectionIndicators.first()).toBeVisible({ timeout: 10000 });
  });

  test("should validate room joining inputs properly", async ({ page }) => {
    await page.goto("/");
    
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    const codeInput = page.locator('input[placeholder="Enter room code"]');
    const createButton = page.locator("button", { hasText: "Create Room" });
    const joinButton = page.locator("button", { hasText: "Join Room" });
    
    // Initially both buttons should be disabled
    await expect(createButton).toBeDisabled();
    await expect(joinButton).toBeDisabled();
    
    // Fill name - Create Room should be enabled, Join Room still disabled
    await nameInput.fill("TestPlayer");
    await expect(createButton).toBeEnabled();
    await expect(joinButton).toBeDisabled();
    
    // Fill room code - Join Room should now be enabled
    await codeInput.fill("ABC123");
    await expect(joinButton).toBeEnabled();
  });
});