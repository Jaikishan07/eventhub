import { test, expect } from '@playwright/test';

const BASE_URL      = 'https://eventhub.rahulshettyacademy.com';
const USER_EMAIL    = 'rahulshetty1@gmail.com';
const USER_PASSWORD = 'Magiclife1!';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@email.com').fill(USER_EMAIL);
  await page.getByLabel('Password').fill(USER_PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page.getByRole('link', { name: /Browse Events/i }).first()).toBeVisible();
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Event Browsing & Filtering', () => {

  // TC-EVT-001 ───────────────────────────────────────────────────────────────
  test('TC-EVT-001: events list page loads with event cards', async ({ page }) => {
    // -- Step 1: Login and navigate to events page --
    await login(page);
    await page.goto(`${BASE_URL}/events`);

    // -- Step 2: Assert at least one event card is visible --
    const cards = page.getByTestId('event-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`Events list loaded with ${count} card(s)`);
  });

  // TC-EVT-002 ───────────────────────────────────────────────────────────────
  test('TC-EVT-002: search by title filters displayed events', async ({ page }) => {
    // -- Step 1: Login and navigate to events page --
    await login(page);
    await page.goto(`${BASE_URL}/events`);

    // -- Step 2: Type a known event title into the search field --
    await page.getByPlaceholder(/search/i).fill('Tech Conference');

    // -- Step 3: Assert first card matches the search term --
    const cards = page.getByTestId('event-card');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText('Tech Conference');
    console.log(`Search returned ${await cards.count()} result(s)`);
  });

  // TC-EVT-003 ───────────────────────────────────────────────────────────────
  test('TC-EVT-003: category filter shows only matching events', async ({ page }) => {
    // -- Step 1: Login and navigate to events page --
    await login(page);
    await page.goto(`${BASE_URL}/events`);

    // -- Step 2: Select "Conference" from the category dropdown --
    await page.getByRole('combobox', { name: /category/i }).selectOption('Conference');

    // -- Step 3: Assert every visible card is a Conference event --
    const cards = page.getByTestId('event-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('Conference');
    }
    console.log(`Category filter returned ${count} Conference event(s)`);
  });

  // TC-EVT-004 ───────────────────────────────────────────────────────────────
  test('TC-EVT-004: city filter shows only events in selected city', async ({ page }) => {
    // -- Step 1: Login and navigate to events page --
    await login(page);
    await page.goto(`${BASE_URL}/events`);

    // -- Step 2: Select "Bangalore" from the city dropdown --
    await page.getByRole('combobox', { name: /city/i }).selectOption('Bangalore');

    // -- Step 3: Assert every visible card mentions Bangalore --
    const cards = page.getByTestId('event-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('Bangalore');
    }
    console.log(`City filter returned ${count} Bangalore event(s)`);
  });

  // TC-EVT-005 ───────────────────────────────────────────────────────────────
  test('TC-EVT-005: clicking Book Now navigates to event detail page', async ({ page }) => {
    // -- Step 1: Login and navigate to events page --
    await login(page);
    await page.goto(`${BASE_URL}/events`);

    // -- Step 2: Click Book Now on the first bookable event card --
    const firstCard = page.getByTestId('event-card').filter({
      has: page.getByTestId('book-now-btn'),
    }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.getByTestId('book-now-btn').click();

    // -- Step 3: Assert navigation to event detail URL --
    await expect(page).toHaveURL(/\/events\/\d+/);

    // -- Step 4: Assert booking form elements are present --
    await expect(page.getByTestId('quantity-input')).toBeVisible();
    await expect(page.getByLabel('Full Name')).toBeVisible();
  });

  // TC-EVT-006 ───────────────────────────────────────────────────────────────
  test('TC-EVT-006: navbar Events link navigates to events list', async ({ page }) => {
    // -- Step 1: Login (lands on home) --
    await login(page);

    // -- Step 2: Click the Events link in the navbar --
    await page.getByTestId('nav-events').click();

    // -- Step 3: Assert events list page is shown --
    await expect(page).toHaveURL(`${BASE_URL}/events`);
    await expect(page.getByTestId('event-card').first()).toBeVisible();
  });

});
