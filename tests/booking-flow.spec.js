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

async function clearBookings(page) {
  await page.goto(`${BASE_URL}/bookings`);
  const alreadyEmpty = await page.getByText('No bookings yet').isVisible().catch(() => false);
  if (alreadyEmpty) return;
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /clear all bookings/i }).click();
  await expect(page.getByText('No bookings yet')).toBeVisible();
}

/** Navigates to the detail page of the first bookable event. Returns its title. */
async function goToFirstBookableEvent(page) {
  await page.goto(`${BASE_URL}/events`);
  const firstCard = page.getByTestId('event-card').filter({
    has: page.getByTestId('book-now-btn'),
  }).first();
  await expect(firstCard).toBeVisible();
  const eventTitle = (await firstCard.locator('h3').textContent())?.trim() ?? '';
  await firstCard.getByTestId('book-now-btn').click();
  await expect(page).toHaveURL(/\/events\/\d+/);
  return eventTitle;
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Booking Flow — Creation', () => {

  // TC-BKF-001 ───────────────────────────────────────────────────────────────
  test('TC-BKF-001: book a single ticket and see booking reference on confirmation', async ({ page }) => {
    // -- Step 1: Login and clear prior bookings --
    await login(page);
    await clearBookings(page);

    // -- Step 2: Navigate to first bookable event --
    const eventTitle = await goToFirstBookableEvent(page);

    // -- Step 3: Fill booking form (quantity stays at default 1) --
    await page.getByLabel('Full Name').fill('Jane Doe');
    await page.locator('#customer-email').fill('janedoe@example.com');
    await page.getByPlaceholder('+91 98765 43210').fill('9876543210');
    await page.locator('.confirm-booking-btn').click();

    // -- Step 4: Assert confirmation card shows a valid booking reference --
    const refEl = page.locator('.booking-ref').first();
    await expect(refEl).toBeVisible();
    const bookingRef = (await refEl.textContent())?.trim() ?? '';
    expect(bookingRef).toMatch(/^[A-Z]-[A-Z0-9]{6}$/);
    console.log(`Booking confirmed. Ref: ${bookingRef}, Event: "${eventTitle}"`);
  });

  // TC-BKF-002 ───────────────────────────────────────────────────────────────
  test('TC-BKF-002: booking ref first character matches event title first letter', async ({ page }) => {
    // -- Step 1: Login and clear state --
    await login(page);
    await clearBookings(page);

    // -- Step 2: Navigate to first bookable event and capture title --
    const eventTitle = await goToFirstBookableEvent(page);

    // -- Step 3: Complete booking --
    await page.getByLabel('Full Name').fill('Jane Doe');
    await page.locator('#customer-email').fill('janedoe@example.com');
    await page.getByPlaceholder('+91 98765 43210').fill('9876543210');
    await page.locator('.confirm-booking-btn').click();

    // -- Step 4: Assert ref prefix matches event title's first character --
    const bookingRef = (await page.locator('.booking-ref').first().textContent())?.trim() ?? '';
    const expectedPrefix = eventTitle[0].toUpperCase();
    expect(bookingRef).toMatch(new RegExp(`^${expectedPrefix}-[A-Z0-9]{6}$`));
    console.log(`Ref "${bookingRef}" starts with "${expectedPrefix}" for event "${eventTitle}"`);
  });

  // TC-BKF-003 ───────────────────────────────────────────────────────────────
  test('TC-BKF-003: booking multiple tickets increases quantity in booking detail', async ({ page }) => {
    // -- Step 1: Login and clear state --
    await login(page);
    await clearBookings(page);

    // -- Step 2: Navigate to first bookable event --
    await goToFirstBookableEvent(page);

    // -- Step 3: Increase quantity to 2 using the + button --
    await page.getByRole('button', { name: '+' }).click();
    await expect(page.getByTestId('quantity-input')).toHaveValue('2');

    // -- Step 4: Complete booking --
    await page.getByLabel('Full Name').fill('Jane Doe');
    await page.locator('#customer-email').fill('janedoe@example.com');
    await page.getByPlaceholder('+91 98765 43210').fill('9876543210');
    await page.locator('.confirm-booking-btn').click();

    const bookingRef = (await page.locator('.booking-ref').first().textContent())?.trim() ?? '';
    await expect(page.locator('.booking-ref').first()).toBeVisible();
    console.log(`Multi-ticket booking. Ref: ${bookingRef}`);

    // -- Step 5: Navigate to booking detail and verify 2 tickets shown --
    await page.goto(`${BASE_URL}/bookings`);
    const card = page.getByTestId('booking-card').filter({ hasText: bookingRef });
    await card.getByRole('link', { name: 'View Details' }).click();
    await expect(page).toHaveURL(/\/bookings\/\d+/);
    await expect(page.locator('.ticket-count').first()).toContainText('2');
  });

  // TC-BKF-004 ───────────────────────────────────────────────────────────────
  test('TC-BKF-004: available seats decrease by 1 after a single-ticket booking', async ({ page }) => {
    // -- Step 1: Login and clear state --
    await login(page);
    await clearBookings(page);

    // -- Step 2: Navigate to event detail and capture available seats before booking --
    await goToFirstBookableEvent(page);
    const eventUrl = page.url();
    const seatsTextBefore = (await page.getByText(/\d+\s+seats?\s+available/i).first().textContent()) ?? '';
    const seatsBefore = parseInt(seatsTextBefore.match(/(\d+)/)?.[1] ?? '0', 10);
    console.log(`Seats before booking: ${seatsBefore}`);

    // -- Step 3: Complete booking for 1 ticket --
    await page.getByLabel('Full Name').fill('Jane Doe');
    await page.locator('#customer-email').fill('janedoe@example.com');
    await page.getByPlaceholder('+91 98765 43210').fill('9876543210');
    await page.locator('.confirm-booking-btn').click();
    await expect(page.locator('.booking-ref').first()).toBeVisible();

    // -- Step 4: Navigate back to same event and read updated seat count --
    await page.goto(eventUrl);
    const seatsTextAfter = (await page.getByText(/\d+\s+seats?\s+available/i).first().textContent()) ?? '';
    const seatsAfter = parseInt(seatsTextAfter.match(/(\d+)/)?.[1] ?? '0', 10);
    console.log(`Seats after booking: ${seatsAfter}`);

    // -- Step 5: Assert seats decreased by exactly 1 --
    expect(seatsAfter).toBe(seatsBefore - 1);
  });

  // TC-BKF-005 ───────────────────────────────────────────────────────────────
  test('TC-BKF-005: submitting booking form with empty name does not confirm booking', async ({ page }) => {
    // -- Step 1: Login and navigate to a bookable event --
    await login(page);
    await goToFirstBookableEvent(page);

    // -- Step 2: Leave Full Name empty, fill other fields --
    await page.locator('#customer-email').fill('janedoe@example.com');
    await page.getByPlaceholder('+91 98765 43210').fill('9876543210');
    await page.locator('.confirm-booking-btn').click();

    // -- Step 3: Assert no confirmation card — still on event detail page --
    await expect(page).toHaveURL(/\/events\/\d+/);
    await expect(page.locator('.booking-ref')).not.toBeVisible();
  });

});
