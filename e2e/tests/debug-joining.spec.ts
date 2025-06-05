import { test, expect } from "@playwright/test";

test.describe("Debug Room Joining", () => {
  test("should debug the room joining process step by step", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Step 1: Host creates a room
      console.log("Step 1: Creating room...");
      await hostPage.goto("/");
      await hostPage.locator('input[placeholder="Enter your name"]').fill("HostPlayer");
      await hostPage.locator("button", { hasText: "Create Room" }).click();
      
      // Wait for room creation
      await expect(hostPage.locator("text=Game Lobby")).toBeVisible({ timeout: 15000 });
      const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();
      console.log(`Step 1 Complete: Room ${roomCode} created successfully`);
      
      // Step 2: Verify host can see lobby
      await expect(hostPage.locator("text=HostPlayer")).toBeVisible();
      console.log("Step 2 Complete: Host sees their name in lobby");
      
      // Step 3: Player attempts to join immediately
      console.log(`Step 3: Player attempting to join room ${roomCode}...`);
      await playerPage.goto("/");
      await playerPage.locator('input[placeholder="Enter your name"]').fill("JoiningPlayer");
      await playerPage.locator('input[placeholder="Enter room code"]').fill(roomCode!);
      
      // Check button state before clicking
      const joinButton = playerPage.locator("button", { hasText: "Join Room" });
      const isEnabled = await joinButton.isEnabled();
      console.log(`Join button enabled: ${isEnabled}`);
      
      await joinButton.click();
      console.log("Step 3: Join button clicked");
      
      // Step 4: Monitor console logs and connection status
      console.log("Step 4: Monitoring connection status and console logs...");
      
      // Listen to console logs to see WebSocket errors
      playerPage.on('console', msg => {
        console.log(`PLAYER CONSOLE: ${msg.text()}`);
      });
      
      // Also listen to host console to see if messages arrive
      hostPage.on('console', msg => {
        console.log(`HOST CONSOLE: ${msg.text()}`);
      });
      
      await playerPage.waitForTimeout(2000);
      
      // Check current state
      const isInLobby = await playerPage.locator("text=Game Lobby").isVisible();
      const isOnMenu = await playerPage.locator("h1:has-text('Kia Tere')").isVisible();
      
      console.log(`After 2s: InLobby=${isInLobby}, OnMenu=${isOnMenu}`);
      
      // Look for any error messages or loading states
      const hasErrorText = await playerPage.locator("text=/error|failed|invalid/i").isVisible();
      console.log(`Has error text: ${hasErrorText}`);
      
      // Wait longer and check again
      await playerPage.waitForTimeout(3000);
      
      const isInLobby2 = await playerPage.locator("text=Game Lobby").isVisible();
      const isOnMenu2 = await playerPage.locator("h1:has-text('Kia Tere')").isVisible();
      
      console.log(`After 5s total: InLobby=${isInLobby2}, OnMenu=${isOnMenu2}`);
      
      if (isInLobby2) {
        console.log("SUCCESS: Player successfully joined the room!");
        
        // Verify both players see each other
        await expect(playerPage.locator("text=JoiningPlayer")).toBeVisible();
        await expect(playerPage.locator("text=HostPlayer")).toBeVisible();
        await expect(hostPage.locator("text=JoiningPlayer")).toBeVisible({ timeout: 5000 });
        
        console.log("SUCCESS: Both players can see each other in the lobby");
      } else {
        console.log("FAILED: Player did not join the room");
        
        // Try to get more debug info
        const pageContent = await playerPage.content();
        console.log("Page content:", pageContent.substring(0, 500));
      }
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});