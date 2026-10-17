
import { test, expect } from 'playwright-test-coverage';
import { randomUUID } from 'node:crypto';

test('admin can delete a user', async ({ page, request }) => {
  test.setTimeout(45000);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('Missing admin test credentials');
  }

  const unique = randomUUID().slice(0, 8);
  const dinerName = `Delete Test ${unique}`;
  const dinerEmail = `delete-${unique}@jwt.com`;

  // 1. Register a disposable diner through the backend
  const registration = await request.post(
    'http://localhost:3000/api/auth',
    {
      data: {
        name: dinerName,
        email: dinerEmail,
        password: 'test-password-123',
      },
    }
  );

  expect(registration.ok()).toBeTruthy();

  // 2. Log in through the frontend as administrator
  await page.goto('/login');

  await page.getByRole('textbox', {
    name: 'Email address',
  }).fill(adminEmail);

  await page.getByRole('textbox', {
    name: 'Password',
  }).fill(adminPassword);

  await page.getByRole('button', {
    name: 'Login',
  }).click();

  await expect(
    page.getByRole('link', { name: 'Logout' })
  ).toBeVisible();

  // 3. Open the admin dashboard
  await page.goto('/admin-dashboard');

  await expect(
    page.getByRole('heading', { name: 'Users' })
  ).toBeVisible();

  // 4. Search for the disposable diner
  await page.getByRole('textbox', {
    name: 'Filter users by name',
  }).fill(dinerName);

  await page.getByRole('button', {
    name: 'Search',
  }).click();

  const userTable = page.getByRole('table').last();
  const dinerRow = userTable.getByRole('row', {
    name: new RegExp(dinerName),
  });

  await expect(dinerRow).toBeVisible();
  await expect(dinerRow).toContainText(dinerEmail);

  // 5. Accept the deletion confirmation
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    await dialog.accept();
  });

  await dinerRow.getByRole('button', {
    name: 'Delete',
  }).click();

  // 6. Verify diner is removed
  await expect(dinerRow).toHaveCount(0);

  // 7. Refresh and verify deletion persists
  await page.reload();

  await expect(
    page.getByRole('heading', { name: 'Users' })
  ).toBeVisible();

  await page.getByRole('textbox', {
    name: 'Filter users by name',
  }).fill(dinerName);

  await page.getByRole('button', {
    name: 'Search',
  }).click();

  await expect(
    page.getByRole('table').last()
  ).not.toContainText(dinerEmail);
});
