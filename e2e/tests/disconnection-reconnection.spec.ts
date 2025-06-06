import { test, expect } from "@playwright/test";

test.describe("Player Disconnection and Reconnection", () => {
  test("should handle player disconnection during lobby", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up room with 2 players
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
      
      // Wait for player sync
      await hostPage.waitForTimeout(2000);
      
      // Simulate player disconnection by closing the page
      await playerPage.close();
      
      // Wait for disconnection to be processed
      await hostPage.waitForTimeout(3000);
      
      // Host should still be in lobby
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible();
      await expect(hostPage.locator('[data-testid="room-code"]')).toBeVisible();
      
      // Start game button should still be available to host
      const startButton = hostPage.locator("button", { hasText: "Start Game" });
      await expect(startButton).toBeVisible();
      
      console.log("Host remains functional after player disconnection in lobby");

    } finally {
      await hostContext.close();
      // playerContext already closed
    }
  });

  test("should handle player reconnection to existing room", async ({ browser }) => {
    const hostContext = await browser.newContext();
    let playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    let playerPage = await playerContext.newPage();

    try {
      // Set up room
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("Host");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      // Player joins
      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("Player1");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Simulate disconnection and reconnection
      await playerPage.close();
      await playerContext.close();
      
      // Wait for disconnection processing
      await hostPage.waitForTimeout(2000);
      
      // Create new connection for same player
      playerContext = await browser.newContext();
      playerPage = await playerContext.newPage();
      
      // Reconnect to same room
      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("Player1");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      // Should be able to rejoin
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Host should still be there
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible();
      
      console.log("Player successfully reconnected to existing room");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle page refresh during game", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up and start game
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

      // Wait for game to stabilize
      await hostPage.waitForTimeout(2000);
      
      // Refresh player page to simulate disconnection/reconnection
      await playerPage.reload();
      
      // Player should be back to initial state (menu)
      await expect(playerPage.locator('input[placeholder="Enter your name"]')).toBeVisible({ timeout: 10000 });
      
      // But should be able to rejoin
      await playerPage.locator('input[placeholder="Enter your name"]').fill("Player1");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      // Should be able to get back into the game or lobby
      const backInGame = await playerPage.locator("text=Game Lobby").isVisible({ timeout: 5000 }) ||
                        await playerPage.locator("button", { hasText: "Start Turn" }).isVisible({ timeout: 5000 }) ||
                        await playerPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible({ timeout: 5000 });
      
      expect(backInGame).toBe(true);
      
      console.log("Player successfully handled page refresh during game");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle host disconnection gracefully", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up room with 2 players
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
      
      // Wait for sync
      await hostPage.waitForTimeout(2000);
      
      // Host disconnects
      await hostPage.close();
      await hostContext.close();
      
      // Wait for disconnection to be processed
      await playerPage.waitForTimeout(5000);
      
      // Player should handle host disconnection gracefully
      // They might be returned to menu, or get an error message, or remain in lobby
      const playerState = {
        inMenu: await playerPage.locator('input[placeholder="Enter your name"]').isVisible(),
        inLobby: await playerPage.locator("text=Game Lobby").isVisible(),
        hasError: await playerPage.locator("text=/error|disconnected|lost connection/i").isVisible(),
      };
      
      // Player should be in some valid state (not crashed)
      expect(playerState.inMenu || playerState.inLobby || playerState.hasError).toBe(true);
      
      console.log(`Player state after host disconnection: ${JSON.stringify(playerState)}`);

    } finally {
      // hostContext already closed
      await playerContext.close();
    }
  });

  test("should handle network interruption simulation", async ({ page }) => {
    await page.goto("/");
    
    // Set up room
    await page.locator('input[placeholder="Enter your name"]').fill("TestPlayer");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
    
    // Simulate network interruption by going offline
    await page.context().setOffline(true);
    
    // Wait for offline state
    await page.waitForTimeout(2000);
    
    // Try to interact with the page
    const interactions = [
      () => page.locator("button", { hasText: "Start Game" }).click().catch(() => {}),
      () => page.reload().catch(() => {}),
    ];
    
    // These should either work or fail gracefully
    for (const interaction of interactions) {
      await interaction();
    }
    
    // Restore network connection
    await page.context().setOffline(false);
    
    // Wait for potential reconnection
    await page.waitForTimeout(3000);
    
    // Page should be in some functional state
    const pageWorking = await page.locator('input[placeholder="Enter your name"]').isVisible() ||
                       await page.locator("text=Game Lobby").isVisible() ||
                       await page.locator("text=/error|disconnected/i").isVisible();
    
    expect(pageWorking).toBe(true);
    
    console.log("Application handled network interruption gracefully");
  });
});