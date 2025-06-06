import { test, expect } from "@playwright/test";

test.describe("Turn Mechanics", () => {
  test("should properly rotate turns between players", async ({ browser }) => {
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

      // Track turn order for multiple turns
      const turnOrder = [];

      for (let turn = 0; turn < 4; turn++) {
        // Determine whose turn it is
        const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
        const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
        
        expect(hostCanStart || playerCanStart).toBe(true);
        expect(hostCanStart && playerCanStart).toBe(false); // Only one should be true

        let currentPlayerPage;
        let currentPlayerName;
        
        if (hostCanStart) {
          currentPlayerPage = hostPage;
          currentPlayerName = "Host";
          // Verify player1 cannot start turn
          await expect(playerPage.locator("button", { hasText: "Start Turn" })).not.toBeVisible();
        } else {
          currentPlayerPage = playerPage;
          currentPlayerName = "Player1";
          // Verify host cannot start turn
          await expect(hostPage.locator("button", { hasText: "Start Turn" })).not.toBeVisible();
        }

        turnOrder.push(currentPlayerName);
        console.log(`Turn ${turn + 1}: ${currentPlayerName}'s turn`);

        // Execute the turn
        await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
        await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

        // Select a letter
        const letterButtons = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
        let letterSelected = false;
        
        for (let i = 0; i < Math.min(5, await letterButtons.count()); i++) {
          const letterButton = letterButtons.nth(i);
          if (await letterButton.isEnabled()) {
            await letterButton.click();
            letterSelected = true;
            break;
          }
        }

        expect(letterSelected).toBe(true);

        // End turn
        await currentPlayerPage.locator("button", { hasText: "End Turn" }).click();
        
        // Wait for turn to process
        await currentPlayerPage.waitForTimeout(2000);
      }

      // Verify turns alternated between players
      console.log("Turn order:", turnOrder);
      
      // Check that turns alternate (not the same player twice in a row)
      for (let i = 1; i < turnOrder.length; i++) {
        expect(turnOrder[i]).not.toBe(turnOrder[i - 1]);
      }

      // Both players should have had turns
      expect(turnOrder.includes("Host")).toBe(true);
      expect(turnOrder.includes("Player1")).toBe(true);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should show clear visual indicators of whose turn it is", async ({ browser }) => {
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

      // Check visual indicators for whose turn it is
      const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
      const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      
      let currentPlayerPage = hostCanStart ? hostPage : playerPage;
      let waitingPlayerPage = hostCanStart ? playerPage : hostPage;
      let currentPlayerName = hostCanStart ? "Host" : "Player1";

      // Current player should have clear indicators
      await expect(currentPlayerPage.locator("button", { hasText: "Start Turn" })).toBeVisible();

      // Look for additional turn indicators
      const turnIndicators = [
        currentPlayerPage.locator("text=/your turn/i"),
        currentPlayerPage.locator("text=/turn.*Host|turn.*Player1/i"),
        currentPlayerPage.locator(`text=/${currentPlayerName}.*turn|turn.*${currentPlayerName}/i`),
        currentPlayerPage.locator("[class*='current'], [class*='active'], [class*='turn']"),
      ];

      let hasVisualIndicator = false;
      for (const indicator of turnIndicators) {
        if (await indicator.isVisible()) {
          hasVisualIndicator = true;
          console.log(`Found turn indicator: ${await indicator.textContent()}`);
          break;
        }
      }

      // At minimum, the Start Turn button should be a visual indicator
      expect(hasVisualIndicator).toBe(true);

      // Waiting player should NOT have start turn button
      await expect(waitingPlayerPage.locator("button", { hasText: "Start Turn" })).not.toBeVisible();

      // Start turn and verify active turn indicators
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // During active turn, should have timer and end turn button
      await expect(currentPlayerPage.locator("button", { hasText: "End Turn" })).toBeVisible();
      
      // Waiting player should see different state (no timer, no end turn)
      await expect(waitingPlayerPage.locator("button", { hasText: "End Turn" })).not.toBeVisible();

      console.log(`Turn indicator test: Player ${currentPlayerName} has visual indicator: ${hasVisualIndicator}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should handle turn transitions smoothly", async ({ browser }) => {
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

      // Execute one complete turn and verify smooth transition
      let currentPlayerPage = hostPage;
      let nextPlayerPage = playerPage;
      
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
        nextPlayerPage = hostPage;
      }

      // Complete first turn
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Select letter and end turn
      const letterButtons = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
      const firstAvailableLetter = letterButtons.first();
      await firstAvailableLetter.click();
      await currentPlayerPage.locator("button", { hasText: "End Turn" }).click();

      // Verify transition happens - next player should get start turn button
      await expect(nextPlayerPage.locator("button", { hasText: "Start Turn" })).toBeVisible({ timeout: 5000 });
      
      // Previous player should no longer have start turn button
      await expect(currentPlayerPage.locator("button", { hasText: "Start Turn" })).not.toBeVisible();
      
      // Timer should be gone from previous player
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).not.toBeVisible();

      // Verify state synchronization - both players see the used letter
      const usedLetterText = await firstAvailableLetter.textContent();
      
      // Check if letter is marked as used on both clients
      const currentPlayerUsedLetter = currentPlayerPage.locator(`button:has-text("${usedLetterText}")`, { hasText: new RegExp(`^${usedLetterText}$`) });
      const nextPlayerUsedLetter = nextPlayerPage.locator(`button:has-text("${usedLetterText}")`, { hasText: new RegExp(`^${usedLetterText}$`) });

      // Both should see the letter (may be disabled/marked as used)
      await expect(currentPlayerUsedLetter).toBeVisible();
      await expect(nextPlayerUsedLetter).toBeVisible();

      console.log(`Turn transition test completed successfully. Used letter: ${usedLetterText}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should prevent multiple simultaneous turns", async ({ browser }) => {
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

      // Verify only one player can start a turn at any time
      const hostCanStart = await hostPage.locator("button", { hasText: "Start Turn" }).isVisible();
      const playerCanStart = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      
      // Exactly one should be true, not both
      expect(hostCanStart || playerCanStart).toBe(true);
      expect(hostCanStart && playerCanStart).toBe(false);

      // Start turn with the active player
      let currentPlayerPage = hostCanStart ? hostPage : playerPage;
      let otherPlayerPage = hostCanStart ? playerPage : hostPage;

      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Verify other player definitely cannot start turn during active turn
      await expect(otherPlayerPage.locator("button", { hasText: "Start Turn" })).not.toBeVisible();

      // Verify other player has no timer
      await expect(otherPlayerPage.locator("text=/Timer|[0-9]+s/")).not.toBeVisible();

      // Verify other player has no end turn button
      await expect(otherPlayerPage.locator("button", { hasText: "End Turn" })).not.toBeVisible();

      // Current player should have end turn button
      await expect(currentPlayerPage.locator("button", { hasText: "End Turn" })).toBeVisible();

      console.log("Simultaneous turn prevention test passed - only one player can be active at a time");

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});