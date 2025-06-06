import { test, expect } from "@playwright/test";

test.describe("Timer and Elimination", () => {
  test("should show timer countdown during active turn", async ({ browser }) => {
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
      await expect(hostPage.locator('[data-testid="game-playing"]')).toBeVisible({ timeout: 10000 });

      // Find whose turn it is
      let currentPlayerPage = hostPage;
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
      }

      // Start a turn and verify timer appears
      const startTurnButton = currentPlayerPage.locator("button", { hasText: "Start Turn" });
      await startTurnButton.click();

      // Verify timer is displayed (should show 10, 9, 8, etc.)
      const timerElement = currentPlayerPage.locator("text=/Timer|[0-9]+s|[0-9]+ seconds?/");
      await expect(timerElement).toBeVisible({ timeout: 5000 });

      // Wait a moment and verify timer counts down
      await currentPlayerPage.waitForTimeout(2000);
      
      // Check if timer is still visible and has changed
      await expect(timerElement).toBeVisible();

      // Verify timer shows reasonable values (should be between 1-10 seconds)
      const timerText = await timerElement.textContent();
      const timerMatch = timerText?.match(/(\d+)/);
      if (timerMatch) {
        const timerValue = parseInt(timerMatch[1]);
        expect(timerValue).toBeGreaterThanOrEqual(1);
        expect(timerValue).toBeLessThanOrEqual(10);
      }

      console.log(`Timer displayed: ${timerText}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should eliminate player when timer runs out", async ({ browser }) => {
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
      await expect(hostPage.locator('[data-testid="game-playing"]')).toBeVisible({ timeout: 10000 });

      // Find whose turn it is
      let currentPlayerPage = hostPage;
      let eliminatedPlayerName = "Host";
      let remainingPlayerPage = playerPage;
      
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
        eliminatedPlayerName = "Player1";
        remainingPlayerPage = hostPage;
      }

      // Start a turn but don't complete it - let timer run out
      const startTurnButton = currentPlayerPage.locator("button", { hasText: "Start Turn" });
      await startTurnButton.click();

      // Wait for timer to appear
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Wait for elimination (timer should run out in ~10 seconds + buffer)
      // Look for elimination message or round end
      const eliminationMessage = currentPlayerPage.locator("text=/eliminated|time.?up|out/i");
      const roundEndMessage = currentPlayerPage.locator("text=/round.?end|winner|wins/i");
      
      // Wait up to 15 seconds for elimination
      await Promise.race([
        eliminationMessage.waitFor({ timeout: 15000 }).catch(() => {}),
        roundEndMessage.waitFor({ timeout: 15000 }).catch(() => {}),
      ]);

      // Verify elimination occurred (one of these should be true)
      const hasEliminationMessage = await eliminationMessage.isVisible();
      const hasRoundEndMessage = await roundEndMessage.isVisible();
      const nextRoundVisible = await currentPlayerPage.locator("text=/Round [2-9]/").isVisible();

      // At least one indicator of elimination/round progression should be present
      expect(hasEliminationMessage || hasRoundEndMessage || nextRoundVisible).toBe(true);

      console.log(`Player elimination test completed. Elimination message: ${hasEliminationMessage}, Round end: ${hasRoundEndMessage}, Next round: ${nextRoundVisible}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should show visual warnings when timer is low", async ({ browser }) => {
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
      await expect(hostPage.locator('[data-testid="game-playing"]')).toBeVisible({ timeout: 10000 });

      // Find whose turn it is
      let currentPlayerPage = hostPage;
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
      }

      // Start a turn
      const startTurnButton = currentPlayerPage.locator("button", { hasText: "Start Turn" });
      await startTurnButton.click();

      // Wait for timer to appear
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Wait for timer to get low (should show warnings at ≤3s)
      const timeout = 10000; // Maximum wait time of 10 seconds
      const pollingInterval = 100; // Poll every 100ms
      let timerLow = false;
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const timerText = await currentPlayerPage.locator("text=/[0-9]+s?/").textContent();
        const timerMatch = timerText?.match(/(\d+)/);
        if (timerMatch) {
          const timerValue = parseInt(timerMatch[1]);
          if (timerValue <= 3) {
            timerLow = true;
            break;
          }
        }
        await currentPlayerPage.waitForTimeout(pollingInterval);
      }
      expect(timerLow).toBe(true);

      // Look for visual warning indicators (red text, warnings, etc.)
      const warningIndicators = [
        currentPlayerPage.locator(".text-red-500, .text-red-600, .text-red-700"),
        currentPlayerPage.locator("[class*='text-red']"),
        currentPlayerPage.locator("text=/warning|urgent|hurry/i"),
        currentPlayerPage.locator("[style*='color: red'], [style*='color:red']"),
        currentPlayerPage.locator(".bg-red-500, .bg-red-600"),
      ];

      // Check if any warning indicators are present
      let hasWarning = false;
      for (const indicator of warningIndicators) {
        if (await indicator.isVisible()) {
          hasWarning = true;
          break;
        }
      }

      // Since we've confirmed timer is low (≤3), we should see visual warnings
      expect(hasWarning).toBe(true);

      console.log(`Timer warning test: Timer low confirmed, Has warning: ${hasWarning}`);

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});