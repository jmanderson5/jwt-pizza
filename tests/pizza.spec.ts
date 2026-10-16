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


test('complete pizza purchase with mocked backend', async ({ page }) => {
  const user = {
    id: '3',
    name: 'Kai Chen',
    email: 'd@jwt.com',
    roles: [{ role: 'diner' }],
  };

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

  // Mock available stores
  await page.route('**/api/franchise?*', async (route) => {
    await route.fulfill({
      json: {
        franchises: [
          {
            id: '2',
            name: 'LotaPizza',
            stores: [{ id: '4', name: 'Lehi' }],
          },
        ],
        more: false,
      },
    });
  });

  // Mock authentication
  await page.route('**/api/auth', async (route) => {
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject({
      email: 'd@jwt.com',
      password: 'a',
    });

    await route.fulfill({
      json: { user, token: 'abcdef' },
    });
  });

  // Mock current user
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: user });
  });

  // Mock pizza order submission
  await page.route('**/api/order', async (route) => {
    expect(route.request().method()).toBe('POST');

    const order = route.request().postDataJSON();

    expect(order.items).toHaveLength(2);
    expect(order.storeId).toBe('4');

    await route.fulfill({
      json: {
        order: { ...order, id: '23' },
        jwt: 'test-pizza-jwt',
      },
    });
  });

  // Start shopping
  await page.goto('/');
  await page.getByRole('button', { name: 'Order now' }).click();

  // Select store and pizzas
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('button', { name: /Veggie/ }).click();
  await page.getByRole('button', { name: /Pepperoni/ }).click();

  await expect(
    page.getByText('Selected pizzas: 2')
  ).toBeVisible();

  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login during checkout
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Confirm order
  await expect(
    page.getByText('Send me those 2 pizzas right now!')
  ).toBeVisible();

  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');

  // Pay for the order
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Verify delivery confirmation
  await expect(
    page.getByText('Here is your JWT Pizza!')
  ).toBeVisible();

  await expect(page.getByText('test-pizza-jwt')).toBeVisible();
});


test('register a new user with mocked API', async ({ page }) => {
  const newUser = {
    id: '10',
    name: 'Test User',
    email: 'test@example.com',
    roles: [{ role: 'diner' }],
  };

  await page.route('**/api/auth', async (route) => {
    expect(route.request().method()).toBe('POST');

    expect(route.request().postDataJSON()).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    await route.fulfill({
      status: 200,
      json: {
        user: newUser,
        token: 'registration-test-token',
      },
    });
  });

  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: newUser });
  });

  // Begin on the login page
  await page.goto('/login');

  // Follow the registration link
  await page.getByRole('link', { name: 'Register' }).click();

  await expect(
    page.getByText('Welcome to the party')
  ).toBeVisible();

  // Complete registration
  await page.getByPlaceholder('Full name').fill('Test User');
  await page.getByPlaceholder('Email address').fill('test@example.com');
  await page.getByPlaceholder('Password').fill('password123');

  await page.getByRole('button', { name: 'Register' }).click();

  // Verify authentication
  await expect(
    page.getByRole('link', { name: 'TU' })
  ).toBeVisible();

  await expect.poll(
    () => page.evaluate(() => localStorage.getItem('token'))
  ).toBe('registration-test-token');
});

test('franchise dashboard displays stores', async ({ page }) => {
  const user = {
    id: '5',
    name: 'Franchise Owner',
    email: 'owner@jwt.com',
    roles: [{ role: 'franchisee', objectId: '2' }],
  };

  // Mock the logged-in user
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: user });
  });

  // Mock the franchise belonging to the user
  await page.route('**/api/franchise/5', async (route) => {
    expect(route.request().method()).toBe('GET');

    await route.fulfill({
      json: [
        {
          id: '2',
          name: 'LotaPizza',
          stores: [
            {
              id: '4',
              name: 'Lehi',
              totalRevenue: 100,
            },
            {
              id: '5',
              name: 'Springville',
              totalRevenue: 200,
            },
          ],
        },
      ],
    });
  });

  // Set up the authenticated session
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-franchise-token');
  });

  // Open the franchise dashboard
  await page.goto('/franchise-dashboard');

  // Verify the franchise is displayed
  await expect(
    page.getByText('LotaPizza')
  ).toBeVisible();

  // Verify the store information
  await expect(page.locator('tbody')).toContainText('Lehi');
  await expect(page.locator('tbody')).toContainText('Springville');

  // Verify the create-store button exists
  await expect(
    page.getByRole('button', { name: 'Create store' })
  ).toBeVisible();
});

test('franchise owner creates a store', async ({ page }) => {
  const user = {
    id: '5',
    name: 'Franchise Owner',
    email: 'owner@jwt.com',
    roles: [{ role: 'franchisee', objectId: '2' }],
  };

  const franchise = {
    id: '2',
    name: 'LotaPizza',
    stores: [{ id: '4', name: 'Lehi', totalRevenue: 100 }],
  };

  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: user });
  });

  await page.route('**/api/franchise/5', async (route) => {
    await route.fulfill({ json: [franchise] });
  });

  // Mock store creation
  await page.route('**/api/franchise/2/store', async (route) => {
    expect(route.request().method()).toBe('POST');

    expect(route.request().postDataJSON()).toMatchObject({
      name: 'Provo',
    });

    // Include the new store in subsequent dashboard requests
    franchise.stores.push({
      id: '6',
      name: 'Provo',
      totalRevenue: 0,
    });

    await route.fulfill({
      json: {
        id: '6',
        name: 'Provo',
      },
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-franchise-token');
  });

  await page.goto('/franchise-dashboard');

  await expect(page.getByText('LotaPizza')).toBeVisible();

  // Open store creation page
  await page.getByRole('button', { name: 'Create store' }).click();

  await expect(
    page.getByText('Create store')
  ).toBeVisible();

  // Enter store information
  await page.getByPlaceholder('store name').fill('Provo');

  await page.getByRole('button', { name: 'Create', exact: true }).click();

  // Verify the new store appears
  await expect(page.locator('tbody')).toContainText('Provo');
});

test('diner dashboard displays order history', async ({ page }) => {
  const user = {
    id: '3',
    name: 'Kai Chen',
    email: 'd@jwt.com',
    roles: [{ role: 'diner' }],
  };

  // Mock the authenticated user
  await page.route('**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: user });
  });

  // Mock order history
  await page.route('**/api/order', async (route) => {
    expect(route.request().method()).toBe('GET');

    await route.fulfill({
      json: {
        dinerId: '3',
        orders: [
          {
            id: '42',
            franchiseId: '2',
            storeId: '4',
            date: '2026-10-16',
            items: [
              {
                menuId: '1',
                description: 'Veggie',
                price: 0.0038,
              },
              {
                menuId: '2',
                description: 'Pepperoni',
                price: 0.0042,
              },
            ],
          },
        ],
      },
    });
  });

  // Simulate an authenticated session
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-diner-token');
  });

  await page.goto('/diner-dashboard');

  // Verify dashboard loads
  await expect(
    page.getByText('Your pizza kitchen')
  ).toBeVisible();

  // Verify user information
  await expect(
    page.getByText('Kai Chen')
  ).toBeVisible();

  await expect(
    page.getByText('d@jwt.com')
  ).toBeVisible();

  // Verify order history
  await expect(
    page.getByText('Here is your history of all the good times.')
  ).toBeVisible();

  await expect(page.locator('tbody')).toContainText('42');
  await expect(page.locator('tbody')).toContainText('0.008');
  await expect(page.locator('tbody')).toContainText('2026-10-16');
});

test('admin creates a new franchise', async ({ page }) => {
  const admin = {
    id: '1',
    name: 'Pizza Admin',
    email: 'admin@jwt.com',
    roles: [{ role: 'admin' }],
  };

  const franchises = [
    {
      id: '2',
      name: 'LotaPizza',
      admins: [{ name: 'Franchise Owner', email: 'owner@jwt.com' }],
      stores: [{ id: '4', name: 'Lehi', totalRevenue: 100 }],
    },
  ];

  // Mock authenticated admin
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: admin });
  });

  // Mock franchise listing and creation
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: { franchises, more: false },
      });
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();

      expect(body).toMatchObject({
        name: 'Provo Pizza',
        admins: [{ email: 'owner@jwt.com' }],
      });

      franchises.push({
        id: '3',
        name: body.name,
        admins: [{ name: 'Franchise Owner', email: 'owner@jwt.com' }],
        stores: [],
      });

      await route.fulfill({
        json: franchises[franchises.length - 1],
      });
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-admin-token');
  });

  // Open admin dashboard
  await page.goto('/admin-dashboard');

  await expect(
    page.getByText("Mama Ricci's kitchen")
  ).toBeVisible();

  await expect(page.getByText('LotaPizza')).toBeVisible();

  // Open franchise creation
  await page.getByRole('button', { name: 'Add Franchise' }).click();

  await expect(
    page.getByText('Want to create franchise?')
  ).toBeVisible();

  // Complete form
  await page.getByPlaceholder('franchise name').fill('Provo Pizza');
  await page.getByPlaceholder('franchisee admin email')
    .fill('owner@jwt.com');

  await page.getByRole('button', { name: 'Create', exact: true }).click();

  // Verify dashboard updates
  await expect(page.getByText('Provo Pizza')).toBeVisible();
});
