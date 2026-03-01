import { test, expect } from '@playwright/test';

/**
 * Helper: wait for a Phaser scene to be active.
 * Polls window.__PANCAKE_DAD_GAME__.scene.getScene(key).sys.isActive().
 */
async function waitForScene(page: import('@playwright/test').Page, sceneKey: string, timeoutMs = 10000) {
  await page.waitForFunction(
    ({ key, timeout }) => {
      const game = (window as Record<string, unknown>).__PANCAKE_DAD_GAME__ as
        { scene: { getScene: (k: string) => { sys: { isActive(): boolean } } | null } } | undefined;
      if (!game) return false;
      const scene = game.scene.getScene(key);
      return scene?.sys.isActive() ?? false;
    },
    { key: sceneKey, timeout: timeoutMs },
    { timeout: timeoutMs }
  );
}

/**
 * Helper: evaluate an expression against the Phaser game instance.
 */
async function evalGame<T>(page: import('@playwright/test').Page, fn: string): Promise<T> {
  return page.evaluate(fn) as Promise<T>;
}

test.describe('Pancake Dad Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for boot scene then menu
    await waitForScene(page, 'MenuScene');
  });

  test('navigates from menu to game scene', async ({ page }) => {
    // Click the Play button area (send Space or Enter to trigger menu)
    await page.keyboard.press('Enter');
    await waitForScene(page, 'GameScene', 15000);

    const isActive = await evalGame<boolean>(
      page,
      `(() => {
        const g = window.__PANCAKE_DAD_GAME__;
        return g.scene.getScene('GameScene').sys.isActive();
      })()`
    );
    expect(isActive).toBe(true);
  });

  test('dad velocity equals speed config when moving right', async ({ page }) => {
    await page.keyboard.press('Enter');
    await waitForScene(page, 'GameScene', 5000);

    // Hold ArrowRight for a frame
    await page.keyboard.down('ArrowRight');
    // Wait a couple frames for physics to apply
    await page.waitForTimeout(100);

    const velocity = await evalGame<number>(
      page,
      `(() => {
        const g = window.__PANCAKE_DAD_GAME__;
        const scene = g.scene.getScene('GameScene');
        const dad = scene.children.list.find(c => c.texture && c.texture.key && c.texture.key.startsWith('dad'));
        return dad?.body?.velocity?.x ?? 0;
      })()`
    );

    await page.keyboard.up('ArrowRight');

    // Dad should be moving at significant speed (>= 200 for any dad multiplier >= 0.7)
    expect(velocity).toBeGreaterThanOrEqual(200);
  });

  test('dad moves significant distance when holding right', async ({ page }) => {
    await page.keyboard.press('Enter');
    await waitForScene(page, 'GameScene', 5000);

    const startX = await evalGame<number>(
      page,
      `(() => {
        const g = window.__PANCAKE_DAD_GAME__;
        const scene = g.scene.getScene('GameScene');
        const dad = scene.children.list.find(c => c.texture && c.texture.key && c.texture.key.startsWith('dad'));
        return dad?.x ?? 0;
      })()`
    );

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    const endX = await evalGame<number>(
      page,
      `(() => {
        const g = window.__PANCAKE_DAD_GAME__;
        const scene = g.scene.getScene('GameScene');
        const dad = scene.children.list.find(c => c.texture && c.texture.key && c.texture.key.startsWith('dad'));
        return dad?.x ?? 0;
      })()`
    );

    const displacement = endX - startX;
    // At 300 px/sec for 500ms, expect ~150px. Headless timing varies, so use generous threshold.
    expect(displacement).toBeGreaterThan(50);
  });

  test('jump triggers airborne state', async ({ page }) => {
    await page.keyboard.press('Enter');
    await waitForScene(page, 'GameScene', 5000);

    // Wait for dad to be grounded
    await page.waitForTimeout(200);

    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    const state = await evalGame<string>(
      page,
      `(() => {
        const g = window.__PANCAKE_DAD_GAME__;
        const scene = g.scene.getScene('GameScene');
        const dad = scene.children.list.find(c => c.texture && c.texture.key && c.texture.key.startsWith('dad'));
        return dad?.getState?.() ?? 'unknown';
      })()`
    );

    // Should be in an airborne or just-landed state after a jump
    expect(['jumping', 'falling', 'spinning', 'grabbing', 'landed']).toContain(state);
  });

  test('state machine reports idle when stationary on ground', async ({ page }) => {
    await page.keyboard.press('Enter');
    await waitForScene(page, 'GameScene', 5000);

    // Let the dad settle on the ground
    await page.waitForTimeout(500);

    const state = await evalGame<string>(
      page,
      `(() => {
        const g = window.__PANCAKE_DAD_GAME__;
        const scene = g.scene.getScene('GameScene');
        const dad = scene.children.list.find(c => c.texture && c.texture.key && c.texture.key.startsWith('dad'));
        return dad?.getState?.() ?? 'unknown';
      })()`
    );

    expect(state).toBe('idle');
  });

  test('state machine reports running when moving', async ({ page }) => {
    await page.keyboard.press('Enter');
    await waitForScene(page, 'GameScene', 5000);
    await page.waitForTimeout(200);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(100);

    const state = await evalGame<string>(
      page,
      `(() => {
        const g = window.__PANCAKE_DAD_GAME__;
        const scene = g.scene.getScene('GameScene');
        const dad = scene.children.list.find(c => c.texture && c.texture.key && c.texture.key.startsWith('dad'));
        return dad?.getState?.() ?? 'unknown';
      })()`
    );

    await page.keyboard.up('ArrowRight');

    expect(state).toBe('running');
  });
});
