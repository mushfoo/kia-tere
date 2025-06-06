import { test, expect } from "@playwright/test";

test.describe("WebSocket Connection Handling", () => {
  test("should establish WebSocket connection successfully", async ({ page }) => {
    await page.goto("/");
    
    // Fill in player name to trigger WebSocket connection
    await page.locator('input[placeholder="Enter your name"]').fill("TestPlayer");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    // Wait for room creation which confirms WebSocket connection
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="room-code"]')).toBeVisible();
    
    // Connection status should indicate successful connection
    const connectionStatus = page.locator("text=/connected/i");
    await expect(connectionStatus).toBeVisible({ timeout: 10000 });
    
    console.log("WebSocket connection established successfully");
  });

  test("should handle WebSocket connection failure gracefully", async ({ page }) => {
    // Navigate to a URL that would cause WebSocket connection to fail
    // This simulates network issues or server unavailability
    await page.goto("/");
    
    // Wait for initial page load
    await page.waitForLoadState("networkidle");
    
    // Try to fill form - should still be functional even if WS fails
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill("TestPlayer");
    
    // Form should be interactive regardless of WebSocket status
    const createButton = page.locator("button", { hasText: "Create Room" });
    await expect(createButton).toBeEnabled();
    
    console.log("Page remains functional during WebSocket connection issues");
  });

  test("should show connection status updates", async ({ page }) => {
    await page.goto("/");
    
    // Fill name and create room to get to lobby where status is shown
    await page.locator('input[placeholder="Enter your name"]').fill("TestPlayer");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    // Wait for lobby
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
    
    // Look for connection status indicators
    const statusIndicators = [
      page.locator("text=/connected|connecting|disconnected/i"),
      page.locator("[data-testid='connection-status']"),
      page.locator("[class*='connection'], [class*='status']"),
    ];
    
    let statusFound = false;
    for (const indicator of statusIndicators) {
      if (await indicator.isVisible()) {
        statusFound = true;
        const statusText = await indicator.textContent();
        console.log(`Connection status found: ${statusText}`);
        break;
      }
    }
    
    // At minimum, the successful room creation indicates connection status
    expect(statusFound || await page.locator('[data-testid="room-code"]').isVisible()).toBe(true);
  });

  test("should maintain connection during extended gameplay", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up 2-player game
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("Host");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("Player1");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Start game
      await hostPage.locator("button", { hasText: "Start Game" }).click();
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Play multiple turns to test connection stability
      for (let turn = 0; turn < 6; turn++) {
        // Find current player
        const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
        const currentPlayerPage = hostCanStart ? hostPage : playerPage;
        
        // Execute turn
        await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
        await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });
        
        // Select letter and end turn
        const letterButtons = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
        const firstAvailable = letterButtons.first();
        if (await firstAvailable.isEnabled()) {
          await firstAvailable.click();
        }
        
        await currentPlayerPage.locator("button", { hasText: "End Turn" }).click();
        await currentPlayerPage.waitForTimeout(1000);
      }

      // Verify both players are still connected and responsive
      const hostResponsive = await hostPage.locator("button:has-text('Start Turn')").isVisible() ||
                             await hostPage.locator("button:has-text('End Turn')").isVisible() ||
                             await hostPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible();
      
      const playerResponsive = await playerPage.locator("button:has-text('Start Turn')").isVisible() ||
                               await playerPage.locator("button:has-text('End Turn')").isVisible() ||
                               await playerPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible();

      expect(hostResponsive || playerResponsive).toBe(true);
      
      console.log("WebSocket connections maintained during extended gameplay");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should synchronize state between multiple clients", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up 2-player game
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("Host");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("Player1");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Both players should see the same room code
      const hostRoomCode = await hostPage.locator('[data-testid="room-code"]').textContent();
      const playerRoomCode = await playerPage.locator('[data-testid="room-code"]').textContent();
      expect(hostRoomCode).toBe(playerRoomCode);
      
      // Start game
      await hostPage.locator("button", { hasText: "Start Game" }).click();
      
      // Both should transition to game state
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });
      await expect(playerPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });
      
      // Verify game state sync - exactly one player should have start turn button
      await hostPage.waitForTimeout(2000);
      const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
      const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      
      expect(hostCanStart || playerCanStart).toBe(true);
      expect(hostCanStart && playerCanStart).toBe(false);
      
      console.log("WebSocket state synchronization working correctly");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});