import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe('JWT Pizza');
});

test('navigate to login page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  await expect(
    page.getByPlaceholder('Email address')
  ).toBeVisible();

  await expect(
    page.getByPlaceholder('Password')
  ).toBeVisible();
});


test('successful login with mocked API', async ({ page }) => {
  await page.route('**/api/auth', async (route) => {
    expect(route.request().method()).toBe('PUT');

    expect(route.request().postDataJSON()).toMatchObject({
      email: 'd@jwt.com',
      password: 'a',
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '3',
          name: 'Kai Chen',
          email: 'd@jwt.com',
          roles: [{ role: 'diner' }],
        },
        token: 'abcdef',
      }),
    });
  });

  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({
      json: {
        id: '3',
        name: 'Kai Chen',
        email: 'd@jwt.com',
        roles: [{ role: 'diner' }],
      },
    });
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');

  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();

  await expect.poll(
    () => page.evaluate(() => localStorage.getItem('token'))
  ).toBe('abcdef');
});
