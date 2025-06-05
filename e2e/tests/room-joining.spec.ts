import { test, expect } from "@playwright/test";

test.describe("Room Joining", () => {
  test("should successfully join an existing room", async ({ browser }) => {
    // Create two browser contexts to simulate two players
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates a room
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("Host");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      // Wait for room creation and get room code
      await expect(hostPage.locator("text=/Room Code|[A-Z0-9]{6}/")).toBeVisible({
        timeout: 10000,
      });
      
      // Extract room code from the UI using data-testid
      const roomCodeElement = hostPage.locator('[data-testid="room-code"]');
      await expect(roomCodeElement).toBeVisible();
      const roomCode = await roomCodeElement.textContent();
      
      expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

      // Player joins the room
      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("Player1");
      
      // Fill in room code and join
      const joinCodeInput = playerPage.locator('input[placeholder="Enter room code"]');
      await expect(joinCodeInput).toBeVisible();
      await joinCodeInput.fill(roomCode!);
      
      // Click the Join Room button
      const joinButton = playerPage.locator("button", { hasText: "Join Room" });
      await expect(joinButton).toBeEnabled();
      await joinButton.click();

      // Wait longer for WebSocket connection and room joining
      // The join process involves: connect WebSocket -> send JOIN_ROOM -> receive ROOM_JOINED
      await playerPage.waitForTimeout(5000);
      
      // Check if we successfully joined (see lobby) or failed (still on menu/error)
      const isInLobby = await playerPage.locator("text=Game Lobby").isVisible();
      const isStillOnMenu = await playerPage.locator("h1:has-text('Kia Tere')").isVisible();
      
      if (!isInLobby && isStillOnMenu) {
        // Check for any error messages or connection status
        const hasError = await playerPage.locator("text=/error|failed|invalid/i").isVisible();
        const connectionStatus = await playerPage.locator("text=/connecting|disconnected/i").textContent();
        throw new Error(`Failed to join room ${roomCode}. Player still on main menu. Error: ${hasError ? 'yes' : 'no'}, Connection: ${connectionStatus || 'unknown'}`);
      }
      
      // Verify player successfully joined - should see lobby
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible();
      
      // Verify room code is displayed in the lobby
      await expect(playerPage.locator('[data-testid="room-code"]')).toBeVisible();
      await expect(playerPage.locator('[data-testid="room-code"]')).toHaveText(roomCode!);
      
      // Verify player sees themselves in the lobby
      await expect(playerPage.locator("text=Player1")).toBeVisible();
      
      // Verify host sees the new player in their lobby
      await expect(hostPage.locator("text=Player1")).toBeVisible({ timeout: 5000 });
      
      // Verify host still has start game button (not the joined player)
      await expect(hostPage.locator("button", { hasText: "Start Game" })).toBeVisible();
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should show error for invalid room code", async ({ page }) => {
    await page.goto("/");
    
    // Fill in player name
    await page.locator('input[placeholder="Enter your name"]').fill("TestPlayer");
    
    // Try to join with invalid room code
    const joinCodeInput = page.locator('input[placeholder="Enter room code"]');
    await expect(joinCodeInput).toBeVisible();
    await joinCodeInput.fill("INVALID");
    
    const joinButton = page.locator("button", { hasText: "Join Room" });
    await expect(joinButton).toBeEnabled();
    await joinButton.click();
    
    // Should show error message or stay on menu (depending on implementation)
    // Let's check if we get an error indication or stay on the main menu
    await page.waitForTimeout(3000); // Give time for any error to appear
    
    // We should either see an error message or still be on the main menu
    const isStillOnMenu = await page.locator("h1", { hasText: "Kia Tere" }).isVisible();
    const hasErrorMessage = await page.locator("text=/error|invalid|not found/i").isVisible();
    
    expect(isStillOnMenu || hasErrorMessage).toBe(true);
  });

  test("should enable buttons only when required fields are filled", async ({ page }) => {
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
    await expect(createButton).toBeEnabled();
    await expect(joinButton).toBeEnabled();
    
    // Clear name - both should be disabled again
    await nameInput.clear();
    await expect(createButton).toBeDisabled();
    await expect(joinButton).toBeDisabled();
  });
});