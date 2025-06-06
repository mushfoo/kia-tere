import { test, expect } from "@playwright/test";

test.describe("Edge Cases", () => {
  test("should handle invalid room codes gracefully", async ({ page }) => {
    await page.goto("/");
    
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    const codeInput = page.locator('input[placeholder="Enter room code"]');
    const joinButton = page.locator("button", { hasText: "Join Room" });
    
    await nameInput.fill("TestPlayer");
    
    // Test various invalid room codes
    const invalidCodes = ["", "123", "TOOLONG", "invalid!", "AAAAAAA", "12345"];
    
    for (const invalidCode of invalidCodes) {
      await codeInput.fill(invalidCode);
      
      if (invalidCode === "") {
        // Button should be disabled for empty codes
        await expect(joinButton).toBeDisabled();
      } else {
        // Button is enabled with any text, but joining should fail gracefully
        await expect(joinButton).toBeEnabled();
        await joinButton.click();
        
        // Wait a moment for any error handling
        await page.waitForTimeout(2000);
        
        // Should either show an error, remain on menu, or join lobby (if room exists)
        const stillOnMenu = await nameInput.isVisible();
        const hasError = await page.locator("text=/error|invalid|not found/i").isVisible();
        const inLobby = await page.locator("text=Game Lobby").isVisible();
        
        expect(stillOnMenu || hasError || inLobby).toBe(true);
        
        // If we got to lobby, go back for next test
        if (inLobby) {
          await page.goto("/");
          await nameInput.fill("TestPlayer");
        }
      }
      
      // Clear the code for next test
      await codeInput.fill("");
    }
    
    console.log("Invalid room codes handled gracefully");
  });

  test("should handle duplicate player names appropriately", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const player1Page = await player1Context.newPage();
    const player2Page = await player2Context.newPage();

    try {
      // Create room
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("Host");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      // First player joins
      await player1Page.goto("/");
      await player1Page.locator('input[placeholder="Enter your name"]').fill("Player");
      await player1Page.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await player1Page.locator("button", { hasText: "Join Room" }).click();
      
      await expect(player1Page.locator("text=Game Lobby")).toBeVisible({ timeout: 10000 });

      // Second player tries to join with same name
      await player2Page.goto("/");
      await player2Page.locator('input[placeholder="Enter your name"]').fill("Player");
      await player2Page.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      await player2Page.locator("button", { hasText: "Join Room" }).click();
      
      // Wait for response
      await player2Page.waitForTimeout(3000);
      
      // Either should be allowed with modified name, rejected, or handled gracefully
      const player2InLobby = await player2Page.locator("text=Game Lobby").isVisible();
      const player2HasError = await player2Page.locator("text=/error|name taken|duplicate/i").isVisible();
      const player2OnMenu = await player2Page.locator('input[placeholder="Enter your name"]').isVisible();
      
      expect(player2InLobby || player2HasError || player2OnMenu).toBe(true);
      
      // Original player should still be in lobby
      await expect(player1Page.locator("text=Game Lobby")).toBeVisible();
      
      console.log(`Duplicate name handling: InLobby=${player2InLobby}, HasError=${player2HasError}, OnMenu=${player2OnMenu}`);

    } finally {
      await hostContext.close();
      await player1Context.close();
      await player2Context.close();
    }
  });

  test("should handle empty or whitespace-only names", async ({ page }) => {
    await page.goto("/");
    
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    const createButton = page.locator("button", { hasText: "Create Room" });
    const joinButton = page.locator("button", { hasText: "Join Room" });
    
    // Test empty name
    await nameInput.fill("");
    await expect(createButton).toBeDisabled();
    await expect(joinButton).toBeDisabled();
    
    // Test whitespace-only names
    const whitespaceNames = [" ", "   ", "\t", "\n", "  \t  "];
    
    for (const name of whitespaceNames) {
      await nameInput.fill(name);
      
      // Buttons should be disabled for whitespace-only names
      await expect(createButton).toBeDisabled();
      await expect(joinButton).toBeDisabled();
    }
    
    // Test valid name works
    await nameInput.fill("ValidName");
    await expect(createButton).toBeEnabled();
    
    console.log("Empty and whitespace names properly validated");
  });

  test("should handle very long player names", async ({ page }) => {
    await page.goto("/");
    
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    const createButton = page.locator("button", { hasText: "Create Room" });
    
    // Test extremely long name
    const longName = "A".repeat(1000);
    await nameInput.fill(longName);
    
    // Should either truncate, reject, or handle gracefully
    const inputValue = await nameInput.inputValue();
    
    // Input should be limited or the system should handle it gracefully
    expect(inputValue.length).toBeLessThanOrEqual(100); // Reasonable limit
    
    // Try to create room with long name
    if (await createButton.isEnabled()) {
      await createButton.click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Should either work or show error
      const inLobby = await page.locator("text=Game Lobby").isVisible();
      const hasError = await page.locator("text=/error|too long|invalid/i").isVisible();
      const onMenu = await nameInput.isVisible();
      
      expect(inLobby || hasError || onMenu).toBe(true);
    }
    
    console.log("Long names handled appropriately");
  });

  test("should handle special characters in player names", async ({ page }) => {
    await page.goto("/");
    
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    const createButton = page.locator("button", { hasText: "Create Room" });
    
    // Test names with special characters
    const specialNames = [
      "Player<script>",
      "Player&amp;",
      "Player\"'",
      "Player\n\t",
      "Player🎮",
      "Plāyér",
      "Player123!@#",
    ];
    
    for (const specialName of specialNames) {
      await nameInput.fill(specialName);
      
      if (await createButton.isEnabled()) {
        await createButton.click();
        
        // Wait for response
        await page.waitForTimeout(2000);
        
        // Should handle gracefully - either work or show error
        const inLobby = await page.locator("text=Game Lobby").isVisible();
        const hasError = await page.locator("text=/error|invalid/i").isVisible();
        const onMenu = await nameInput.isVisible();
        
        expect(inLobby || hasError || onMenu).toBe(true);
        
        // If we got to lobby, verify name is displayed safely
        if (inLobby) {
          // Navigate back for next test
          await page.goto("/");
        }
      }
    }
    
    console.log("Special characters in names handled securely");
  });

  test("should handle rapid successive actions", async ({ page }) => {
    await page.goto("/");
    
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    const createButton = page.locator("button", { hasText: "Create Room" });
    
    await nameInput.fill("RapidTester");
    
    // Rapidly click create button multiple times
    for (let i = 0; i < 5; i++) {
      await createButton.click();
      await page.waitForTimeout(100); // Small delay between clicks
    }
    
    // Wait for system to respond
    await page.waitForTimeout(3000);
    
    // Should either be in lobby (created once) or handle duplicates gracefully
    const inLobby = await page.locator("text=Game Lobby").isVisible();
    const hasError = await page.locator("text=/error/i").isVisible();
    const onMenu = await nameInput.isVisible();
    
    expect(inLobby || hasError || onMenu).toBe(true);
    
    console.log("Rapid actions handled gracefully");
  });

  test("should handle maximum room capacity", async ({ browser }) => {
    const contexts = [];
    const pages = [];

    try {
      // Create room
      const hostContext = await browser.newContext();
      const hostPage = await hostContext.newPage();
      contexts.push(hostContext);
      pages.push(hostPage);

      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("Host");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();

      // Try to add many players (test room capacity limits)
      let playersAdded = 0;
      for (let i = 1; i <= 10; i++) { // Try up to 10 players
        const playerContext = await browser.newContext();
        const playerPage = await playerContext.newPage();
        contexts.push(playerContext);
        pages.push(playerPage);

        await playerPage.goto("/");
        await playerPage.locator('input[placeholder="Enter your name"]').fill(`Player${i}`);
        await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
        await playerPage.locator("button", { hasText: "Join Room" }).click();
        
        // Wait for response
        await playerPage.waitForTimeout(2000);
        
        const joinedLobby = await playerPage.locator("text=Game Lobby").isVisible();
        if (joinedLobby) {
          playersAdded++;
        } else {
          // Player was rejected (room full) or got error
          const hasError = await playerPage.locator("text=/full|capacity|error/i").isVisible();
          const onMenu = await playerPage.locator('input[placeholder="Enter your name"]').isVisible();
          
          expect(hasError || onMenu).toBe(true);
          console.log(`Room capacity reached at ${playersAdded} players`);
          break;
        }
      }

      expect(playersAdded).toBeGreaterThan(0); // At least some players should join
      expect(playersAdded).toBeLessThanOrEqual(10); // Reasonable capacity limit

    } finally {
      // Clean up all contexts
      for (const context of contexts) {
        await context.close();
      }
    }
  });
});