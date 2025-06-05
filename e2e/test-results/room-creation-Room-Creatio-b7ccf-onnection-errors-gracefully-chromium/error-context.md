# Test info

- Name: Room Creation >> should handle WebSocket connection errors gracefully
- Location: /Users/campbellrehu/dev/github.com/campbell-rehu/kia-tere/e2e/tests/room-creation.spec.ts:37:7

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('create-room-button')

    at /Users/campbellrehu/dev/github.com/campbell-rehu/kia-tere/e2e/tests/room-creation.spec.ts:61:50
```

# Page snapshot

```yaml
- heading "Kia Tere" [level=1]
- paragraph: Fast-paced multiplayer word game
- text: Your Name
- textbox "Enter your name": ErrorTestPlayer
- button "Create Room"
- text: or Room Code
- textbox "Enter room code"
- button "Join Room" [disabled]
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Room Creation', () => {
   4 |   test('should create a new room and navigate to lobby', async ({ page }) => {
   5 |     // Navigate to the game
   6 |     await page.goto('/');
   7 |     
   8 |     // Verify we're on the main menu
   9 |     await expect(page.locator('h1')).toContainText('Kia Tere');
  10 |     
  11 |     // Fill in player name
  12 |     const playerNameInput = page.locator('input[placeholder="Enter your name"]');
  13 |     await expect(playerNameInput).toBeVisible();
  14 |     await playerNameInput.fill('TestPlayer');
  15 |     
  16 |     // Click create room button
  17 |     const createRoomButton = page.getByTestId('create-room-button');
  18 |     await expect(createRoomButton).toBeVisible();
  19 |     await createRoomButton.click();
  20 |     
  21 |     // Wait for WebSocket connection and room creation
  22 |     // We should see the lobby page with room code
  23 |     await expect(page.locator('h1', { hasText: 'Game Lobby' })).toBeVisible({ timeout: 10000 });
  24 |     
  25 |     // Verify room code is displayed (6 character alphanumeric)
  26 |     const roomCodeElement = page.getByTestId('room-code');
  27 |     await expect(roomCodeElement).toBeVisible();
  28 |     await expect(roomCodeElement).toHaveText(/^[A-Z0-9]{6}$/);
  29 |     
  30 |     // Verify player is listed as host
  31 |     await expect(page.locator('text=TestPlayer (Host)')).toBeVisible();
  32 |     
  33 |     // Verify start game button is visible for host
  34 |     await expect(page.locator('button', { hasText: 'Start Game' })).toBeVisible();
  35 |   });
  36 |
  37 |   test('should handle WebSocket connection errors gracefully', async ({ page }) => {
  38 |     // Navigate to the game
  39 |     await page.goto('/');
  40 |     
  41 |     // Fill in player name
  42 |     await page.locator('input[placeholder="Enter your name"]').fill('ErrorTestPlayer');
  43 |     
  44 |     // Mock a WebSocket failure scenario by intercepting WebSocket connections
  45 |     await page.evaluate(() => {
  46 |       // Override WebSocket to simulate connection failure
  47 |       const originalWebSocket = window.WebSocket;
  48 |       window.WebSocket = class extends originalWebSocket {
  49 |         constructor(url: string) {
  50 |           super(url);
  51 |           // Simulate immediate connection failure
  52 |           setTimeout(() => {
  53 |             this.dispatchEvent(new Event('error'));
  54 |             this.dispatchEvent(new CloseEvent('close', { code: 1006 }));
  55 |           }, 100);
  56 |         }
  57 |       };
  58 |     });
  59 |     
  60 |     // Click create room button
> 61 |     await page.getByTestId('create-room-button').click();
     |                                                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  62 |     
  63 |     // Verify we don't navigate to lobby on WebSocket failure
  64 |     // Should stay on main menu
  65 |     await expect(page.locator('h1')).toContainText('Kia Tere');
  66 |     
  67 |     // Should not see lobby elements
  68 |     await expect(page.locator('h1', { hasText: 'Game Lobby' })).not.toBeVisible();
  69 |   });
  70 | });
```