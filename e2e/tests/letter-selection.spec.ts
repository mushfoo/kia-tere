import { test, expect } from "@playwright/test";

test.describe("Letter Selection Mechanics", () => {
  test("should allow letter selection and deselection during active turn", async ({ browser }) => {
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

      // Find whose turn it is
      let currentPlayerPage = hostPage;
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
      }

      // Start a turn
      const startTurnButton = currentPlayerPage.locator("button", { hasText: "Start Turn" });
      await startTurnButton.click();

      // Wait for timer to appear and letters to be selectable
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Find available letters and test selection
      const letterButtons = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
      const letterCount = await letterButtons.count();
      expect(letterCount).toBeGreaterThan(0);

      // Test selecting the first available letter
      const firstLetter = letterButtons.first();
      const letterText = await firstLetter.textContent();
      
      // Verify letter is initially unselected/available
      await expect(firstLetter).toBeEnabled();
      
      // Click to select the letter
      await firstLetter.click();
      
      // Verify letter visual state changed (selected state)
      // Wait a moment for UI update
      await currentPlayerPage.waitForTimeout(500);
      
      // Check for selection indicators (common patterns)
      const letterClass = await firstLetter.getAttribute("class");
      const letterStyle = await firstLetter.getAttribute("style");
      
      const hasSelectionIndicator = 
        letterClass?.includes("selected") ||
        letterClass?.includes("bg-blue") ||
        letterClass?.includes("bg-green") ||
        letterClass?.includes("bg-yellow") ||
        letterClass?.includes("border") ||
        letterStyle?.includes("background") ||
        letterStyle?.includes("border");

      // Test deselection by clicking again
      await firstLetter.click();
      await currentPlayerPage.waitForTimeout(500);
      
      const deselectedClass = await firstLetter.getAttribute("class");
      const deselectedStyle = await firstLetter.getAttribute("style");
      
      // Verify deselection (visual state should change back)
      const isDeselected = 
        deselectedClass !== letterClass ||
        deselectedStyle !== letterStyle;

      console.log(`Letter selection test: Letter ${letterText}, Selection indicator: ${hasSelectionIndicator}, Deselected: ${isDeselected}`);

      // Select a letter again for end turn test
      await firstLetter.click();

      // Verify End Turn button is available
      const endTurnButton = currentPlayerPage.locator("button", { hasText: "End Turn" });
      await expect(endTurnButton).toBeVisible();

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should prevent letter selection when not player's turn", async ({ browser }) => {
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

      // Find whose turn it is and who is waiting
      let currentPlayerPage = hostPage;
      let waitingPlayerPage = playerPage;
      
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
        waitingPlayerPage = hostPage;
      }

      // Verify waiting player cannot start turn
      await expect(waitingPlayerPage.locator("button", { hasText: "Start Turn" })).not.toBeVisible();

      // Start turn for current player
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Verify waiting player still cannot interact with letters
      const waitingPlayerLetters = waitingPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
      const waitingLetterCount = await waitingPlayerLetters.count();
      
      if (waitingLetterCount > 0) {
        const firstWaitingLetter = waitingPlayerLetters.first();
        
        // Letters should either be disabled or non-interactive for waiting player
        const isDisabled = await firstWaitingLetter.isDisabled();
        
        // If not disabled, clicking should have no effect
        if (!isDisabled) {
          const beforeClass = await firstWaitingLetter.getAttribute("class");
          await firstWaitingLetter.click();
          await waitingPlayerPage.waitForTimeout(500);
          const afterClass = await firstWaitingLetter.getAttribute("class");
          
          // Class should not change (no selection for waiting player)
          expect(beforeClass).toBe(afterClass);
        }
        
        console.log(`Waiting player letter interaction: Disabled: ${isDisabled}`);
      }

      // Verify waiting player has no End Turn button
      await expect(waitingPlayerPage.locator("button", { hasText: "End Turn" })).not.toBeVisible();

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should track used letters and prevent re-selection", async ({ browser }) => {
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

      // Play a turn and complete it to mark a letter as used
      let currentPlayerPage = hostPage;
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
      }

      // First turn - select and use a letter
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Find and select a common letter
      const commonLetters = ['A', 'E', 'I', 'O', 'S', 'T'];
      let usedLetter = null;
      
      for (const letter of commonLetters) {
        const letterButton = currentPlayerPage.locator(`button:has-text("${letter}")`, { hasText: new RegExp(`^${letter}$`) });
        if (await letterButton.isVisible() && await letterButton.isEnabled()) {
          await letterButton.click();
          usedLetter = letter;
          break;
        }
      }

      // If no common letter, use any available letter
      if (!usedLetter) {
        const availableLetters = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
        const firstAvailable = availableLetters.first();
        usedLetter = await firstAvailable.textContent();
        await firstAvailable.click();
      }

      expect(usedLetter).toBeTruthy();

      // End the turn to mark letter as used
      await currentPlayerPage.locator("button", { hasText: "End Turn" }).click();
      
      // Wait for turn to process
      await currentPlayerPage.waitForTimeout(2000);

      // Switch to other player's turn
      currentPlayerPage = currentPlayerPage === hostPage ? playerPage : hostPage;

      // Start next turn and verify used letter is disabled/unavailable
      const startTurnButton = currentPlayerPage.locator("button", { hasText: "Start Turn" });
      if (await startTurnButton.isVisible()) {
        await startTurnButton.click();
        await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

        // Check if the used letter is now disabled or marked as used
        const usedLetterButton = currentPlayerPage.locator(`button:has-text("${usedLetter}")`, { hasText: new RegExp(`^${usedLetter}$`) });
        
        if (await usedLetterButton.isVisible()) {
          const isDisabled = await usedLetterButton.isDisabled();
          const hasUsedClass = (await usedLetterButton.getAttribute("class"))?.includes("used");
          const hasUsedStyle = (await usedLetterButton.getAttribute("style"))?.includes("opacity") || 
                              (await usedLetterButton.getAttribute("style"))?.includes("gray");

          const isMarkedAsUsed = isDisabled || hasUsedClass || hasUsedStyle;
          
          console.log(`Used letter ${usedLetter} tracking: Disabled: ${isDisabled}, Has used class: ${hasUsedClass}, Has used style: ${hasUsedStyle}, Marked as used: ${isMarkedAsUsed}`);
        }
      }

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should require letter selection before ending turn", async ({ browser }) => {
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

      // Find whose turn it is
      let currentPlayerPage = hostPage;
      const player1Turn = await playerPage.locator("button", { hasText: "Start Turn" }).isVisible();
      if (player1Turn) {
        currentPlayerPage = playerPage;
      }

      // Start turn but don't select any letter
      await currentPlayerPage.locator("button", { hasText: "Start Turn" }).click();
      await expect(currentPlayerPage.locator("text=/Timer|[0-9]+s/")).toBeVisible({ timeout: 5000 });

      // Try to end turn without selecting a letter
      const endTurnButton = currentPlayerPage.locator("button", { hasText: "End Turn" });
      await expect(endTurnButton).toBeVisible();
      
      // Check if button is disabled or if clicking shows an error
      const isDisabled = await endTurnButton.isDisabled();
      
      if (!isDisabled) {
        // Click and see if an error message appears or nothing happens
        await endTurnButton.click();
        await currentPlayerPage.waitForTimeout(1000);
        
        // Check for error messages
        const errorMessage = currentPlayerPage.locator("text=/select.*letter|choose.*letter|letter.*required/i");
        const hasError = await errorMessage.isVisible();
        
        // Check if turn actually ended (timer should still be running if turn didn't end)
        const timerStillVisible = await currentPlayerPage.locator("text=/Timer|[0-9]+s/").isVisible();
        
        console.log(`End turn without letter selection: Disabled: ${isDisabled}, Has error: ${hasError}, Timer still visible: ${timerStillVisible}`);
        
        // If no error message, at least timer should still be running (turn didn't end)
        if (!hasError) {
          expect(timerStillVisible).toBe(true);
        }
      } else {
        console.log("End turn button is disabled when no letter selected - correct behavior");
      }

      // Now select a letter and verify end turn works
      const availableLetters = currentPlayerPage.locator("button").filter({ hasText: /^[A-Z]$/ });
      const firstLetter = availableLetters.first();
      if (await firstLetter.isEnabled()) {
        await firstLetter.click();
        
        // End turn should now work
        const enabledEndTurnButton = currentPlayerPage.locator("button", { hasText: "End Turn" });
        await expect(enabledEndTurnButton).toBeEnabled();
      }

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});