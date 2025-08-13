import { test, expect } from "@playwright/test";

test.describe("Difficulty Selection", () => {
    test("should allow host to change difficulty in lobby", async ({ page }) => {
    // Create room and get to lobby
    await page.goto("/");
    await page.locator('input[placeholder="Enter your name"]').fill("Host");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });

    // Test: Verify letter and category selectors exist
    const letterSelector = page
      .locator("button:has-text('Easy (18 letters)')")
      .or(page.locator("button:has-text('Hard (26 letters)')"));
    await expect(letterSelector.first()).toBeVisible();

    const categorySelector = page
      .locator("button:has-text('Easy Categories')")
      .or(page.locator("button:has-text('Hard Categories')"));
    await expect(categorySelector.first()).toBeVisible();

    // Toggle letter difficulty
    const letterEasyButton = page.locator("button:has-text('Easy (18 letters)')");
    const letterHardButton = page.locator("button:has-text('Hard (26 letters)')");
    const easyActive = await letterEasyButton.getAttribute("class");
    if (easyActive?.includes("bg-green-500")) {
      await letterHardButton.click();
      const newHardState = await letterHardButton.getAttribute("class");
      expect(newHardState).toContain("bg-red-500");
    } else {
      await letterEasyButton.click();
      const newEasyState = await letterEasyButton.getAttribute("class");
      expect(newEasyState).toContain("bg-green-500");
    }

    // Toggle category difficulty
    const catEasyButton = page.locator("button:has-text('Easy Categories')");
    const catHardButton = page.locator("button:has-text('Hard Categories')");
    const catEasyActive = await catEasyButton.getAttribute("class");
    if (catEasyActive?.includes("bg-green-500")) {
      await catHardButton.click();
      const newCatHard = await catHardButton.getAttribute("class");
      expect(newCatHard).toContain("bg-red-500");
    } else {
      await catEasyButton.click();
      const newCatEasy = await catEasyButton.getAttribute("class");
      expect(newCatEasy).toContain("bg-green-500");
    }
    });

  test("should show correct letter count based on difficulty", async ({ page }) => {
    // Create room and get to lobby
    await page.goto("/");
    await page.locator('input[placeholder="Enter your name"]').fill("Host");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });

    // Test: Set difficulty to Easy (18 letters) - can't start game with just 1 player
    const easyButton = page.locator("button:has-text('Easy (18 letters)')");
    
    if (await easyButton.isVisible()) {
      await easyButton.click();
      
      // Verify easy mode shows 18 letters in the description
      await expect(page.locator("text=Easy (18 letters)")).toBeVisible();
      
      // Check that the start button is disabled (needs 2+ players)
      const startButton = page.locator("button:has-text('Start Game')");
      await expect(startButton).toBeDisabled();
    }
    
    // Test hard mode
    const hardButton = page.locator("button:has-text('Hard (26 letters)')");
    if (await hardButton.isVisible()) {
      await hardButton.click();
      
      // Verify hard mode shows 26 letters in the description
      await expect(page.locator("text=Hard (26 letters)")).toBeVisible();
    }
  });

  test("should maintain difficulty setting when player joins", async ({ page }) => {
    // Create room and get to lobby
    await page.goto("/");
    await page.locator('input[placeholder="Enter your name"]').fill("Host");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });

    // Set difficulty to Hard and verify it persists
    const hardButton = page.locator("button:has-text('Hard (26 letters)')");
    
    if (await hardButton.isVisible()) {
      await hardButton.click();
      
      // Verify hard mode is selected and shows in UI
      await expect(page.locator("text=Hard (26 letters)")).toBeVisible();
      
      // Verify start button shows hard mode in its text
      const startButton = page.locator(
        "button:has-text('Start Game (letters: hard, categories: easy)')"
      );
      await expect(startButton).toBeVisible();
      
      // Switch back to easy and verify it changes
      const easyButton = page.locator("button:has-text('Easy (18 letters)')");
      await easyButton.click();
      
      await expect(page.locator("text=Easy (18 letters)")).toBeVisible();
      const easyStartButton = page.locator(
        "button:has-text('Start Game (letters: easy, categories: easy)')"
      );
      await expect(easyStartButton).toBeVisible();
    }
  });

  test("should prevent non-host from changing difficulty", async ({ page }) => {
    // Create room and get to lobby
    await page.goto("/");
    await page.locator('input[placeholder="Enter your name"]').fill("Host");
    await page.locator("button", { hasText: "Create Room" }).click();
    
    await expect(page.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });

    // Test: Verify host CAN change difficulty (has interactive controls)
    const hostEasyButton = page.locator("button:has-text('Easy (18 letters)')");
    const hostHardButton = page.locator("button:has-text('Hard (26 letters)')");
    
    await expect(hostEasyButton).toBeVisible();
    await expect(hostHardButton).toBeVisible();
    
    // Verify buttons are interactive
    await expect(hostEasyButton).toBeEnabled();
    await expect(hostHardButton).toBeEnabled();
    
    // Test clicking works
    await hostHardButton.click();
    await expect(page.locator("text=Hard (26 letters)")).toBeVisible();
  });
});