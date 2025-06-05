# Test info

- Name: Room Creation >> should create a new room and navigate to lobby
- Location: /Users/campbellrehu/dev/github.com/campbell-rehu/kia-tere/e2e/tests/room-creation.spec.ts:4:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=TestPlayer (Host)')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('text=TestPlayer (Host)')

    at /Users/campbellrehu/dev/github.com/campbell-rehu/kia-tere/e2e/tests/room-creation.spec.ts:33:58
```

# Page snapshot

```yaml
- heading "Game Lobby" [level=1]
- text: XATO73
- button "Copy room code":
  - img
- img
- text: Connected
- img
- heading "Players (0)" [level=2]
- text: Difficulty Level
- button "Easy (18 letters)"
- button "Hard (26 letters)"
- text: Common letters only - easier to find words
- button "Start Game (easy mode)" [disabled]:
  - img
  - text: Start Game (easy mode)
- button "Leave Room"
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
  17 |     const createRoomButton = page.locator('button', { hasText: 'Create Room' });
  18 |     await expect(createRoomButton).toBeVisible();
  19 |     await createRoomButton.click();
  20 |     
  21 |     // Wait for WebSocket connection and room creation
  22 |     // We should see a room code appear, indicating we're in the lobby
  23 |     await expect(page.locator('text=/Room Code|[A-Z0-9]{6}/')).toBeVisible({ timeout: 10000 });
  24 |     
  25 |     // Verify room code is displayed (6 character alphanumeric) 
  26 |     // Look for room code in the UI - it should be displayed prominently
  27 |     const roomCodeElement = page.locator('[class*="font-mono"]').or(
  28 |       page.locator('text=/^[A-Z0-9]{6}$/')
  29 |     );
  30 |     await expect(roomCodeElement).toBeVisible();
  31 |     
  32 |     // Verify player is listed as host  
> 33 |     await expect(page.locator('text=TestPlayer (Host)')).toBeVisible();
     |                                                          ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  34 |     
  35 |     // Verify start game button is visible for host
  36 |     await expect(page.locator('button', { hasText: 'Start Game' })).toBeVisible();
  37 |   });
  38 |
  39 |   test('should show main menu with required elements', async ({ page }) => {
  40 |     // Navigate to the game
  41 |     await page.goto('/');
  42 |     
  43 |     // Verify main menu elements are present
  44 |     await expect(page.locator('h1')).toContainText('Kia Tere');
  45 |     await expect(page.locator('input[placeholder="Enter your name"]')).toBeVisible();
  46 |     await expect(page.locator('button', { hasText: 'Create Room' })).toBeVisible();
  47 |     await expect(page.locator('button', { hasText: 'Join Room' })).toBeVisible();
  48 |     
  49 |     // Verify create room button is initially disabled when no name is entered
  50 |     const createButton = page.locator('button', { hasText: 'Create Room' });
  51 |     await expect(createButton).toBeDisabled();
  52 |     
  53 |     // Fill in name and verify button becomes enabled
  54 |     await page.locator('input[placeholder="Enter your name"]').fill('TestUser');
  55 |     await expect(createButton).toBeEnabled();
  56 |   });
  57 | });
```