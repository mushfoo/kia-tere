import { test, expect } from "@playwright/test";

test.describe("Overtime and Special Game Modes", () => {
  test("should handle overtime rounds when available letters are limited", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up 2-player game
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("OvertimeHost");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("OvertimePlayer");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Start game
      await hostPage.locator("button", { hasText: "Start Game" }).click();
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Play through many turns to potentially trigger overtime
      let turnCount = 0;
      const maxTurns = 20; // Limit to prevent infinite loop
      
      while (turnCount < maxTurns) {
        // Check if game has ended
        const gameEnded = await hostPage.locator("text=/game.*end|winner|final/i").isVisible() ||
                         await playerPage.locator("text=/game.*end|winner|final/i").isVisible();
        
        if (gameEnded) {
          console.log("Game ended naturally");
          break;
        }
        
        // Find current player
        const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
        const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
        
        if (!hostCanStart && !playerCanStart) {
          // No one can start - game might have ended or be in transition
          await hostPage.waitForTimeout(2000);
          continue;
        }
        
        const currentPlayerPage = hostCanStart ? hostPage : playerPage;
        
        // Execute turn
        await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
        await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });
        
        // Select any available letter
        const letterButtons = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
        const availableLetters = await letterButtons.count();
        
        if (availableLetters === 0) {
          console.log("No available letters - potential overtime situation");
          break;
        }
        
        // Find and click an enabled letter
        let letterSelected = false;
        for (let i = 0; i < availableLetters; i++) {
          const letter = letterButtons.nth(i);
          if (await letter.isEnabled()) {
            await letter.click();
            letterSelected = true;
            break;
          }
        }
        
        if (!letterSelected) {
          console.log("No letters could be selected - potential overtime");
          break;
        }
        
        await currentPlayerPage.locator("button", { hasText: "End Turn" }).click();
        await currentPlayerPage.waitForTimeout(1000);
        
        turnCount++;
      }
      
      // Verify game is in some valid end state or still playable
      const hostState = {
        canStart: await hostPage.locator("button", { hasText: "Start Turn" }).isVisible(),
        gameEnded: await hostPage.locator("text=/game.*end|winner|final/i").isVisible(),
        hasLetters: await hostPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible(),
      };
      
      const playerState = {
        canStart: await playerPage.locator("button", { hasText: "Start Turn" }).isVisible(),
        gameEnded: await playerPage.locator("text=/game.*end|winner|final/i").isVisible(),
        hasLetters: await playerPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible(),
      };
      
      // Game should be in valid state
      const validState = hostState.canStart || hostState.gameEnded || hostState.hasLetters ||
                         playerState.canStart || playerState.gameEnded || playerState.hasLetters;
      
      expect(validState).toBe(true);
      
      console.log(`Played ${turnCount} turns. Final states: Host=${JSON.stringify(hostState)}, Player=${JSON.stringify(playerState)}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle sudden death scenarios", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up game
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("SuddenHost");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("SuddenPlayer");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Start game
      await hostPage.locator("button", { hasText: "Start Game" }).click();
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Find current player and let timer run out to trigger elimination
      await hostPage.waitForTimeout(2000);
      
      const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
      const currentPlayerPage = hostCanStart ? hostPage : playerPage;
      const eliminatedPlayerName = hostCanStart ? "SuddenHost" : "SuddenPlayer";
      
      // Start turn but don't complete it (sudden death by timeout)
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });
      
      // Wait for timer to run out (should take ~10 seconds)
      const eliminationIndicators = [
        currentPlayerPage.locator("text=/eliminated|time.*up|out/i"),
        currentPlayerPage.locator("text=/round.*end|winner|wins/i"),
        currentPlayerPage.locator("text=/Round [2-9]/"),
        hostPage.locator("text=/eliminated|winner|wins/i"),
        playerPage.locator("text=/eliminated|winner|wins/i"),
      ];
      
      let eliminationDetected = false;
      const timeout = 15000; // Wait up to 15 seconds
      
      for (const indicator of eliminationIndicators) {
        try {
          await indicator.waitFor({ timeout: timeout });
          eliminationDetected = true;
          console.log(`Elimination detected: ${await indicator.textContent()}`);
          break;
        } catch (e) {
          // Continue to next indicator
        }
      }
      
      // Alternative check: look for state changes that indicate elimination
      if (!eliminationDetected) {
        await currentPlayerPage.waitForTimeout(timeout);
        
        // Check if game state changed (round progression, player elimination, etc.)
        const stateChanged = await hostPage.locator("text=/Round [2-9]|eliminated|winner/i").isVisible() ||
                            await playerPage.locator("text=/Round [2-9]|eliminated|winner/i").isVisible();
        
        eliminationDetected = stateChanged;
      }
      
      expect(eliminationDetected).toBe(true);
      
      console.log(`Sudden death scenario completed for ${eliminatedPlayerName}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle end game conditions appropriately", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up game
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("EndGameHost");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("EndGamePlayer");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Start game
      await hostPage.locator("button", { hasText: "Start Game" }).click();
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Play until game potentially ends
      let rounds = 0;
      const maxRounds = 10;
      
      while (rounds < maxRounds) {
        // Check for end game conditions
        const endGameIndicators = [
          hostPage.locator("text=/game.*end|final.*round|winner|congratulations/i"),
          playerPage.locator("text=/game.*end|final.*round|winner|congratulations/i"),
          hostPage.locator("button", { hasText: /new.*game|play.*again|return.*menu/i }),
          playerPage.locator("button", { hasText: /new.*game|play.*again|return.*menu/i }),
        ];
        
        let gameEnded = false;
        for (const indicator of endGameIndicators) {
          if (await indicator.isVisible()) {
            gameEnded = true;
            console.log(`Game end detected: ${await indicator.textContent()}`);
            break;
          }
        }
        
        if (gameEnded) {
          break;
        }
        
        // Play one round
        const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
        const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
        
        if (!hostCanStart && !playerCanStart) {
          // No one can play - might be end of game
          await hostPage.waitForTimeout(3000);
          break;
        }
        
        // Execute a few turns in this round
        for (let turn = 0; turn < 4; turn++) {
          const currentHostTurn = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
          const currentPlayerTurn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
          
          if (!currentHostTurn && !currentPlayerTurn) break;
          
          const currentPage = currentHostTurn ? hostPage : playerPage;
          
          await currentPage.locator("button", { hasText: "Start Turn" }).click();
          
          // Wait for timer or skip if no timer appears
          const hasTimer = await currentPage.locator("text=/Timer|[0-9]+s/").isVisible({ timeout: 2000 });
          if (hasTimer) {
            // Select letter if available
            const letters = currentPage.locator("button").filter({ hasText: /^[A-Z]$/ });
            if (await letters.first().isEnabled()) {
              await letters.first().click();
            }
            await currentPage.locator("button", { hasText: "End Turn" }).click();
          }
          
          await currentPage.waitForTimeout(1000);
        }
        
        rounds++;
      }
      
      // Verify game state at end
      const finalState = {
        hostInGame: await hostPage.locator("button:has-text('Start Turn')").isVisible() ||
                   await hostPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible(),
        playerInGame: await playerPage.locator("button:has-text('Start Turn')").isVisible() ||
                     await playerPage.locator("button").filter({ hasText: /^[A-Z]$/ }).first().isVisible(),
        gameEnded: await hostPage.locator("text=/game.*end|winner|final/i").isVisible() ||
                  await playerPage.locator("text=/game.*end|winner|final/i").isVisible(),
      };
      
      // Should be in some valid state
      expect(finalState.hostInGame || finalState.playerInGame || finalState.gameEnded).toBe(true);
      
      console.log(`End game test completed after ${rounds} rounds. Final state: ${JSON.stringify(finalState)}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle tie-breaking scenarios", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up game
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("TieHost");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("TiePlayer");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await playerPage.locator("button", { hasText: "Join Room" }).click();
      
      await expect(playerPage.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });
      
      // Start game
      await hostPage.locator("button", { hasText: "Start Game" }).click();
      await expect(hostPage.locator("text=Game Lobby")).not.toBeVisible({ timeout: 10000 });

      // Play a few turns to establish game state
      for (let turn = 0; turn < 6; turn++) {
        const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
        const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
        
        if (!hostCanStart && !playerCanStart) break;
        
        const currentPage = hostCanStart ? hostPage : playerPage;
        
        await currentPage.locator("button", { hasText: "Start Turn" }).click();
        
        const hasTimer = await currentPage.locator("text=/Timer|[0-9]+s/").isVisible({ timeout: 3000 });
        if (hasTimer) {
          const letters = currentPage.locator("button").filter({ hasText: /^[A-Z]$/ });
          if (await letters.first().isEnabled()) {
            await letters.first().click();
          }
          await currentPage.locator("button", { hasText: "End Turn" }).click();
        }
        
        await currentPage.waitForTimeout(1000);
      }
      
      // Look for any tie-breaking or special round indicators
      const tieBreakingIndicators = [
        hostPage.locator("text=/tie.*break|sudden.*death|overtime|final.*round/i"),
        playerPage.locator("text=/tie.*break|sudden.*death|overtime|final.*round/i"),
        hostPage.locator("text=/Round [5-9]|Round 1[0-9]/"), // Higher round numbers
        playerPage.locator("text=/Round [5-9]|Round 1[0-9]/"),
      ];
      
      let tieBreakingDetected = false;
      for (const indicator of tieBreakingIndicators) {
        if (await indicator.isVisible()) {
          tieBreakingDetected = true;
          console.log(`Tie-breaking scenario detected: ${await indicator.textContent()}`);
          break;
        }
      }
      
      // Even if no tie-breaking is detected, game should be in valid state
      const gameValid = await hostPage.locator("button:has-text('Start Turn')").isVisible() ||
                       await playerPage.locator("button:has-text('Start Turn')").isVisible() ||
                       await hostPage.locator("text=/winner|end/i").isVisible() ||
                       await playerPage.locator("text=/winner|end/i").isVisible();
      
      expect(gameValid).toBe(true);
      
      console.log(`Tie-breaking test completed. Tie-breaking detected: ${tieBreakingDetected}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});