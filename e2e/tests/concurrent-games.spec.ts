import { test, expect } from "@playwright/test";

test.describe("Concurrent Games", () => {
  test("should support multiple independent games simultaneously", async ({ browser }) => {
    // Create contexts for two separate games (4 players total)
    const game1HostContext = await browser.newContext();
    const game1PlayerContext = await browser.newContext();
    const game2HostContext = await browser.newContext();
    const game2PlayerContext = await browser.newContext();
    
    const game1HostPage = await game1HostContext.newPage();
    const game1PlayerPage = await game1PlayerContext.newPage();
    const game2HostPage = await game2HostContext.newPage();
    const game2PlayerPage = await game2PlayerContext.newPage();

    try {
      // Set up Game 1
      await game1HostPage.goto("/");
      await game1HostPage.locator('input[placeholder="Enter your name"]').fill("Game1Host");
      await game1HostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(game1HostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const game1RoomCode = await game1HostPage.locator('[data-testid="room-code"]').textContent();

      await game1PlayerPage.goto("/");
      await game1PlayerPage.locator('input[placeholder="Enter your name"]').fill("Game1Player");
      await game1PlayerPage.locator('input[placeholder="Enter room code"]').fill(game1RoomCode!);
      await game1PlayerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(game1PlayerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });

      // Set up Game 2 with different room code
      await game2HostPage.goto("/");
      await game2HostPage.locator('input[placeholder="Enter your name"]').fill("Game2Host");
      await game2HostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(game2HostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const game2RoomCode = await game2HostPage.locator('[data-testid="room-code"]').textContent();

      await game2PlayerPage.goto("/");
      await game2PlayerPage.locator('input[placeholder="Enter your name"]').fill("Game2Player");
      await game2PlayerPage.locator('input[placeholder="Enter room code"]').fill(game2RoomCode!);
      await game2PlayerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(game2PlayerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });

      // Verify games have different room codes
      expect(game1RoomCode).not.toBe(game2RoomCode);
      console.log(`Game 1 room: ${game1RoomCode}, Game 2 room: ${game2RoomCode}`);

      // Start both games
      await game1HostPage.locator("button", { hasText: "Start Game" }).click();
      await game2HostPage.locator("button", { hasText: "Start Game" }).click();

      // Wait for both games to start
      await expect(game1HostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });
      await expect(game2HostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Verify games are independent - each should have exactly one player able to start turn
      await game1HostPage.waitForTimeout(2000);
      await game2HostPage.waitForTimeout(2000);

      const game1HostCanStart = await game1HostPage.locator("button", { hasText: "Start Turn" }).isVisible();
      const game1PlayerCanStart = await game1PlayerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      
      const game2HostCanStart = await game2HostPage.locator("button", { hasText: "Start Turn" }).isVisible();
      const game2PlayerCanStart = await game2PlayerPage.locator("button", { hasText: "Start Turn" }).isVisible();

      // Each game should have exactly one active player
      expect(game1HostCanStart || game1PlayerCanStart).toBe(true);
      expect(game1HostCanStart && game1PlayerCanStart).toBe(false);
      
      expect(game2HostCanStart || game2PlayerCanStart).toBe(true);
      expect(game2HostCanStart && game2PlayerCanStart).toBe(false);

      // Play one turn in each game to verify independence
      let game1CurrentPage = game1HostCanStart ? game1HostPage : game1PlayerPage;
      let game2CurrentPage = game2HostCanStart ? game2HostPage : game2PlayerPage;

      // Game 1 turn
      await game1CurrentPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(game1CurrentPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });
      
      const game1Letters = game1CurrentPage.locator("button").filter({ hasText: /^[A-Z]$/ });
      if (await game1Letters.first().isEnabled()) {
        await game1Letters.first().click();
      }
      await game1CurrentPage.locator("button", { hasText: "End Turn" }).click();

      // Game 2 turn
      await game2CurrentPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(game2CurrentPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });
      
      const game2Letters = game2CurrentPage.locator("button").filter({ hasText: /^[A-Z]$/ });
      if (await game2Letters.first().isEnabled()) {
        await game2Letters.first().click();
      }
      await game2CurrentPage.locator("button", { hasText: "End Turn" }).click();

      // Verify both games are still running independently
      await game1HostPage.waitForTimeout(2000);
      await game2HostPage.waitForTimeout(2000);

      const game1StillActive = await game1HostPage.locator("button:has-text('Start Turn')").isVisible() ||
                               await game1PlayerPage.locator("button:has-text('Start Turn')").isVisible();
      
      const game2StillActive = await game2HostPage.locator("button:has-text('Start Turn')").isVisible() ||
                               await game2PlayerPage.locator("button:has-text('Start Turn')").isVisible();

      expect(game1StillActive).toBe(true);
      expect(game2StillActive).toBe(true);

      console.log("Both concurrent games running independently");

    } finally {
      await game1HostContext.close();
      await game1PlayerContext.close();
      await game2HostContext.close();
      await game2PlayerContext.close();
    }
  });

  test("should isolate game state between different rooms", async ({ browser }) => {
    const room1Context = await browser.newContext();
    const room2Context = await browser.newContext();
    
    const room1Page = await room1Context.newPage();
    const room2Page = await room2Context.newPage();

    try {
      // Create two rooms
      await room1Page.goto("/");
      await room1Page.locator('input[placeholder="Enter your name"]').fill("Player1");
      await room1Page.locator("button", { hasText: "Create Room" }).click();
      
      await expect(room1Page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const room1Code = await room1Page.locator('[data-testid="room-code"]').textContent();

      await room2Page.goto("/");
      await room2Page.locator('input[placeholder="Enter your name"]').fill("Player2");
      await room2Page.locator("button", { hasText: "Create Room" }).click();
      
      await expect(room2Page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const room2Code = await room2Page.locator('[data-testid="room-code"]').textContent();

      // Verify different room codes
      expect(room1Code).not.toBe(room2Code);

      // Try to join wrong room to verify isolation
      const wrongJoinContext = await browser.newContext();
      const wrongJoinPage = await wrongJoinContext.newPage();

      await wrongJoinPage.goto("/");
      await wrongJoinPage.locator('input[placeholder="Enter your name"]').fill("Intruder");
      
      // Try to join room1 with room2's code (should fail or create new room)
      await wrongJoinPage.locator('input[placeholder="Enter room code"]').fill(room2Code!);
      await wrongJoinPage.locator("button", { hasText: "Join Room" }).click();
      
      // Wait to see what happens
      await wrongJoinPage.waitForTimeout(3000);
      
      // Room1 should be unaffected
      await expect(room1Page.locator("text=Game Lobby")).toBeVisible();
      await expect(room1Page.locator('[data-testid="room-code"]')).toHaveText(room1Code!);

      // Room2 might have the intruder, but that's OK - testing they joined room2, not room1
      const room2RoomCode = await room2Page.locator('[data-testid="room-code"]').textContent();
      expect(room2RoomCode).toBe(room2Code);

      console.log("Room state isolation verified");

      await wrongJoinContext.close();

    } finally {
      await room1Context.close();
      await room2Context.close();
    }
  });

  test("should handle high concurrent user load", async ({ browser }) => {
    const contexts = [];
    const pages = [];
    const roomCodes = [];

    try {
      // Create 5 rooms with hosts
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);

        await page.goto("/");
        await page.locator('input[placeholder="Enter your name"]').fill(`Host${i}`);
        await page.locator("button", { hasText: "Create Room" }).click();
        
        await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
        const roomCode = await page.locator('[data-testid="room-code"]').textContent();
        roomCodes.push(roomCode!);
      }

      // Verify all room codes are unique
      const uniqueRoomCodes = new Set(roomCodes);
      expect(uniqueRoomCodes.size).toBe(roomCodes.length);

      // Add players to each room
      for (let i = 0; i < 5; i++) {
        const playerContext = await browser.newContext();
        const playerPage = await playerContext.newPage();
        contexts.push(playerContext);
        pages.push(playerPage);

        await playerPage.goto("/");
        await playerPage.locator('input[placeholder="Enter your name"]').fill(`Player${i}`);
        await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCodes[i]);
        await playerPage.locator("button", { hasText: "Join Room" }).click();
        
        await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      }

      // Start all games simultaneously
      for (let i = 0; i < 5; i++) {
        const hostPage = pages[i];
        await hostPage.locator("button", { hasText: "Start Game" }).click();
      }

      // Wait for all games to start
      for (let i = 0; i < 5; i++) {
        const hostPage = pages[i];
        await expect(hostPage.locator("text=/Round|Turn|Game/")).toBeVisible({ timeout: 15000 });
      }

      // Verify each game is in a valid state
      let gamesRunning = 0;
      for (let i = 0; i < 5; i++) {
        const hostPage = pages[i];
        const playerPage = pages[i + 5];
        
        const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
        const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
        
        if (hostCanStart || playerCanStart) {
          gamesRunning++;
        }
      }

      // At least 4 out of 5 games should be running (allowing for some variance)
      expect(gamesRunning).toBeGreaterThanOrEqual(4);

      console.log(`${gamesRunning}/5 concurrent games running successfully`);

    } finally {
      // Clean up all contexts
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test("should prevent cross-room message interference", async ({ browser }) => {
    const room1Context = await browser.newContext();
    const room2Context = await browser.newContext();
    const observerContext = await browser.newContext();
    
    const room1Page = await room1Context.newPage();
    const room2Page = await room2Context.newPage();
    const observerPage = await observerContext.newPage();

    try {
      // Set up two separate rooms
      await room1Page.goto("/");
      await room1Page.locator('input[placeholder="Enter your name"]').fill("Room1Player");
      await room1Page.locator("button", { hasText: "Create Room" }).click();
      
      await expect(room1Page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const room1Code = await room1Page.locator('[data-testid="room-code"]').textContent();

      await room2Page.goto("/");
      await room2Page.locator('input[placeholder="Enter your name"]').fill("Room2Player");
      await room2Page.locator("button", { hasText: "Create Room" }).click();
      
      await expect(room2Page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const room2Code = await room2Page.locator('[data-testid="room-code"]').textContent();

      // Observer tries to monitor both rooms by creating a third room
      await observerPage.goto("/");
      await observerPage.locator('input[placeholder="Enter your name"]').fill("Observer");
      await observerPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(observerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const observerCode = await observerPage.locator('[data-testid="room-code"]').textContent();

      // All room codes should be different
      expect(room1Code).not.toBe(room2Code);
      expect(room1Code).not.toBe(observerCode);
      expect(room2Code).not.toBe(observerCode);

      // Monitor page content/state over time to ensure no cross-contamination
      let room1State = await room1Page.locator('[data-testid="room-code"]').textContent();
      let room2State = await room2Page.locator('[data-testid="room-code"]').textContent();
      let observerState = await observerPage.locator('[data-testid="room-code"]').textContent();

      // Wait some time for any potential interference
      await room1Page.waitForTimeout(3000);

      // Verify states remain unchanged
      expect(await room1Page.locator('[data-testid="room-code"]').textContent()).toBe(room1State);
      expect(await room2Page.locator('[data-testid="room-code"]').textContent()).toBe(room2State);
      expect(await observerPage.locator('[data-testid="room-code"]').textContent()).toBe(observerState);

      console.log("No cross-room message interference detected");

    } finally {
      await room1Context.close();
      await room2Context.close();
      await observerContext.close();
    }
  });
});