import { test, expect } from 'playwright-test-coverage';

test('updateUser', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 100000)}@jwt.com`;

  await page.goto('/');

  await page.getByRole('link', { name: 'Register' }).click();

  await page.getByRole('textbox', { name: 'Full name' })
    .fill('pizza diner');

  await page.getByRole('textbox', { name: 'Email address' })
    .fill(email);

  await page.getByRole('textbox', { name: 'Password' })
    .fill('diner');

  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main'))
    .toContainText('pizza diner');

  await page.getByRole('button', { name: 'Edit' }).click();

  await expect(page.getByRole('dialog')).toBeVisible();

  await expect(page.locator('h3')).toContainText('Edit user');

  await page.getByRole('dialog')
    .getByRole('textbox')
    .first()
    .fill('pizza dinerx');

  await page.getByRole('button', { name: 'Update' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();

  await expect(page.getByRole('main'))
    .toContainText('pizza dinerx');
  
  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', {
    name: 'Email address'
  }).fill(email);

  await page.getByRole('textbox', {
    name: 'Password'
  }).fill('diner');

  await page.getByRole('button', {
    name: 'Login'
  }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main'))
    .toContainText('pizza dinerx');  
});

test('updateUserEmail', async ({ page }) => {
  const email = `user${Date.now()}@jwt.com`;
  const newEmail = `updated${Date.now()}@jwt.com`;

  await page.goto('/');

  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('email tester');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'et' }).click();

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.locator('#edit-email').fill(newEmail);
  await page.getByRole('button', { name: 'Update' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill(newEmail);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'et' }).click();

  await expect(page.getByRole('main')).toContainText(newEmail);
});
