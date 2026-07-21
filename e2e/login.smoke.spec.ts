import { expect, test } from '@playwright/test';

test('login screen is available without exposing a public registration flow', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading')).toBeVisible();
  await expect(page.getByRole('link', { name: /register|sign up/i })).toHaveCount(0);
});
