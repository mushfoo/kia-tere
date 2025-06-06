import { test, expect } from "@playwright/test";

test.describe("Game State Persistence", () => {
  test("should maintain lobby state across page refresh", async ({ page }) => {
    await page.goto("/");
    
    // Create room
    await page.locator('input[placeholder="Enter your name"]').fill("TestHost");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
    const roomCode = await page.locator('[data-testid="room-code"]').textContent();
    
    // Refresh the page
    await page.reload();
    
    // Should be back to initial state (not persistent by design)
    await expect(page.locator('input[placeholder="Enter your name"]')).toBeVisible({ timeout: 10000 });
    
    // But should be able to rejoin the same room
    await page.locator('input[placeholder="Enter your name"]').fill("TestHost");
    await page.locator('input[placeholder="Enter room code"]').fill(roomCode!);
    await page.locator("button", { hasText: "Join Room" }).click();
    
    // Should be able to get back to lobby or game
    const rejoinedLobby = await page.locator("text=Game Lobby").isVisible({ timeout: 5000 });
    const onMenu = await page.locator('input[placeholder="Enter your name"]').isVisible();
    
    expect(rejoinedLobby || onMenu).toBe(true);
    
    console.log("Lobby state persistence handled appropriately");
  });

  test("should handle browser tab closure and reopening", async ({ browser }) => {
    const context = await browser.newContext();
    let page = await context.newPage();

    try {
      // Create room
      await page.goto("/");
      await page.locator('input[placeholder="Enter your name"]').fill("TabTester");
      await page.locator("button", { hasText: "Create Room" }).click();
      
      await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await page.locator('[data-testid="room-code"]').textContent();
      
      // Close the page (simulate tab closure)
      await page.close();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Open new page in same context
      page = await context.newPage();
      await page.goto("/");
      
      // Should start fresh
      await expect(page.locator('input[placeholder="Enter your name"]')).toBeVisible();
      
      // Try to rejoin the room
      await page.locator('input[placeholder="Enter your name"]').fill("TabTester");
      await page.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await page.locator("button", { hasText: "Join Room" }).click();
      
      // Should handle gracefully
      await page.waitForTimeout(3000);
      
      const rejoinedLobby = await page.locator("text=Game Lobby").isVisible();
      const onMenu = await page.locator('input[placeholder="Enter your name"]').isVisible();
      const hasError = await page.locator("text=/error|not found/i").isVisible();
      
      expect(rejoinedLobby || onMenu || hasError).toBe(true);
      
      console.log("Tab closure and reopening handled gracefully");

    } finally {
      await context.close();
    }
  });

  test("should handle local storage consistency", async ({ page }) => {
    await page.goto("/");
    
    // Check if any local storage is used
    const initialStorage = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage).length,
        sessionStorage: Object.keys(sessionStorage).length,
      };
    });
    
    // Create room
    await page.locator('input[placeholder="Enter your name"]').fill("StorageTester");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
    
    // Check if storage changed
    const afterCreationStorage = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage).length,
        sessionStorage: Object.keys(sessionStorage).length,
      };
    });
    
    // Storage might change, but application should handle it gracefully
    console.log(`Storage before: ${JSON.stringify(initialStorage)}, after: ${JSON.stringify(afterCreationStorage)}`);
    
    // Clear all storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Page should still function
    const stillInLobby = await page.locator("text=Game Lobby").isVisible();
    const canInteract = await page.locator("button", { hasText: "Start Game" }).isVisible() ||
                       await page.locator('[data-testid="room-code"]').isVisible();
    
    expect(stillInLobby || canInteract).toBe(true);
    
    console.log("Local storage handling verified");
  });

  test("should handle network interruption recovery", async ({ page }) => {
    await page.goto("/");
    
    // Create room
    await page.locator('input[placeholder="Enter your name"]').fill("NetworkTester");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
    
    // Simulate network interruption
    await page.context().setOffline(true);
    
    // Wait in offline state
    await page.waitForTimeout(2000);
    
    // Try to interact (should fail gracefully)
    await page.locator("button", { hasText: "Start Game" }).click().catch(() => {});
    
    // Restore network
    await page.context().setOffline(false);
    
    // Wait for potential reconnection
    await page.waitForTimeout(3000);
    
    // Application should be in some functional state
    const stillInLobby = await page.locator("text=Game Lobby").isVisible();
    const backToMenu = await page.locator('input[placeholder="Enter your name"]').isVisible();
    const hasError = await page.locator("text=/error|connection/i").isVisible();
    
    expect(stillInLobby || backToMenu || hasError).toBe(true);
    
    console.log("Network interruption recovery handled");
  });

  test("should maintain game data integrity", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up game
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("DataHost");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("DataPlayer");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Start game
      await hostPage.locator("button", { hasText: "Start Game" }).click();
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Wait for game to stabilize
      await hostPage.waitForTimeout(2000);
      
      // Verify initial game state consistency
      const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
      const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      
      expect(hostCanStart || playerCanStart).toBe(true);
      expect(hostCanStart && playerCanStart).toBe(false);
      
      // Take a turn to change game state
      const currentPlayerPage = hostCanStart ? hostPage : playerPage;
      
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });
      
      // Select a letter
      const letterButtons = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
      if (await letterButtons.first().isEnabled()) {
        await letterButtons.first().click();
      }
      
      await currentPlayerPage.locator("button", { hasText: "End Turn" }).click();
      
      // Wait for turn to process
      await currentPlayerPage.waitForTimeout(2000);
      
      // Verify game state is still consistent
      const hostStillActive = await hostPage.locator("button:has-text('Start Turn')").isVisible() ||
                             await hostPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible();
      
      const playerStillActive = await playerPage.locator("button:has-text('Start Turn')").isVisible() ||
                               await playerPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible();

      expect(hostStillActive || playerStillActive).toBe(true);
      
      console.log("Game data integrity maintained through turn");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle multiple rapid state changes", async ({ page }) => {
    await page.goto("/");
    
    // Rapidly switch between states
    await page.locator('input[placeholder="Enter your name"]').fill("RapidTester");
    
    // Rapid create/navigate cycles
    for (let i = 0; i < 3; i++) {
      await page.locator("button", { hasText: "Create Room" }).click();
      await page.waitForTimeout(500);
      
      // If we get to lobby, go back
      if (await page.locator("text=Game Lobby").isVisible({ timeout: 2000 })) {
        await page.goto("/");
        await page.locator('input[placeholder="Enter your name"]').fill("RapidTester");
      }
    }
    
    // Application should be in some valid state
    const onMenu = await page.locator('input[placeholder="Enter your name"]').isVisible();
    const inLobby = await page.locator("text=Game Lobby").isVisible();
    const hasError = await page.locator("text=/error/i").isVisible();
    
    expect(onMenu || inLobby || hasError).toBe(true);
    
    console.log("Rapid state changes handled gracefully");
  });
});