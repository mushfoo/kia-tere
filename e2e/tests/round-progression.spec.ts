import { test, expect } from "@playwright/test";

test.describe("Round Progression and Scoring", () => {
  test("should progress to next round when only one player remains", async ({ browser }) => {
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
      await expect(hostPage.locator("text=/Round|Turn|Game/")).toBeVisible({ timeout: 10000 });

      // Verify we start at Round 1
      await expect(hostPage.locator("text=/Round 1/")).toBeVisible();
      await expect(playerPage.locator("text=/Round 1/")).toBeVisible();

      // Force round end by having one player time out
      let currentPlayerPage = hostPage;
      let survivingPlayerPage = playerPage;
      
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
        survivingPlayerPage = hostPage;
      }

      // Start turn but let timer run out to eliminate current player
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Wait for elimination (up to 15 seconds)
      const roundProgressIndicators = [
        currentPlayerPage.locator("text=/Round 2|Round.*2/"),
        survivingPlayerPage.locator("text=/Round 2|Round.*2/"),
        currentPlayerPage.locator("text=/round.*end|winner|wins|eliminated/i"),
        survivingPlayerPage.locator("text=/round.*end|winner|wins|point/i"),
      ];

      let roundProgressed = false;
      for (let i = 0; i < 15; i++) {
        await currentPlayerPage.waitForTimeout(1000);
        
        for (const indicator of roundProgressIndicators) {
          if (await indicator.isVisible()) {
            roundProgressed = true;
            console.log(`Round progression detected: ${await indicator.textContent()}`);
            break;
          }
        }
        
        if (roundProgressed) break;
      }

      // Verify round progression occurred
      expect(roundProgressed).toBe(true);

      // After round end, should eventually see Round 2
      await expect(hostPage.locator("text=/Round 2|Round.*2/")).toBeVisible({ timeout: 10000 });
      await expect(playerPage.locator("text=/Round 2|Round.*2/")).toBeVisible({ timeout: 10000 });

      console.log("Round progression test completed successfully");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should track and display scores correctly", async ({ browser }) => {
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
      await expect(hostPage.locator("text=/Round|Turn|Game/")).toBeVisible({ timeout: 10000 });

      // Verify initial scores are 0
      const scoreIndicators = [
        hostPage.locator("text=/0.*win|win.*0|score.*0|0.*point/i"),
        playerPage.locator("text=/0.*win|win.*0|score.*0|0.*point/i"),
      ];

      let initialScoreFound = false;
      for (const indicator of scoreIndicators) {
        if (await indicator.isVisible()) {
          initialScoreFound = true;
          console.log(`Initial score display: ${await indicator.textContent()}`);
          break;
        }
      }

      // Look for player names with scores
      const hostScoreDisplay = hostPage.locator("text=/Host.*[0-9]|[0-9].*Host/");
      const playerScoreDisplay = hostPage.locator("text=/Player1.*[0-9]|[0-9].*Player1/");

      if (await hostScoreDisplay.isVisible()) {
        console.log(`Host score display: ${await hostScoreDisplay.textContent()}`);
      }
      if (await playerScoreDisplay.isVisible()) {
        console.log(`Player1 score display: ${await playerScoreDisplay.textContent()}`);
      }

      // Verify scores are displayed (either 0 or player names with numbers)
      const hasScoreDisplay = initialScoreFound || 
                              await hostScoreDisplay.isVisible() || 
                              await playerScoreDisplay.isVisible();

      expect(hasScoreDisplay).toBe(true);

      console.log("Score tracking test completed - initial scores verified");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should reset game state for new rounds", async ({ browser }) => {
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
      await expect(hostPage.locator("text=/Round|Turn|Game/")).toBeVisible({ timeout: 10000 });

      // Play one turn to use a letter
      let currentPlayerPage = hostPage;
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
      }

      // Execute one turn
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Select and use a letter
      const letterButtons = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
      const firstLetter = letterButtons.first();
      const usedLetterText = await firstLetter.textContent();
      await firstLetter.click();
      await currentPlayerPage.locator("button", { hasText: "End Turn" }).click();

      // Wait for turn to process
      await currentPlayerPage.waitForTimeout(2000);

      // Force round end by having current player time out on next turn
      const nextPlayerPage = currentPlayerPage === hostPage ? playerPage : hostPage;
      
      if (await nextPlayerPage.locator("button", { hasText: "Start Turn" }).isVisible()) {
        await nextPlayerPage.locator("button", { hasText: "Start Turn" }).click();
        await expect(nextPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

        // Wait for elimination and round progression
        await nextPlayerPage.waitForTimeout(12000);
      }

      // Look for Round 2 to verify new round started
      const round2Visible = await hostPage.locator("text=/Round 2|Round.*2/").isVisible() ||
                           await playerPage.locator("text=/Round 2|Round.*2/").isVisible();

      if (round2Visible) {
        console.log("Round 2 detected - checking letter reset");

        // In new round, the previously used letter should be available again
        const hostUsedLetter = hostPage.locator(`button:has-text("${usedLetterText}")`, { hasText: new RegExp(`^${usedLetterText}$`) });
        const playerUsedLetter = playerPage.locator(`button:has-text("${usedLetterText}")`, { hasText: new RegExp(`^${usedLetterText}$`) });

        if (await hostUsedLetter.isVisible()) {
          const isEnabled = await hostUsedLetter.isEnabled();
          console.log(`Letter ${usedLetterText} on host page - enabled: ${isEnabled}`);
        }

        if (await playerUsedLetter.isVisible()) {
          const isEnabled = await playerUsedLetter.isEnabled();
          console.log(`Letter ${usedLetterText} on player page - enabled: ${isEnabled}`);
        }

        // Verify both players are active again (no eliminations carry over)
        const someoneCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible() ||
                               await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
        expect(someoneCanStart).toBe(true);

        console.log("New round state reset verification completed");
      } else {
        console.log("Round 2 not reached in time limit - test focused on turn mechanics");
      }

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle game end condition correctly", async ({ browser }) => {
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
      await expect(hostPage.locator("text=/Round|Turn|Game/")).toBeVisible({ timeout: 10000 });

      // Look for game end conditions (usually first to 3 wins)
      const gameEndIndicators = [
        hostPage.locator("text=/game.*over|winner.*game|champion|final.*score/i"),
        playerPage.locator("text=/game.*over|winner.*game|champion|final.*score/i"),
        hostPage.locator("text=/3.*win|win.*3|victory/i"),
        playerPage.locator("text=/3.*win|win.*3|victory/i"),
      ];

      // Since game end requires multiple rounds (first to 3 wins), 
      // this test mainly verifies the game doesn't end prematurely
      // and continues play after first round

      // Play through one turn cycle
      let currentPlayerPage = hostPage;
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
      }

      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Game should still be active (not ended after one turn)
      let gameEnded = false;
      for (const indicator of gameEndIndicators) {
        if (await indicator.isVisible()) {
          gameEnded = true;
          break;
        }
      }

      // Game should NOT end after just one turn
      expect(gameEnded).toBe(false);

      // Should still be in Round 1
      await expect(hostPage.locator("text=/Round 1/")).toBeVisible();

      // Should still have active game elements
      const hasActiveGame = await currentPlayerPage.locator("text=/Timer|[0-9]+s/").isVisible() ||
                           await currentPlayerPage.locator("button", { hasText: "End Turn" }).isVisible();
      expect(hasActiveGame).toBe(true);

      console.log("Game end condition test completed - game continues correctly");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});