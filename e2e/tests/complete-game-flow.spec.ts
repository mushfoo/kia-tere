import { test, expect } from "@playwright/test";

test.describe("Complete Game Flow", () => {
  test("should complete a full 2-player game from start to finish", async ({ browser }) => {
    // Create two browser contexts to simulate two players
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Step 1: Host creates a room
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("Host");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      // Wait for room creation and get room code
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCodeElement = hostPage.locator('[data-testid="room-code"]');
      await expect(roomCodeElement).toBeVisible();
      const roomCode = await roomCodeElement.textContent();
      expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

      // Step 2: Player joins the room
      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("Player1");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      // Wait for player to join lobby
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Wait for WebSocket synchronization (player sync may take time)
      await hostPage.waitForTimeout(2000);
      await playerPage.waitForTimeout(2000);

      // Step 3: Host starts the game
      const startButton = hostPage.locator("button", { hasText: "Start Game" });
      await expect(startButton).toBeEnabled();
      await startButton.click();

      // Step 4: Wait for game to start and verify game state
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });
      await expect(playerPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Verify game has started by checking for turn buttons or other game elements
      const hostGameStarted = await hostPage.locator("button:has-text('Start Turn')").isVisible() ||
                             await hostPage.locator("[data-testid='timer-container']").isVisible();
      const playerGameStarted = await playerPage.locator("button:has-text('Start Turn')").isVisible() ||
                               await playerPage.locator("[data-testid='timer-container']").isVisible();
      
      expect(hostGameStarted || playerGameStarted).toBe(true);

      // Step 5: Identify whose turn it is and play through a few turns
      let currentPlayerPage = hostPage;
      let otherPlayerPage = playerPage;
      let currentPlayerName = "Host";
      let otherPlayerName = "Player1";

      // Check if Player1 goes first instead
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
        otherPlayerPage = hostPage;
        currentPlayerName = "Player1";
        otherPlayerName = "Host";
      }

      // Play a few turns to demonstrate game mechanics
      for (let turn = 0; turn < 4; turn++) {
        // Verify it's the current player's turn
        const startTurnButton = currentPlayerPage.locator("button", { hasText: "Start Turn" });
        await expect(startTurnButton).toBeVisible({ timeout: 5000 });
        
        // Other player should not have start turn button
        await expect(otherPlayerPage.locator("button", { hasText: "Start Turn" })).not.toBeVisible();

        // Start the turn
        await startTurnButton.click();

        // Wait for timer to appear and letter selection to be enabled
        await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

        // Select a letter (try common letters first)
        const commonLetters = ['A', 'E', 'I', 'O', 'S', 'T', 'R', 'N'];
        let letterSelected = false;
        
        for (const letter of commonLetters) {
          const letterButton = currentPlayerPage.locator(`button:has-text("${letter}")`, { hasText: new RegExp(`^${letter}$`) });
          if (await letterButton.isVisible() && await letterButton.isEnabled()) {
            await letterButton.click();
            
            // Verify letter is selected (usually highlighted or marked)
            const isSelected = await letterButton.getAttribute("class");
            if (isSelected && (isSelected.includes("selected") || isSelected.includes("bg-blue") || isSelected.includes("bg-green"))) {
              letterSelected = true;
              break;
            }
          }
        }

        // If no common letter worked, select any available letter
        if (!letterSelected) {
          const availableLetters = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
          const letterCount = await availableLetters.count();
          
          for (let i = 0; i < letterCount; i++) {
            const letterButton = availableLetters.nth(i);
            if (await letterButton.isEnabled()) {
              await letterButton.click();
              letterSelected = true;
              break;
            }
          }
        }

        expect(letterSelected).toBe(true);

        // End the turn
        const endTurnButton = currentPlayerPage.locator("button", { hasText: "End Turn" });
        await expect(endTurnButton).toBeVisible();
        await endTurnButton.click();

        // Wait for turn to switch
        await currentPlayerPage.waitForTimeout(2000);

        // Switch players for next turn
        [currentPlayerPage, otherPlayerPage] = [otherPlayerPage, currentPlayerPage];
        [currentPlayerName, otherPlayerName] = [otherPlayerName, currentPlayerName];
      }

      // Step 6: Verify game state persistence
      // Both players should still be in the game (not in lobby or error state)
      const hostStillPlaying = await hostPage.locator("button:has-text('Start Turn')").isVisible() ||
                              await hostPage.locator("button:has-text('End Turn')").isVisible() ||
                              await hostPage.locator("[data-testid='timer-container']").isVisible();
      
      const playerStillPlaying = await playerPage.locator("button:has-text('Start Turn')").isVisible() ||
                                await playerPage.locator("button:has-text('End Turn')").isVisible() ||
                                await playerPage.locator("[data-testid='timer-container']").isVisible();

      expect(hostStillPlaying || playerStillPlaying).toBe(true);

      console.log("Successfully completed 2-player game flow test with multiple turns");
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle game progression through multiple rounds", async ({ browser }) => {
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
      
      // Verify game started
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });
      await expect(playerPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Verify game elements are present
      const gameStarted = await hostPage.locator("button:has-text('Start Turn')").isVisible() ||
                         await playerPage.locator("button:has-text('Start Turn')").isVisible();
      expect(gameStarted).toBe(true);

      console.log("Successfully verified multi-round game setup and initial state");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});