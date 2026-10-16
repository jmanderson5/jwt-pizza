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


test('select pizzas and proceed to checkout', async ({ page }) => {
  // Mock the pizza menu
  await page.route('**/api/order/menu', async (route) => {
    await route.fulfill({
      json: [
        {
          id: '1',
          title: 'Veggie',
          image: 'pizza1.png',
          price: 0.0038,
          description: 'A garden of delight',
        },
        {
          id: '2',
          title: 'Pepperoni',
          image: 'pizza2.png',
          price: 0.0042,
          description: 'Spicy treat',
        },
      ],
    });
  });

  // Mock the list of franchises and stores
  await page.route('**/api/franchise?*', async (route) => {
    await route.fulfill({
      json: {
        franchises: [
          {
            id: '2',
            name: 'LotaPizza',
            stores: [
              { id: '4', name: 'Lehi' },
              { id: '5', name: 'Springville' },
            ],
          },
        ],
        more: false,
      },
    });
  });

  await page.goto('/');

  // Navigate to the menu
  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page.getByRole('heading', {
    name: 'Awesome is a click away',
  })).toBeVisible();

  // Select store
  await page.getByRole('combobox').selectOption('4');

  // Choose two pizzas
  await page.getByRole('button', { name: /Veggie/ }).click();
  await page.getByRole('button', { name: /Pepperoni/ }).click();

  await expect(
    page.getByText('Selected pizzas: 2')
  ).toBeVisible();

  // Checkout
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Verify that checkout requests login
  await expect(
    page.getByPlaceholder('Email address')
  ).toBeVisible();
});
