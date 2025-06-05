import { test, expect } from '@playwright/test';

test.describe('Room Creation', () => {
  test('should create a new room and navigate to lobby', async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    
    // Verify we're on the main menu
    await expect(page.locator('h1')).toContainText('Kia Tere');
    
    // Fill in player name
    const playerNameInput = page.locator('input[placeholder="Enter your name"]');
    await expect(playerNameInput).toBeVisible();
    await playerNameInput.fill('TestPlayer');
    
    // Click create room button
    const createRoomButton = page.getByTestId('create-room-button');
    await expect(createRoomButton).toBeVisible();
    await createRoomButton.click();
    
    // Wait for WebSocket connection and room creation
    // We should see the lobby page with room code
    await expect(page.locator('h1', { hasText: 'Game Lobby' })).toBeVisible({ timeout: 10000 });
    
    // Verify room code is displayed (6 character alphanumeric)
    const roomCodeElement = page.getByTestId('room-code');
    await expect(roomCodeElement).toBeVisible();
    await expect(roomCodeElement).toHaveText(/^[A-Z0-9]{6}$/);
    
    // Verify player is listed as host
    await expect(page.locator('text=TestPlayer (Host)')).toBeVisible();
    
    // Verify start game button is visible for host
    await expect(page.locator('button', { hasText: 'Start Game' })).toBeVisible();
  });

  test('should handle WebSocket connection errors gracefully', async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    
    // Fill in player name
    await page.locator('input[placeholder="Enter your name"]').fill('ErrorTestPlayer');
    
    // Mock a WebSocket failure scenario by intercepting WebSocket connections
    await page.evaluate(() => {
      // Override WebSocket to simulate connection failure
      const originalWebSocket = window.WebSocket;
      window.WebSocket = class extends originalWebSocket {
        constructor(url: string) {
          super(url);
          // Simulate immediate connection failure
          setTimeout(() => {
            this.dispatchEvent(new Event('error'));
            this.dispatchEvent(new CloseEvent('close', { code: 1006 }));
          }, 100);
        }
      };
    });
    
    // Click create room button
    await page.getByTestId('create-room-button').click();
    
    // Verify we don't navigate to lobby on WebSocket failure
    // Should stay on main menu
    await expect(page.locator('h1')).toContainText('Kia Tere');
    
    // Should not see lobby elements
    await expect(page.locator('h1', { hasText: 'Game Lobby' })).not.toBeVisible();
  });
});