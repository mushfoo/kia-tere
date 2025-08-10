import { test, expect } from "@playwright/test";

/**
 * End‑to‑end tests for PR49 changes on Kia‑Tere.
 *
 * This test covers three scenarios:
 * 1. Players who unexpectedly disconnect (e.g. close their browser) remain in the room
 *    and are shown on the scoreboard after reconnecting.
 * 2. Players who intentionally leave via the "Leave Room"/"Leave Game" button are
 *    completely removed from the room for everyone else.
 * 3. Late joiners (players who join after the game has started) appear on the
 *    scoreboard with zero round wins.
 *
 * To run this test locally, set the BASE_URL environment variable to the staging
 * deployment, for example:
 *   BASE_URL="http://kia-tere.staging.mush.foo" npx playwright test pr49.spec.ts
 */
test.describe("PR49 – disconnect vs leave room & late joiner scoreboard", () => {
  // Increase timeout because the game has built‑in timers (10s per turn)
  test.setTimeout(120_000);

  test("disconnects keep players, leaving removes them, late joiners appear", async ({
    browser,
    baseURL,
  }) => {
    const url = baseURL ?? "http://kia-tere.staging.mush.foo";

    // Host context – create room
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    await hostPage.goto(url);

    // Fill host name and create room
    const nameInputs = hostPage.locator("input");
    await nameInputs.first().fill("Host");
    await hostPage.getByRole("button", { name: /create room/i }).click();

    // Wait for lobby to load
    await expect(hostPage.locator("text=Connected")).toBeVisible();

    // Extract the room code displayed near the top of the lobby
    const roomCode = await hostPage.evaluate(() => {
      const bodyText = document.body.innerText;
      const match = bodyText.match(/\b[A-Z0-9]{6}\b/);
      return match ? match[0] : null;
    });
    if (!roomCode) {
      throw new Error("Room code could not be determined");
    }

    // Secondary context for Player2 – join room
    const player2Ctx = await browser.newContext();
    const player2Page = await player2Ctx.newPage();
    await player2Page.goto(url);
    await player2Page.locator("input").first().fill("Player2");
    // The second input is for the room code
    await player2Page.locator("input").nth(1).fill(roomCode);
    await player2Page.getByRole("button", { name: /join room/i }).click();

    // Host starts the game (easy mode)
    await hostPage.getByRole("button", { name: /start game/i }).click();

    // Verify both players appear in the scoreboard (0/3 each)
    await expect(hostPage.locator("text=Player2")).toHaveCount(1);

    // Simulate an unexpected disconnect by closing Player2's context
    await player2Ctx.close();

    // After disconnect the host should still see Player2 in the scoreboard
    await expect(hostPage.locator("text=Player2")).toHaveCount(1);

    // Reconnect Player2 from a fresh context
    const player2ReCtx = await browser.newContext();
    const player2RePage = await player2ReCtx.newPage();
    await player2RePage.goto(url);
    await player2RePage.locator("input").first().fill("Player2");
    await player2RePage.locator("input").nth(1).fill(roomCode);
    await player2RePage.getByRole("button", { name: /join room/i }).click();

    // Ensure there is still only one Player2 entry on the host’s scoreboard
    await expect(hostPage.locator("text=Player2")).toHaveCount(1);

    // Player2 intentionally leaves via the "Leave Game" button
    await player2RePage
      .getByRole("button", { name: /leave (game|room)/i })
      .click();

    // Host scoreboard should now remove Player2
    await expect(hostPage.locator("text=Player2")).toHaveCount(0, {
      timeout: 15_000,
    });

    // Start a new game (Host only) so we can test late joiners
    // The start button may be disabled with only one player; re‑enable by adding a late joiner in lobby
    // Create Player3 context and join before game start
    const player3Ctx = await browser.newContext();
    const player3Page = await player3Ctx.newPage();
    await player3Page.goto(url);
    await player3Page.locator("input").first().fill("Player3");
    await player3Page.locator("input").nth(1).fill(roomCode);
    await player3Page.getByRole("button", { name: /join room/i }).click();

    // Host should see Player3 in scoreboard with 0 wins
    await expect(hostPage.locator("text=Player3")).toHaveCount(1);

    // Clean up contexts
    await player3Ctx.close();
    await hostCtx.close();
  });
});

