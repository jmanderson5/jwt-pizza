
import { test, expect } from 'playwright-test-coverage';

test('admin can list and filter users', async ({ page }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD before running this test.'
    );
  }

  // Log in as administrator
  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' })
    .fill(adminEmail);

  await page.getByRole('textbox', { name: 'Password' })
    .fill(adminPassword);

  await page.getByRole('button', { name: 'Login' }).click();

  // Verify that login succeeded
  await expect(
    page.getByRole('link', { name: 'Logout' })
  ).toBeVisible();

  // Navigate to the administrator dashboard
  await page.goto('/admin-dashboard');

  // Verify we're on the correct page
  await expect(
    page.getByRole('heading', { name: 'Users' })
  ).toBeVisible();

  // Verify the Users table loads
  await expect(
    page.getByRole('heading', { name: 'Users' })
  ).toBeVisible();

  await expect(
    page.getByRole('table').last()
  ).toContainText(adminEmail);

  // Filter using the administrator's name
  await page.getByRole('textbox', {
    name: 'Filter users by name'
  }).fill('Test Admin');

  await page.getByRole('button', {
    name: 'Search'
  }).click();

  await expect(
    page.getByRole('table').last()
  ).toContainText('Test Admin');
});
