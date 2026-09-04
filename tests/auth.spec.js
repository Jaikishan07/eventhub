import { test, expect } from '@playwright/test';

const BASE_URL      = 'https://eventhub.rahulshettyacademy.com';
const USER_EMAIL    = 'rahulshetty1@gmail.com';
const USER_PASSWORD = 'Magiclife1!';

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Authentication', () => {

  // TC-AUTH-001 ──────────────────────────────────────────────────────────────
  test('TC-AUTH-001: successful login redirects to home page', async ({ page }) => {
    // -- Step 1: Navigate to login page --
    await page.goto(`${BASE_URL}/login`);

    // -- Step 2: Fill valid credentials and submit --
    await page.getByPlaceholder('you@email.com').fill(USER_EMAIL);
    await page.getByLabel('Password').fill(USER_PASSWORD);
    await page.locator('#login-btn').click();

    // -- Step 3: Assert home page loads with Browse Events link --
    await expect(page.getByRole('link', { name: /Browse Events/i }).first()).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  // TC-AUTH-002 ──────────────────────────────────────────────────────────────
  test('TC-AUTH-002: login with wrong password shows error and stays on login page', async ({ page }) => {
    // -- Step 1: Navigate to login page --
    await page.goto(`${BASE_URL}/login`);

    // -- Step 2: Fill correct email but wrong password --
    await page.getByPlaceholder('you@email.com').fill(USER_EMAIL);
    await page.getByLabel('Password').fill('WrongPass99!');
    await page.locator('#login-btn').click();

    // -- Step 3: Assert error message and no redirect --
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  // TC-AUTH-003 ──────────────────────────────────────────────────────────────
  test('TC-AUTH-003: register a new user and land on home page', async ({ page }) => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    // -- Step 1: Navigate to register page --
    await page.goto(`${BASE_URL}/register`);

    // -- Step 2: Fill registration form with valid unique credentials --
    await page.getByTestId('register-email').fill(uniqueEmail);
    await page.getByTestId('register-password').fill('TestPass1!');
    await page.getByTestId('register-btn').click();

    // -- Step 3: Assert redirect to home with authenticated UI --
    await expect(page.getByRole('link', { name: /Browse Events/i }).first()).toBeVisible();
    console.log(`Registered new user: ${uniqueEmail}`);
  });

  // TC-AUTH-004 ──────────────────────────────────────────────────────────────
  test('TC-AUTH-004: register with already-registered email shows error', async ({ page }) => {
    // -- Step 1: Navigate to register page --
    await page.goto(`${BASE_URL}/register`);

    // -- Step 2: Submit form using an email that already exists --
    await page.getByTestId('register-email').fill(USER_EMAIL);
    await page.getByTestId('register-password').fill(USER_PASSWORD);
    await page.getByTestId('register-btn').click();

    // -- Step 3: Assert error message and no redirect --
    await expect(page.getByText(/already (exists|registered|taken)/i)).toBeVisible();
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

});
